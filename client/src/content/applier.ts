/**
 * Auto-Apply Coupon Module
 *
 * This module provides intelligent coupon testing functionality that:
 * - Detects prices on checkout pages using multiple strategies
 * - Applies coupons sequentially and monitors for price changes
 * - Identifies the best discount and re-applies winning coupon
 * - Provides real-time progress feedback to users
 *
 * ⚠️ WARNING: This module simulates user interactions to test coupons.
 * - Retailers may implement rate limiting or anti-bot measures
 * - Always use random delays between attempts to avoid detection
 * - Stop immediately if CAPTCHA is detected
 * - Never log sensitive user data (full prices, addresses, payment info)
 */

import type {
  PriceInfo,
  CouponTestResult,
  ApplierResult,
  ApplierOptions,
} from '../types';

// Default configuration constants
const DEFAULT_DELAY_MIN = 2000; // 2 seconds minimum
const DEFAULT_DELAY_MAX = 4000; // 4 seconds maximum
const DEFAULT_MAX_ATTEMPTS = 20;
const DEFAULT_TIMEOUT = 5000; // 5 seconds per coupon
const MUTATION_DEBOUNCE_MS = 100;
const MAX_CONSECUTIVE_FAILURES = 5;

// Common price selectors (prioritized by likelihood)
const DEFAULT_PRICE_SELECTORS = [
  '[data-test="total"]',
  '[data-test="grand-total"]',
  '.total',
  '.grand-total',
  '.order-total',
  '.cart-total',
  '.checkout-total',
  '[class*="total"]',
  '[id*="total"]',
  '.price-total',
  '.final-price',
  '.summary-total',
];

// Success indicator keywords
const SUCCESS_KEYWORDS = [
  'applied',
  'success',
  'saved',
  'discount applied',
  'coupon applied',
  'promo applied',
  'code applied',
];

// Failure indicator keywords
const FAILURE_KEYWORDS = [
  'invalid',
  'expired',
  'not valid',
  'incorrect',
  'error',
  'failed',
  'not found',
  'cannot be applied',
];

/**
 * Normalizes a price string to a numeric value
 * Handles various currency formats: $1,234.56, €1.234,56, £1234.56
 *
 * @param priceText - Raw price text from DOM
 * @returns Normalized numeric price value
 */
