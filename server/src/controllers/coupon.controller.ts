/**
 * Coupon Controller
 * Handles HTTP requests for coupon endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import type { ZodIssue } from 'zod';
import { getCouponsByDomain } from '../services/coupon.service.js';
import { recordCouponFeedback, recordBatchCouponFeedback, calculateSuccessRate } from '../services/feedback.service.js';
import { BadRequestError } from '../lib/errors.js';
import { feedbackRequestSchema, batchFeedbackRequestSchema } from '../validators/feedback.validator.js';

/**
 * GET /api/v1/coupons
 * Retrieve coupons for a specific retailer domain
 *
 * @param req - Express request object with query param 'domain'
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export async function getCoupons(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { domain } = req.query;

    // Validate query parameter
    if (!domain || typeof domain !== 'string') {
      throw new BadRequestError('Query parameter "domain" is required and must be a string');
    }

    // Call service layer
    const coupons = await getCouponsByDomain(domain);

    // Return successful response
    res.status(200).json({
      data: coupons,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * POST /api/v1/coupons/:id/feedback
 * Record feedback for a specific coupon
 *
 * @param req - Express request object with coupon ID in params and feedback data in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export async function submitCouponFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id: couponId } = req.params;

    if (!couponId) {
      throw new BadRequestError('Coupon ID is required');
    }

    // Validate request body using Zod
    const validationResult = feedbackRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map((e: ZodIssue) => {
          const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
          return `${path}${e.message}`;
        })
        .join(', ');
      throw new BadRequestError(`Invalid request body: ${errorMessages}`);
    }
    const validatedData = validationResult.data;

    const { success, metadata } = validatedData;

    // Record feedback in database
    const updatedCoupon = await recordCouponFeedback(couponId, success, metadata);

    // Calculate success rate
    const successRate = calculateSuccessRate(updatedCoupon.successCount, updatedCoupon.failureCount);

    // Return successful response
    res.status(200).json({
      success: true,
      message: 'Feedback recorded successfully',
      updatedCoupon: {
        id: updatedCoupon.id,
        successCount: updatedCoupon.successCount,
        failureCount: updatedCoupon.failureCount,
        successRate,
        lastSuccessAt: updatedCoupon.lastSuccessAt?.toISOString(),
        lastTestedAt: updatedCoupon.lastTestedAt?.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * POST /api/v1/coupons/feedback/batch
 * Record feedback for multiple coupons in a single request
 *
 * @param req - Express request object with array of feedback items in body
 * @param res - Express response object
 * @param next - Express next function for error handling
 */
export async function submitBatchCouponFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body using Zod
    const validationResult = batchFeedbackRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map((e: ZodIssue) => {
          const path = e.path.length > 0 ? `${e.path.join('.')}: ` : '';
          return `${path}${e.message}`;
        })
        .join(', ');
      throw new BadRequestError(`Invalid request body: ${errorMessages}`);
    }
    const validatedData = validationResult.data;

    const { feedback } = validatedData;

    // Record batch feedback in database
    const result = await recordBatchCouponFeedback(feedback.map(f => ({ ...f, metadata: f.metadata! })));

    // Return successful response
    res.status(200).json({
      success: true,
      message: `Processed ${result.processed} feedback items, ${result.failed} failed`,
      processed: result.processed,
      failed: result.failed,
      results: result.results,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}
