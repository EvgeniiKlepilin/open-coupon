/**
 * Feedback Validation Schemas
 * Zod schemas for validating feedback request payloads
 */

import { z } from 'zod';

/**
 * Schema for optional feedback metadata
 */
const feedbackMetadataSchema = z
  .object({
    discountAmount: z.number().nonnegative().optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    failureReason: z.enum(['expired', 'invalid', 'minimum-not-met', 'out-of-stock', 'other']).optional(),
    domain: z.string().min(1),
    testDurationMs: z.number().nonnegative(),
    detectionMethod: z.enum(['price-change', 'success-message', 'failure-message', 'timeout']),
    testedAt: z.string().datetime(),
  })
  .strict();

/**
 * Schema for single feedback request
 */
export const feedbackRequestSchema = z
  .object({
    success: z.boolean(),
    metadata: feedbackMetadataSchema.optional(),
  })
  .strict();

/**
 * Schema for batch feedback item
 */
const batchFeedbackItemSchema = z
  .object({
    couponId: z.string().uuid(),
    success: z.boolean(),
    metadata: feedbackMetadataSchema.optional(),
  })
  .strict();

/**
 * Schema for batch feedback request
 */
export const batchFeedbackRequestSchema = z
  .object({
    feedback: z.array(batchFeedbackItemSchema).min(1).max(100), // Max 100 feedback items per batch
  })
  .strict();

/**
 * Type definitions derived from schemas
 */
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
export type BatchFeedbackRequest = z.infer<typeof batchFeedbackRequestSchema>;
export type FeedbackMetadata = z.infer<typeof feedbackMetadataSchema>;
