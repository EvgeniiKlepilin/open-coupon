import type { DetectionResult, SelectorConfig, DetectorOptions } from '../types';
import { isValidDOMElement } from '@/utils/security';

// Default configuration
const DEFAULT_KEYWORDS = [
  'coupon',
  'promo',
  'promotional',
  'discount',
  'voucher',
  'code',
  'gift',
];

const DEFAULT_OPTIONS: Required<DetectorOptions> = {
  selectorConfig: {},
  keywords: DEFAULT_KEYWORDS,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Cache configuration
const CACHE_TTL = 60000; // 1 minute
const CACHE_KEY_PREFIX = 'detection_cache_';

/**
 * Gets cached detection result from chrome.storage.session
 * Avoids race conditions by using browser storage instead of module-level state
 */
async function getCachedResult(): Promise<DetectionResult | null> {
  try {
    const key = `${CACHE_KEY_PREFIX}${window.location.href}`;
    const result = await chrome.storage.session.get(key);
    const entry = result[key] as { data: DetectionResult; timestamp: number } | undefined;

    if (!entry) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      await chrome.storage.session.remove(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.warn('[Detector] Failed to read cache:', error);
    return null;
  }
}

/**
 * Saves detection result to chrome.storage.session
 */
async function setCachedResult(data: DetectionResult): Promise<void> {
  try {
    const key = `${CACHE_KEY_PREFIX}${window.location.href}`;
    await chrome.storage.session.set({
      [key]: {
        data,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.warn('[Detector] Failed to save cache:', error);
  }
}

/**
 * Main detection function that tries multiple strategies to find coupon input fields
 * @param options - Configuration options for detection
 * @returns Promise resolving to detection result
 */
export async function findCouponElements(
  options?: DetectorOptions
): Promise<DetectionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check cache first (using chrome.storage.session to avoid race conditions)
  const cachedResult = await getCachedResult();
  if (cachedResult) {
    console.debug('[Detector] Returning cached result');
    return cachedResult;
  }

  // Try retailer-specific selectors first (highest priority)
  if (opts.selectorConfig && Object.keys(opts.selectorConfig).length > 0) {
    console.debug('[Detector] Trying retailer-specific selectors');
    const result = findByRetailerConfig(opts.selectorConfig);
    if (result && result.confidence >= 30) {
      await setCachedResult(result);
      return result;
    }
  }

  // Try attribute-based detection
  console.debug('[Detector] Trying attribute-based detection');
  let result = findByAttributes(opts.keywords);
  if (result && result.confidence >= 30) {
    await setCachedResult(result);
    return result;
  }

  // Try label-based detection
  console.debug('[Detector] Trying label-based detection');
  result = findByLabel(opts.keywords);
  if (result && result.confidence >= 30) {
    await setCachedResult(result);
    return result;
  }

  // Wait for dynamic content with retries
  console.debug('[Detector] Waiting for dynamic content');
  for (let i = 0; i < opts.retryAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, opts.retryDelay));

    // Retry attribute detection
    result = findByAttributes(opts.keywords);
    if (result && result.confidence >= 30) {
      await setCachedResult(result);
      return result;
    }

    // Retry label detection
    result = findByLabel(opts.keywords);
    if (result && result.confidence >= 30) {
      await setCachedResult(result);
      return result;
    }
  }

  // No suitable element found
  const nullResult: DetectionResult = {
    inputElement: null,
    submitElement: null,
    confidence: 0,
    detectionMethod: 'heuristic',
  };

  console.debug('[Detector] No coupon field detected');
  await setCachedResult(nullResult);
  return nullResult;
}

/**
 * Find elements using retailer-specific CSS selectors
 * @param config - Retailer selector configuration
 * @returns Detection result or null
 */
export function findByRetailerConfig(
  config: SelectorConfig
): DetectionResult | null {
  try {
    // Security: Validate selector and element before interaction
    const inputElement = config.input
      ? document.querySelector(config.input)
      : null;

    // Security: Validate element is safe to interact with
    if (!inputElement || !isValidDOMElement(inputElement) || !isElementValid(inputElement)) {
      return null;
    }

    // Type guard ensures it's HTMLInputElement
    if (!(inputElement instanceof HTMLInputElement)) {
      return null;
    }

    const submitElement = config.submit
      ? document.querySelector(config.submit)
      : findSubmitButton(inputElement);

    // Security: Validate submit element
    if (submitElement && !isValidDOMElement(submitElement)) {
      return null;
    }

    const containerElement = config.container
      ? document.querySelector(config.container)
      : inputElement.closest('form');

    // Security: Validate container element
    if (containerElement && !isValidDOMElement(containerElement)) {
      return null;
    }

    // Convert null to undefined for containerElement
    const safeContainerElement = containerElement || undefined;

    return {
      inputElement,
      submitElement,
      confidence: 100,
      detectionMethod: 'retailer-specific',
      containerElement: safeContainerElement,
    };
  } catch (error) {
    console.debug('[Detector] Error in retailer config detection:', error);
    return null;
  }
}

/**
 * Find elements by searching for keywords in element attributes
 * @param keywords - List of keywords to search for
 * @returns Detection result or null
 */
export function findByAttributes(keywords: string[]): DetectionResult | null {
  try {
    const inputs = Array.from(
      document.querySelectorAll<HTMLInputElement>(
        'input[type="text"], input[type="search"], input:not([type])'
      )
    );

    let bestMatch: {
      element: HTMLInputElement;
      score: number;
      matchCount: number;
    } | null = null;

    for (const input of inputs) {
      if (!isElementValid(input)) continue;

      const attributes = [
        input.id,
        input.name,
        input.placeholder,
        input.getAttribute('aria-label'),
        input.className,
        ...Array.from(input.attributes)
          .filter((attr) => attr.name.startsWith('data-'))
          .map((attr) => attr.value),
      ];

      const attributeText = attributes.join(' ').toLowerCase();
      let matchCount = 0;

      for (const keyword of keywords) {
        if (attributeText.includes(keyword.toLowerCase())) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const score = matchCount > 1 ? 90 : 70;
        if (!bestMatch || matchCount > bestMatch.matchCount) {
          bestMatch = { element: input, score, matchCount };
        }
      }
    }

    if (!bestMatch) return null;

    const submitElement = findSubmitButton(bestMatch.element);
    const containerElement =
      (bestMatch.element.closest('form') as HTMLElement) || undefined;

    return {
      inputElement: bestMatch.element,
      submitElement,
      confidence: bestMatch.score,
      detectionMethod: 'attribute',
      containerElement,
    };
  } catch (error) {
    console.debug('[Detector] Error in attribute detection:', error);
    return null;
  }
}

/**
 * Find elements by searching for keywords in associated label text
 * @param keywords - List of keywords to search for
 * @returns Detection result or null
 */
export function findByLabel(keywords: string[]): DetectionResult | null {
  try {
    const labels = Array.from(document.querySelectorAll<HTMLLabelElement>('label'));

    for (const label of labels) {
      const labelText = label.textContent?.toLowerCase() || '';
      const hasKeyword = keywords.some((keyword) =>
        labelText.includes(keyword.toLowerCase())
      );

      if (!hasKeyword) continue;

      // Try to find associated input via 'for' attribute
      let inputElement: HTMLInputElement | null = null;

      if (label.htmlFor) {
        const element = document.getElementById(label.htmlFor);
        // Security: Validate element before using
        if (element && isValidDOMElement(element) && element instanceof HTMLInputElement) {
          inputElement = element;
        }
      }

      // If not found, try to find input within the label
      if (!inputElement) {
        const element = label.querySelector<HTMLInputElement>(
          'input[type="text"], input[type="search"], input:not([type])'
        );
        // Security: Validate element before using
        if (element && isValidDOMElement(element)) {
          inputElement = element;
        }
      }

      // If still not found, try next sibling
      if (!inputElement) {
        const next = label.nextElementSibling;
        if (next && next.matches('input[type="text"], input[type="search"], input:not([type])')) {
          inputElement = next as HTMLInputElement;
        }
      }

      if (inputElement && isElementValid(inputElement)) {
        const submitElement = findSubmitButton(inputElement);
        const containerElement =
          (inputElement.closest('form') as HTMLElement) || undefined;

        return {
          inputElement,
          submitElement,
          confidence: 60,
          detectionMethod: 'label',
          containerElement,
        };
      }
    }

    return null;
  } catch (error) {
    console.debug('[Detector] Error in label detection:', error);
    return null;
  }
}

/**
 * Find the submit button associated with an input element
 * @param inputElement - The input element to find the submit button for
 * @returns The submit button element or null
 */
export function findSubmitButton(
  inputElement: HTMLInputElement
): HTMLElement | null {
  try {
    // First try to find button in same form
    const form = inputElement.closest('form');
    if (form) {
      const submitButton = form.querySelector<HTMLElement>(
        'button[type="submit"], input[type="submit"]'
      );
      if (submitButton && isElementVisible(submitButton)) {
        return submitButton;
      }

      // Look for buttons with relevant text
      const buttons = Array.from(form.querySelectorAll<HTMLElement>('button'));
      for (const button of buttons) {
        const buttonText = button.textContent?.toLowerCase() || '';
        if (
          buttonText.includes('apply') ||
          buttonText.includes('submit') ||
          buttonText.includes('use')
        ) {
          if (isElementVisible(button)) {
            return button;
          }
        }
      }
    }

    // If no form, look for nearby buttons
    const parent = inputElement.parentElement;
    if (parent) {
      const nearbyButton = parent.querySelector<HTMLElement>(
        'button, input[type="submit"]'
      );
      if (nearbyButton && isElementVisible(nearbyButton)) {
        return nearbyButton;
      }
    }

    return null;
  } catch (error) {
    console.debug('[Detector] Error finding submit button:', error);
    return null;
  }
}

/**
 * Calculate confidence score for a detected element
 * @param element - The element to score
 * @param method - The detection method used
 * @returns Confidence score (0-100)
 */
export function calculateConfidence(
  element: HTMLElement,
  method: 'retailer-specific' | 'attribute' | 'label' | 'heuristic'
): number {
  if (!isElementValid(element)) return 0;

  switch (method) {
    case 'retailer-specific':
      return 100;
    case 'attribute':
      return 80;
    case 'label':
      return 60;
    case 'heuristic':
      return 40;
    default:
      return 0;
  }
}

/**
 * Wait for an element to appear in the DOM
 * @param selector - CSS selector to wait for
 * @param timeout - Maximum time to wait in milliseconds
 * @returns Promise resolving to the element or null
 */
export function waitForElement(
  selector: string,
  timeout: number = 10000
): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Check if an element is valid for interaction
 * @param element - The element to validate
 * @returns True if element is valid
 */
function isElementValid(element: HTMLElement): boolean {
  return (
    element !== null &&
    isElementVisible(element) &&
    !('disabled' in element && (element as HTMLInputElement | HTMLButtonElement).disabled) &&
    element.getAttribute('tabindex') !== '-1'
  );
}

/**
 * Check if an element is visible in the DOM
 * @param element - The element to check
 * @returns True if element is visible
 */
function isElementVisible(element: HTMLElement): boolean {
  // Check computed styles (works in both browser and jsdom)
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }

  // In browsers (not jsdom), also check layout properties
  // offsetParent is null for hidden elements in real browsers
  // but always null in jsdom, so we need to handle this carefully
  try {
    if (element.offsetParent === null && element.tagName !== 'BODY' && element.parentElement) {
      // Element might be hidden, but could also be in jsdom
      // Check if we're in a real browser by testing if offsetParent works
      const testEl = document.createElement('div');
      document.body.appendChild(testEl);
      const hasOffsetParent = testEl.offsetParent !== null;
      document.body.removeChild(testEl);

      // If offsetParent works in this environment and ours is null, element is hidden
      if (hasOffsetParent) {
        return false;
      }
    }
  } catch {
    // If offset check fails, fall back to style-only check
  }

  return true;
}

/**
 * Cache a detection result
 * @param result - The result to cache
 */
// Removed: Old synchronous cache function replaced with async setCachedResult

/**
 * Clear the detection cache
 */
export async function clearCache(): Promise<void> {
  try {
    const key = `${CACHE_KEY_PREFIX}${window.location.href}`;
    await chrome.storage.session.remove(key);
  } catch (error) {
    console.warn('[Detector] Failed to clear cache:', error);
  }
}
