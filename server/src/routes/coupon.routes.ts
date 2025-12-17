/**
 * Coupon Routes
 * API route definitions for coupon endpoints
 */

import { Router } from 'express';
import { getCoupons } from '../controllers/coupon.controller.ts';

const router = Router();

/**
 * GET /api/v1/coupons?domain=example.com
 * Retrieve coupons for a specific retailer domain
 */
router.get('/coupons', getCoupons);

export default router;
