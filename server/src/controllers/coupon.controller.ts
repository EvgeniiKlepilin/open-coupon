/**
 * Coupon Controller
 * Handles HTTP requests for coupon endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { getCouponsByDomain } from '../services/coupon.service.ts';
import { BadRequestError } from '../lib/errors.ts';

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
