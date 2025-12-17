/**
 * Error Handling Middleware
 * Centralized error handling for the application
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors.ts';

/**
 * Error response structure
 */
interface ErrorResponse {
  error: {
    message: string;
    statusCode: number;
    stack?: string;
  };
}

/**
 * Global error handler middleware
 * Catches all errors and returns a consistent JSON response
 *
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  // Default to 500 Internal Server Error
  let statusCode = 500;
  let message = 'Internal Server Error';

  // If it's an operational error we defined, use its properties
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Error) {
    // For standard errors, use the message but keep 500 status
    message = err.message;
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      message,
      statusCode,
    },
  };

  // Include stack trace in development mode only
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler for undefined routes
 * Should be registered after all other routes
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
    },
  });
}
