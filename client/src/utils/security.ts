/**
 * Security Utilities
 * Provides validation and sanitization functions for security-critical operations
 */

/**
 * Validates that a message sender is from our own extension
 * Prevents malicious messages from other extensions or webpages
 *
 * @param sender - Message sender object from chrome.runtime.onMessage
 * @returns true if sender is valid, false otherwise
 */
export function isValidMessageSender(
  sender: chrome.runtime.MessageSender
): boolean {
  // Check if sender has an ID (messages from webpages don't have this)
  if (!sender.id) {
    console.warn('[Security] Rejected message with no sender ID');
    return false;
  }

  // Verify sender is from our extension
  if (sender.id !== chrome.runtime.id) {
    console.warn('[Security] Rejected message from unauthorized extension:', sender.id);
    return false;
  }

  return true;
}

/**
 * Validates message structure
 * Ensures message has required fields and proper types
 *
 * @param message - Message object to validate
 * @returns true if message structure is valid
 */
export function isValidMessageStructure(message: unknown): message is { type: string } {
  if (!message || typeof message !== 'object') {
    console.warn('[Security] Invalid message: not an object');
    return false;
  }

  const msg = message as Record<string, unknown>;

  if (!msg.type || typeof msg.type !== 'string') {
    console.warn('[Security] Invalid message: missing or invalid type field');
    return false;
  }

  return true;
}

/**
 * Validates an array of coupons
 * Ensures each coupon has required fields with correct types
 *
 * @param coupons - Array to validate
 * @returns true if coupons array is valid
 */
export function isValidCouponsArray(coupons: unknown): coupons is Array<{
  id: string;
  code: string;
  description: string | null;
  successCount: number;
  failureCount: number;
}> {
  if (!Array.isArray(coupons)) {
    console.warn('[Security] Invalid coupons: not an array');
    return false;
  }

  // Check each coupon has required fields
  for (const coupon of coupons) {
    if (!coupon || typeof coupon !== 'object') {
      console.warn('[Security] Invalid coupon: not an object');
      return false;
    }

    const c = coupon as Record<string, unknown>;

    if (typeof c.id !== 'string' || typeof c.code !== 'string') {
      console.warn('[Security] Invalid coupon: missing id or code');
      return false;
    }

    if (typeof c.successCount !== 'number' || typeof c.failureCount !== 'number') {
      console.warn('[Security] Invalid coupon: invalid count fields');
      return false;
    }
  }

  return true;
}

/**
 * Sanitizes error messages to prevent information disclosure
 * Removes technical details that could reveal implementation
 *
 * @param error - Error object or message
 * @returns Safe error message for display
 */
export function sanitizeErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unexpected error occurred';
  }

  // List of safe error patterns that can be shown to users
  const safePatterns = [
    /network error/i,
    /timeout/i,
    /could not find/i,
    /invalid page/i,
    /not found/i,
    /already running/i,
    /cancelled/i,
    /failed to (detect|apply|fetch)/i,
    /rate limit/i,
  ];

  // Check if error message matches any safe pattern
  const message = error.message.toLowerCase();
  const isSafe = safePatterns.some(pattern => pattern.test(message));

  if (isSafe) {
    // Return original message for safe errors
    return error.message;
  }

  // For potentially sensitive errors, log internally and return generic message
  console.error('[Error Details]:', error);
  return 'An error occurred. Please try again.';
}

/**
 * Validates a DOM element to ensure it's safe to interact with
 * Prevents interaction with elements from cross-origin iframes or sandboxed contexts
 *
 * @param element - DOM element to validate
 * @returns true if element is safe to interact with
 */
export function isValidDOMElement(element: Element | null): element is HTMLElement {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  // Ensure element is from the current document
  if (element.ownerDocument !== document) {
    console.warn('[Security] Element is from a different document');
    return false;
  }

  // Ensure element is not from a cross-origin iframe
  try {
    const frame = element.ownerDocument.defaultView;
    if (!frame) {
      return false;
    }

    // This will throw for cross-origin iframes
    void frame.location.href; // Access check

    // Check if we're in the main frame or a same-origin iframe
    if (frame.parent !== window.parent && frame !== window) {
      console.warn('[Security] Element is from a different frame context');
      return false;
    }
  } catch (error) {
    // Cross-origin access error
    console.warn('[Security] Cross-origin iframe detected');
    return false;
  }

  return true;
}
