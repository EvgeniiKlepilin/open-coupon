/**
 * Rate Limiter Middleware
 * Limits the number of requests per IP to prevent abuse
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for feedback endpoints
 * Allows 100 requests per hour per IP
 */
export const feedbackRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many feedback requests from this IP, please try again later.',
    code: 'RATE_LIMITED',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Add Retry-After header
  handler: (req, res) => {
    res.status(429).set('Retry-After', '3600').json({
      success: false,
      error: 'Too many feedback requests from this IP, please try again later.',
      code: 'RATE_LIMITED',
    });
  },
});

/**
 * Stricter rate limiter for batch feedback endpoint
 * Allows 50 requests per hour per IP (since batch can contain up to 100 items)
 */
export const batchFeedbackRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 50, // Limit each IP to 50 batch requests per windowMs
  message: {
    success: false,
    error: 'Too many batch feedback requests from this IP, please try again later.',
    code: 'RATE_LIMITED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).set('Retry-After', '3600').json({
      success: false,
      error: 'Too many batch feedback requests from this IP, please try again later.',
      code: 'RATE_LIMITED',
    });
  },
});
