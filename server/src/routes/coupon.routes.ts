/**
 * Coupon Routes
 * API route definitions for coupon endpoints
 */

import { Router } from 'express';
import { getCoupons, submitCouponFeedback, submitBatchCouponFeedback } from '../controllers/coupon.controller.js';
import { feedbackRateLimiter, batchFeedbackRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * GET /api/v1/coupons?domain=example.com
 * Retrieve coupons for a specific retailer domain
 */
router.get('/coupons', getCoupons);

/**
 * POST /api/v1/coupons/:id/feedback
 * Submit feedback for a specific coupon
 * Rate limited: 100 requests per hour per IP
 */
router.post('/coupons/:id/feedback', feedbackRateLimiter, submitCouponFeedback);

/**
 * POST /api/v1/coupons/feedback/batch
 * Submit feedback for multiple coupons in a single request
 * Rate limited: 50 requests per hour per IP
 */
router.post('/coupons/feedback/batch', batchFeedbackRateLimiter, submitBatchCouponFeedback);

export default router;