export function normalizePrice(priceText: string): number {
  // Remove all whitespace
  let cleaned = priceText.replace(/\s/g, '');

  // Remove currency symbols
  cleaned = cleaned.replace(/[$€£¥₹₽]/g, '');

  // Detect decimal separator (last occurrence of . or ,)
  const lastDot = cleaned.lastIndexOf('.');
  const lastComma = cleaned.lastIndexOf(',');

  if (lastDot > lastComma) {
    // Period is decimal separator (US format: 1,234.56)
    cleaned = cleaned.replace(/,/g, ''); // Remove thousand separators
  } else if (lastComma > lastDot) {
    // Comma is decimal separator (EU format: 1.234,56)
    cleaned = cleaned.replace(/\./g, ''); // Remove thousand separators
    cleaned = cleaned.replace(/,/, '.'); // Convert decimal separator to period
  } else if (lastDot === -1 && lastComma !== -1) {
    // Only comma present (could be decimal or thousand separator)
    // If there are 2 digits after comma, it's a decimal separator
    const afterComma = cleaned.substring(lastComma + 1);
    if (afterComma.length === 2) {
      // EU decimal format: 99,99
      cleaned = cleaned.replace(/,/, '.');
    } else {
      // Thousand separator: 1,234
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (lastComma === -1 && lastDot !== -1) {
    // Only dot present (could be decimal or thousand separator)
    // If there are 2 digits after dot, it's a decimal separator
    const afterDot = cleaned.substring(lastDot + 1);
    if (afterDot.length !== 2 && afterDot.length !== 1) {
      // Thousand separator: 1.234
      cleaned = cleaned.replace(/\./g, '');
    }
    // Otherwise it's already a decimal separator
  }

  // Parse to float
  const value = parseFloat(cleaned);

  if (isNaN(value)) {
    console.warn(`Failed to normalize price: "${priceText}"`);
    return 0;
  }

  return value;
}

/**
 * Detects the currency symbol from a price string
 *
 * @param priceText - Raw price text from DOM
 * @returns Currency symbol (e.g., '$', '€', '£')
 */
function detectCurrency(priceText: string): string {
  const currencyMatch = priceText.match(/[$€£¥₹₽]/);
  return currencyMatch ? currencyMatch[0] : '$';
}

/**
 * Multi-strategy price detection on checkout pages
 *
 * Strategies (in order of execution):
 * 1. Custom selectors (if provided)
 * 2. Common total/grand-total selectors
 * 3. Regex scan for currency patterns
 * 4. Text content scan for price-like strings
 *
 * @param selectors - Optional custom price element selectors
 * @returns Price information or null if not found
 */
export async function detectPrice(selectors?: string[]): Promise<PriceInfo | null> {
  const allSelectors = selectors ? [...selectors, ...DEFAULT_PRICE_SELECTORS] : DEFAULT_PRICE_SELECTORS;

  // Strategy 1 & 2: Try CSS selectors
  for (const selector of allSelectors) {
    try {
      const elements = document.querySelectorAll(selector);

      for (const element of Array.from(elements)) {
        if (!(element instanceof HTMLElement)) continue;

        // Check if element is visible
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') continue;

        const text = element.textContent?.trim() || '';

        // Must contain a price-like pattern
        if (!/[\d.,]+/.test(text)) continue;

        const value = normalizePrice(text);
        if (value > 0) {
          console.debug(`Price detected via selector "${selector}":`, text);
          return {
            value,
            rawText: text,
            currency: detectCurrency(text),
            element: element,
            detectedAt: Date.now(),
          };
        }
      }
    } catch (error) {
      console.debug(`Selector "${selector}" failed:`, error);
    }
  }

  // Strategy 3: Regex scan for currency patterns
  const bodyText = document.body?.innerText || document.body?.textContent || '';
  if (bodyText) {
    const currencyPatterns = [
      /\$\s*[\d,]+\.?\d{0,2}/g,  // $1,234.56
      /€\s*[\d.,]+/g,             // €1.234,56
      /£\s*[\d,]+\.?\d{0,2}/g,   // £1,234.56
      /[\d,]+\.?\d{0,2}\s*USD/gi, // 1,234.56 USD
    ];

    for (const pattern of currencyPatterns) {
      const matches = bodyText.match(pattern);
      if (matches && matches.length > 0) {
        // Take the largest value (likely the total)
        const prices = matches.map(m => normalizePrice(m));
        const maxPrice = Math.max(...prices);
        const matchText = matches[prices.indexOf(maxPrice)];

        console.debug('Price detected via regex scan:', matchText);
        return {
          value: maxPrice,
          rawText: matchText,
          currency: detectCurrency(matchText),
          element: null,
          detectedAt: Date.now(),
        };
      }
    }
  }

  console.warn('Price detection failed: No price found on page');
  return null;
}

/**
 * Simulates human-like random delay
 *
 * @param min - Minimum delay in milliseconds
 * @param max - Maximum delay in milliseconds
 */
export function simulateHumanDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  console.debug(`Waiting ${delay}ms before next action...`);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Applies a single coupon code to the input field and submits
 *
 * Dispatches multiple events to ensure compatibility with various frameworks:
 * - input event (for React)
 * - change event (for Vue/Angular)
 * - keyup event (for vanilla JS listeners)
 *
 * @param code - Coupon code to apply
 * @param input - Input element for coupon code
 * @param submit - Submit button element
 */
export async function applySingleCoupon(
  code: string,
  input: HTMLInputElement,
  submit: HTMLElement
): Promise<void> {
  try {
    // Clear existing value
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Small delay to simulate human typing
    await simulateHumanDelay(100, 300);

    // Set new coupon code
    input.value = code;

    // Dispatch events for framework detection
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

    console.debug(`Applied coupon code: ${code}`);

    // Small delay before clicking submit
    await simulateHumanDelay(200, 500);

    // Click submit button
    if (submit instanceof HTMLButtonElement || submit instanceof HTMLInputElement) {
      if (submit.disabled) {
        console.warn('Submit button is disabled, waiting for re-enable...');
        await waitForButtonEnable(submit, 3000);
      }
    }

    submit.click();
    console.debug('Clicked submit button');
  } catch (error) {
    console.error('Failed to apply coupon:', error);
    throw error;
  }
}

/**
 * Waits for a button to become enabled
 *
 * @param button - Button element to watch
 * @param timeout - Maximum wait time in milliseconds
 */
function waitForButtonEnable(button: HTMLButtonElement | HTMLInputElement, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!button.disabled) {
      resolve();
      return;
    }

    const startTime = Date.now();
    const observer = new MutationObserver(() => {
      if (!button.disabled) {
        observer.disconnect();
        resolve();
      } else if (Date.now() - startTime > timeout) {
        observer.disconnect();
        reject(new Error('Button did not re-enable within timeout'));
      }
    });

    observer.observe(button, { attributes: true, attributeFilter: ['disabled'] });
  });
}

