/**
 * Feedback Integration Module
 * Integrates auto-apply results with the feedback system
 */

import type { ApplierResult, CouponTestResult, BatchFeedbackItem } from '@/types';
import { testResultToFeedback, sendBatchFeedback, isFeedbackEnabled } from '@/services/feedback';
import { addToQueue } from '@/utils/feedbackQueue';

/**
 * Sends feedback for all tested coupons after auto-apply completes
 * Uses batch feedback endpoint for efficiency
 *
 * @param result - Auto-apply result containing all test results
 * @param domain - Current retailer domain
 * @returns Promise resolving to number of feedback items sent
 */
export async function submitAutoApplyFeedback(
  result: ApplierResult,
  domain: string
): Promise<number> {
  // Check if feedback is enabled
  const feedbackEnabled = await isFeedbackEnabled();
  if (!feedbackEnabled) {
    console.debug('[Feedback] Feedback disabled by user - skipping submission');
    return 0;
  }

  // Filter out uncertain results (timeout with no clear success/failure)
  const validResults = result.allResults.filter(testResult => {
    // Only send feedback for clear success or failure
    if (testResult.success) return true;
    if (testResult.failureReason && !testResult.failureReason.includes('Timeout')) return true;
    return false;
  });

  if (validResults.length === 0) {
    console.debug('[Feedback] No valid test results to submit');
    return 0;
  }

  console.debug(`[Feedback] Preparing to submit feedback for ${validResults.length} coupons`);

  // Convert test results to batch feedback format
  const feedbackItems: BatchFeedbackItem[] = validResults.map(testResult => ({
    couponId: testResult.couponId,
    ...testResultToFeedback(testResult, domain),
  }));

  // Send batch feedback
  const response = await sendBatchFeedback(feedbackItems);

  if (response.success) {
    console.debug(`[Feedback] Successfully sent feedback for ${response.processed} coupons`);

    // Handle any failed items by adding them to the retry queue
    if (response.failed > 0) {
      console.warn(`[Feedback] ${response.failed} feedback items failed, adding to retry queue`);

      for (const itemResult of response.results) {
        if (!itemResult.success) {
          // Find the original feedback item
          const feedbackItem = feedbackItems.find(item => item.couponId === itemResult.couponId);
          if (feedbackItem) {
            await addToQueue(itemResult.couponId, {
              success: feedbackItem.success,
              metadata: feedbackItem.metadata,
            });
          }
        }
      }
    }

    return response.processed;
  } else {
    // Entire batch failed - add all items to retry queue
    console.error(`[Feedback] Batch feedback failed: ${response.error}`);
    console.debug('[Feedback] Adding all items to retry queue');

    for (const item of feedbackItems) {
      await addToQueue(item.couponId, {
        success: item.success,
        metadata: item.metadata,
      });
    }

    return 0;
  }
}

/**
 * Sends feedback for a single coupon test result
 * Falls back to queue if submission fails
 *
 * @param testResult - Single coupon test result
 * @param domain - Current retailer domain
 * @returns Promise resolving to true if successfully sent
 */
export async function submitSingleFeedback(
  testResult: CouponTestResult,
  domain: string
): Promise<boolean> {
  // Check if feedback is enabled
  const feedbackEnabled = await isFeedbackEnabled();
  if (!feedbackEnabled) {
    return false;
  }

  // Skip uncertain results
  if (!testResult.success && (!testResult.failureReason || testResult.failureReason.includes('Timeout'))) {
    return false;
  }

  const feedback = testResultToFeedback(testResult, domain);

  // Import sendFeedback here to avoid circular dependencies
  const { sendFeedback } = await import('@/services/feedback');
  const response = await sendFeedback(testResult.couponId, feedback);

  if (response.success) {
    console.debug(`[Feedback] Successfully sent feedback for coupon ${testResult.code}`);
    return true;
  } else {
    console.warn(`[Feedback] Failed to send feedback for coupon ${testResult.code}, adding to queue`);
    await addToQueue(testResult.couponId, feedback);
    return false;
  }
}
