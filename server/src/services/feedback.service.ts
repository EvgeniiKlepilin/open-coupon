/**
 * Feedback Service
 * Business logic for coupon feedback operations
 */

import { db } from '../lib/db.js';
import { NotFoundError, BadRequestError } from '../lib/errors.js';
import type { Coupon } from '../generated/prisma/index.js';
import type { FeedbackMetadata } from '../validators/feedback.validator.js';

/**
 * Record feedback for a coupon (success or failure)
 * Uses atomic database operations to prevent race conditions
 *
 * @param couponId - UUID of the coupon
 * @param success - Whether the coupon was successfully applied
 * @param metadata - Optional metadata about the test
 * @returns Updated coupon with new success/failure counts
 * @throws NotFoundError if coupon is not found
 * @throws BadRequestError if couponId is invalid
 */
export async function recordCouponFeedback(
  couponId: string,
  success: boolean,
  _metadata?: FeedbackMetadata,
): Promise<Coupon> {
  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(couponId)) {
    throw new BadRequestError('Invalid coupon ID format. Must be a valid UUID.');
  }

  // Check if coupon exists
  const existingCoupon = await db.coupon.findUnique({
    where: { id: couponId },
  });

  if (!existingCoupon) {
    throw new NotFoundError(`Coupon not found with ID: ${couponId}`);
  }

  // Prepare update data with atomic increments
  const updateData: {
    successCount?: { increment: number };
    failureCount?: { increment: number };
    lastSuccessAt?: Date;
    lastTestedAt: Date;
  } = {
    lastTestedAt: new Date(),
  };

  if (success) {
    updateData.successCount = { increment: 1 };
    updateData.lastSuccessAt = new Date();
  } else {
    updateData.failureCount = { increment: 1 };
  }

  // Update coupon with atomic operations
  const updatedCoupon = await db.coupon.update({
    where: { id: couponId },
    data: updateData,
  });

  return updatedCoupon;
}

/**
 * Record batch feedback for multiple coupons
 * Processes each feedback item and collects results
 *
 * @param feedbackItems - Array of feedback items
 * @returns Results for each feedback item (success or error)
 */
export async function recordBatchCouponFeedback(
  feedbackItems: Array<{
    couponId: string;
    success: boolean;
    metadata?: FeedbackMetadata;
  }>,
): Promise<{
  processed: number;
  failed: number;
  results: Array<{
    couponId: string;
    success: boolean;
    error?: string;
  }>;
}> {
  const results: Array<{
    couponId: string;
    success: boolean;
    error?: string;
  }> = [];

  let processed = 0;
  let failed = 0;

  // Process each feedback item sequentially to avoid overwhelming the database
  for (const item of feedbackItems) {
    try {
      await recordCouponFeedback(item.couponId, item.success, item.metadata);
      results.push({
        couponId: item.couponId,
        success: true,
      });
      processed++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({
        couponId: item.couponId,
        success: false,
        error: errorMessage,
      });
      failed++;
    }
  }

  return {
    processed,
    failed,
    results,
  };
}

/**
 * Calculate success rate for a coupon
 * @param successCount - Number of successful applications
 * @param failureCount - Number of failed applications
 * @returns Success rate as a percentage (0-100)
 */
export function calculateSuccessRate(successCount: number, failureCount: number): number {
  const total = successCount + failureCount;
  if (total === 0) return 0;
  return Math.round((successCount / total) * 100);
}
