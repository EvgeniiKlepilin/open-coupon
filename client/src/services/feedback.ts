/**
 * Feedback Service
 * Handles sending coupon feedback to the backend API
 */

import type {
  FeedbackRequest,
  FeedbackResponse,
  FeedbackError,
  BatchFeedbackRequest,
  BatchFeedbackResponse,
  CouponTestResult,
} from '@/types';
import { getApiUrl } from '@/config';
import { feedbackRateLimiter } from '@/utils/rateLimiter';

const FEEDBACK_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Sends feedback for a single coupon
 * @param couponId - UUID of the coupon
 * @param feedback - Feedback data (success/failure + metadata)
 * @returns Response with updated coupon stats or error
 */
export async function sendFeedback(
  couponId: string,
  feedback: FeedbackRequest,
): Promise<FeedbackResponse | FeedbackError> {
  // Rate limiting
  try {
    await feedbackRateLimiter.acquire();
  } catch (error) {
    console.warn('[Feedback] Rate limit exceeded:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Rate limit exceeded',
      code: 'RATE_LIMITED',
    };
  }

  const apiBaseUrl = await getApiUrl();
  const url = `${apiBaseUrl}/coupons/${couponId}/feedback`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedback),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      console.warn(`Feedback API error for coupon ${couponId}:`, data);
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        code: data.code || 'SERVER_ERROR',
      };
    }

    return data as FeedbackResponse;
  } catch (error) {
    console.error(`Failed to send feedback for coupon ${couponId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Sends feedback for multiple coupons in a single batch request
 * @param feedbackItems - Array of feedback items
 * @returns Batch response with results for each item
 */
export async function sendBatchFeedback(
  feedbackItems: BatchFeedbackRequest['feedback'],
): Promise<BatchFeedbackResponse | FeedbackError> {
  // Rate limiting
  try {
    await feedbackRateLimiter.acquire();
  } catch (error) {
    console.warn('[Feedback] Rate limit exceeded:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Rate limit exceeded',
      code: 'RATE_LIMITED',
    };
  }

  const apiBaseUrl = await getApiUrl();
  const url = `${apiBaseUrl}/coupons/feedback/batch`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FEEDBACK_TIMEOUT_MS * 2); // Longer timeout for batch

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ feedback: feedbackItems }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      console.warn('Batch feedback API error:', data);
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
        code: data.code || 'SERVER_ERROR',
      };
    }

    return data as BatchFeedbackResponse;
  } catch (error) {
    console.error('Failed to send batch feedback:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      code: 'SERVER_ERROR',
    };
  }
}

/**
 * Converts CouponTestResult to FeedbackRequest format
 * @param testResult - Result from auto-apply testing
 * @param domain - Current retailer domain
 * @returns Formatted feedback request
 */
export function testResultToFeedback(testResult: CouponTestResult, domain: string): FeedbackRequest {
  const metadata = {
    domain,
    testDurationMs: testResult.durationMs,
    detectionMethod: testResult.detectionMethod,
    testedAt: new Date().toISOString(),
  };

  if (testResult.success) {
    return {
      success: true,
      metadata: {
        ...metadata,
        discountAmount: testResult.discountAmount,
        discountPercentage: testResult.discountPercentage,
      },
    };
  } else {
    return {
      success: false,
      metadata: {
        ...metadata,
        failureReason: mapFailureReason(testResult.failureReason),
      },
    };
  }
}

/**
 * Maps failure reason string to valid FailureReason enum
 */
function mapFailureReason(reason?: string): 'expired' | 'invalid' | 'minimum-not-met' | 'out-of-stock' | 'other' {
  if (!reason) return 'other';

  const lowerReason = reason.toLowerCase();
  if (lowerReason.includes('expired') || lowerReason.includes('expiry')) return 'expired';
  if (lowerReason.includes('invalid') || lowerReason.includes('incorrect')) return 'invalid';
  if (lowerReason.includes('minimum') || lowerReason.includes('min')) return 'minimum-not-met';
  if (lowerReason.includes('stock') || lowerReason.includes('unavailable')) return 'out-of-stock';
  return 'other';
}

/**
 * Checks if user has enabled feedback submission in settings
 * @returns Promise resolving to true if feedback is enabled
 */
export async function isFeedbackEnabled(): Promise<boolean> {
  try {
    const result = await chrome.storage.local.get('feedbackEnabled');
    // Default to true if not set
    return result.feedbackEnabled !== false;
  } catch (error) {
    console.error('Error checking feedback settings:', error);
    return true; // Default to enabled
  }
}

/**
 * Sets the feedback enabled preference
 * @param enabled - Whether feedback should be enabled
 */
export async function setFeedbackEnabled(enabled: boolean): Promise<void> {
  try {
    await chrome.storage.local.set({ feedbackEnabled: enabled });
  } catch (error) {
    console.error('Error saving feedback settings:', error);
  }
}