/**
 * Waits for price change using MutationObserver
 *
 * @param basePrice - Initial price to compare against
 * @param timeout - Maximum wait time in milliseconds
 * @returns New price information or null if timeout/no change
 */
export async function waitForPriceChange(
  basePrice: PriceInfo,
  timeout: number = DEFAULT_TIMEOUT
): Promise<PriceInfo | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Find container to observe (checkout/cart section)
    const container = document.querySelector('main, [role="main"], .checkout, .cart, body') || document.body;

    const checkPrice = async (): Promise<void> => {
      // CRITICAL FIX: Always check the SAME element that was used for baseline price
      // This prevents false positives from different price elements appearing/disappearing
      let newPrice: PriceInfo | null = null;

      if (basePrice.element && document.contains(basePrice.element)) {
        // Check if baseline element still exists and is visible
        const style = window.getComputedStyle(basePrice.element);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          const text = basePrice.element.textContent?.trim() || '';
          const value = normalizePrice(text);
          if (value > 0) {
            newPrice = {
              value,
              rawText: text,
              currency: detectCurrency(text),
              element: basePrice.element,
              detectedAt: Date.now(),
            };
            console.debug(`Price checked from baseline element: ${value} (was ${basePrice.value})`);
          }
        }
      }

      // Fallback: If baseline element is gone or invalid, scan for any price
      if (!newPrice) {
        newPrice = await detectPrice();
        if (newPrice) {
          console.debug(`⚠️  Baseline element lost, found new price element: ${newPrice.value}`);
        }
      }

      if (!newPrice) {
        console.debug('Price detection failed during wait');
        return;
      }

      if (newPrice.value !== basePrice.value) {
        console.debug(`Price changed: ${basePrice.value} → ${newPrice.value}`);
        observer.disconnect();
        if (debounceTimer) clearTimeout(debounceTimer);
        resolve(newPrice);
      } else if (Date.now() - startTime > timeout) {
        console.debug('Timeout waiting for price change');
        observer.disconnect();
        if (debounceTimer) clearTimeout(debounceTimer);
        resolve(null);
      }
    };

    const observer = new MutationObserver(() => {
      // Debounce: wait for DOM to settle before checking price
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        checkPrice();
      }, MUTATION_DEBOUNCE_MS);
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Also set a timeout to resolve with null
    setTimeout(() => {
      observer.disconnect();
      if (debounceTimer) clearTimeout(debounceTimer);
      resolve(null);
    }, timeout);
  });
}

/**
 * Detects success or failure indicators in the DOM
 *
 * Looks for:
 * - Success messages (e.g., "Coupon applied successfully")
 * - Error messages (e.g., "Invalid coupon code")
 * - Visual indicators (green checkmarks, red X icons)
 *
 * @returns Detection result with success flag and optional message
 */
export function detectSuccessIndicators(): { success: boolean; message?: string } {
  const bodyText = (document.body?.innerText || document.body?.textContent || '').toLowerCase();

  // Check for success keywords
  for (const keyword of SUCCESS_KEYWORDS) {
    if (bodyText.includes(keyword.toLowerCase())) {
      console.debug(`Success indicator detected: "${keyword}"`);
      return { success: true, message: keyword };
    }
  }

  // Check for failure keywords
  for (const keyword of FAILURE_KEYWORDS) {
    if (bodyText.includes(keyword.toLowerCase())) {
      console.debug(`Failure indicator detected: "${keyword}"`);
      return { success: false, message: keyword };
    }
  }

  // Check for visual success indicators
  const successElements = document.querySelectorAll('[class*="success"], [class*="check"], [aria-label*="success"]');
  if (successElements.length > 0) {
    console.debug('Visual success indicator detected');
    return { success: true, message: 'Visual success indicator' };
  }

  // Check for visual error indicators
  const errorElements = document.querySelectorAll('[class*="error"], [class*="invalid"], [aria-label*="error"]');
  if (errorElements.length > 0) {
    console.debug('Visual error indicator detected');
    return { success: false, message: 'Visual error indicator' };
  }

  console.debug('No clear success/failure indicators detected');
  return { success: false };
}

/**
 * Re-applies the best coupon at the end of testing
 *
 * @param couponCode - Code of the best coupon to re-apply
 * @param input - Input element for coupon code
 * @param submit - Submit button element
 */
export async function reapplyBestCoupon(
  couponCode: string,
  input: HTMLInputElement,
  submit: HTMLElement
): Promise<void> {
  console.debug(`Re-applying best coupon: ${couponCode}`);
  await applySingleCoupon(couponCode, input, submit);

  // Wait for application to complete
  await simulateHumanDelay(2000, 3000);
}

/**
 * Main auto-apply orchestration function
 *
 * Tests coupons sequentially, monitors for price changes, and identifies the best discount.
 * Supports real-time progress callbacks and user cancellation.
 *
 * @param options - Configuration options for auto-apply
 * @returns Result containing best coupon and test history
 */
export async function autoApplyCoupons(options: ApplierOptions): Promise<ApplierResult> {
  const {
    coupons,
    inputElement,
    submitElement,
    priceSelectors,
    delayBetweenAttempts = DEFAULT_DELAY_MIN,
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    timeout = DEFAULT_TIMEOUT,
    onProgress,
    onCouponTested,
    onComplete,
  } = options;

  console.debug(`Starting auto-apply with ${coupons.length} coupons`);

  // Initialize result object
  const result: ApplierResult = {
    tested: 0,
    successful: 0,
    failed: 0,
    bestCoupon: null,
    allResults: [],
    cancelledByUser: false,
  };

  try {
    // Detect baseline price
    console.debug('Detecting baseline price...');
    const baselinePrice = await detectPrice(priceSelectors);

    if (!baselinePrice) {
      result.errorMessage = 'Failed to detect price on page';
      console.error(result.errorMessage);
      onComplete?.(result);
      return result;
    }

    console.debug(`Baseline price detected: ${baselinePrice.currency}${baselinePrice.value}`);

    // Sort coupons by success count (highest first)
    const sortedCoupons = [...coupons].sort((a, b) => b.successCount - a.successCount);

    // Limit to maxAttempts
    const couponsToTest = sortedCoupons.slice(0, maxAttempts);

    if (couponsToTest.length < coupons.length) {
      console.debug(`Testing top ${couponsToTest.length} coupons out of ${coupons.length} available`);
    }

    let consecutiveFailures = 0;

    // Test each coupon
    for (let i = 0; i < couponsToTest.length; i++) {
      const coupon = couponsToTest[i];
      const startTime = Date.now();

      console.debug(`\n--- Testing coupon ${i + 1}/${couponsToTest.length}: ${coupon.code} ---`);

      // Notify progress
      onProgress?.(i + 1, couponsToTest.length, coupon.code);

      // Apply the coupon
      await applySingleCoupon(coupon.code, inputElement, submitElement);

      // Wait for price change or timeout
      const newPrice = await waitForPriceChange(baselinePrice, timeout);

      // Detect success/failure indicators
      const indicators = detectSuccessIndicators();

      // Determine result
      let testResult: CouponTestResult;

      if (newPrice && newPrice.value < baselinePrice.value) {
        // Price decreased - SUCCESS (actual discount applied)
        const discountAmount = baselinePrice.value - newPrice.value;
        const discountPercentage = (discountAmount / baselinePrice.value) * 100;

        testResult = {
          couponId: coupon.id,
          code: coupon.code,
          priceBefore: baselinePrice,
          priceAfter: newPrice,
          discountAmount,
          discountPercentage,
          success: true,
          detectionMethod: 'price-change',
          durationMs: Date.now() - startTime,
        };

        result.successful++;
        consecutiveFailures = 0;

        console.debug(`✅ SUCCESS: Saved ${newPrice.currency}${discountAmount.toFixed(2)} (${discountPercentage.toFixed(1)}%)`);
      } else if (indicators.success && (!newPrice || newPrice.value >= baselinePrice.value)) {
        // Success message detected but NO price change - this is misleading, mark as FAILURE
        // Some sites show "success" messages even for invalid coupons
        testResult = {
          couponId: coupon.id,
          code: coupon.code,
          priceBefore: baselinePrice,
          priceAfter: newPrice || baselinePrice,
          discountAmount: 0,
          discountPercentage: 0,
          success: false,
          failureReason: 'No discount applied despite success message',
          detectionMethod: 'success-message',
          durationMs: Date.now() - startTime,
        };

        result.failed++;
        consecutiveFailures++;

        console.debug(`❌ MISLEADING SUCCESS: Success message shown but no price decrease (${indicators.message})`);
      } else if (indicators.message) {
        // Failure message detected
        testResult = {
          couponId: coupon.id,
          code: coupon.code,
          priceBefore: baselinePrice,
          priceAfter: newPrice || baselinePrice,
          discountAmount: 0,
          discountPercentage: 0,
          success: false,
          failureReason: indicators.message,
          detectionMethod: 'failure-message',
          durationMs: Date.now() - startTime,
        };

        result.failed++;
        consecutiveFailures++;

        console.debug(`❌ FAILED: ${indicators.message}`);
      } else {
        // Timeout - no clear result
        testResult = {
          couponId: coupon.id,
          code: coupon.code,
          priceBefore: baselinePrice,
          priceAfter: newPrice || baselinePrice,
          discountAmount: 0,
          discountPercentage: 0,
          success: false,
          failureReason: 'Timeout - no response detected',
          detectionMethod: 'timeout',
          durationMs: Date.now() - startTime,
        };

        result.failed++;
        consecutiveFailures++;

        console.debug('⏱️  TIMEOUT: No clear success or failure detected');
      }

      result.tested++;
      result.allResults.push(testResult);

      // Update best coupon if this one is better
      if (testResult.success && testResult.discountAmount > 0) {
        if (!result.bestCoupon || testResult.discountAmount > result.bestCoupon.discountAmount) {
          result.bestCoupon = testResult;
          console.debug(`🏆 New best coupon: ${coupon.code} - saves ${testResult.discountAmount.toFixed(2)}`);
        }
      }

      // Notify coupon tested
      onCouponTested?.(testResult);

      // Check for rate limiting (too many consecutive failures)
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        result.errorMessage = 'Rate limiting detected - too many consecutive failures';
        console.error(result.errorMessage);
        break;
      }

      // Early termination: 100% discount (free item!)
      if (testResult.discountPercentage >= 100) {
        console.debug('🎉 100% discount found - stopping tests!');
        break;
      }

      // Delay before next attempt (except for last coupon)
      if (i < couponsToTest.length - 1) {
        await simulateHumanDelay(
          delayBetweenAttempts || DEFAULT_DELAY_MIN,
          delayBetweenAttempts ? delayBetweenAttempts + 2000 : DEFAULT_DELAY_MAX
        );
      }
    }

    // Re-apply best coupon if it's not the last one tested
    if (result.bestCoupon && result.allResults[result.allResults.length - 1]?.couponId !== result.bestCoupon.couponId) {
      console.debug('Re-applying best coupon...');
      await reapplyBestCoupon(result.bestCoupon.code, inputElement, submitElement);
    }

    console.debug('\n=== Auto-Apply Complete ===');
    console.debug(`Tested: ${result.tested} | Successful: ${result.successful} | Failed: ${result.failed}`);
    if (result.bestCoupon) {
      console.debug(`Best: ${result.bestCoupon.code} - saved ${result.bestCoupon.discountAmount.toFixed(2)}`);
    }

    onComplete?.(result);
    return result;

  } catch (error) {
    result.errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Auto-apply failed:', error);
    onComplete?.(result);
    return result;
  }
}
