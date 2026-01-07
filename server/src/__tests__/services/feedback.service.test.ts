/**
 * Unit tests for Feedback Service
 * Tests feedback recording logic with mocked Prisma client
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Coupon } from '../../generated/prisma/index.js';

// Mock the db module before importing the service
jest.unstable_mockModule('../../lib/db.js', () => ({
  db: {
    coupon: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Import after mocking
const { recordCouponFeedback, recordBatchCouponFeedback, calculateSuccessRate } =
  await import('../../services/feedback.service.js');
const { NotFoundError, BadRequestError } = await import('../../lib/errors.js');
const { db } = await import('../../lib/db.js');

const mockDb = db as jest.Mocked<typeof db>;

describe('Feedback Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('recordCouponFeedback', () => {
    const mockCoupon: Coupon = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      code: 'SAVE20',
      description: '20% off',
      successCount: 10,
      failureCount: 2,
      lastSuccessAt: new Date('2024-12-15'),
      lastTestedAt: new Date('2024-12-16'),
      expiryDate: null,
      source: 'admin',
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2024-12-01'),
      retailerId: 'retailer-1',
    };

    it('should increment successCount when success is true', async () => {
      mockDb.coupon.findUnique.mockResolvedValue(mockCoupon);
      const updatedCoupon = { ...mockCoupon, successCount: 11 };
      mockDb.coupon.update.mockResolvedValue(updatedCoupon);

      const result = await recordCouponFeedback(mockCoupon.id, true);

      expect(mockDb.coupon.findUnique).toHaveBeenCalledWith({
        where: { id: mockCoupon.id },
      });
      expect(mockDb.coupon.update).toHaveBeenCalledWith({
        where: { id: mockCoupon.id },
        data: expect.objectContaining({
          successCount: { increment: 1 },
          lastSuccessAt: expect.any(Date),
          lastTestedAt: expect.any(Date),
        }),
      });
      expect(result.successCount).toBe(11);
    });

    it('should increment failureCount when success is false', async () => {
      mockDb.coupon.findUnique.mockResolvedValue(mockCoupon);
      const updatedCoupon = { ...mockCoupon, failureCount: 3 };
      mockDb.coupon.update.mockResolvedValue(updatedCoupon);

      const result = await recordCouponFeedback(mockCoupon.id, false);

      expect(mockDb.coupon.update).toHaveBeenCalledWith({
        where: { id: mockCoupon.id },
        data: expect.objectContaining({
          failureCount: { increment: 1 },
          lastTestedAt: expect.any(Date),
        }),
      });
      expect(result.failureCount).toBe(3);
    });

    it('should update lastTestedAt on every feedback', async () => {
      mockDb.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockDb.coupon.update.mockResolvedValue(mockCoupon);

      await recordCouponFeedback(mockCoupon.id, true);

      expect(mockDb.coupon.update).toHaveBeenCalledWith({
        where: { id: mockCoupon.id },
        data: expect.objectContaining({
          lastTestedAt: expect.any(Date),
        }),
      });
    });

    it('should throw NotFoundError when coupon does not exist', async () => {
      mockDb.coupon.findUnique.mockResolvedValue(null);

      await expect(recordCouponFeedback('123e4567-e89b-12d3-a456-426614174000', true)).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when coupon ID is invalid', async () => {
      await expect(recordCouponFeedback('invalid-uuid', true)).rejects.toThrow(BadRequestError);

      expect(mockDb.coupon.findUnique).not.toHaveBeenCalled();
    });

    it('should accept optional metadata without errors', async () => {
      mockDb.coupon.findUnique.mockResolvedValue(mockCoupon);
      mockDb.coupon.update.mockResolvedValue(mockCoupon);

      const metadata = {
        discountAmount: 25.5,
        discountPercentage: 20,
        domain: 'nike.com',
        testDurationMs: 2500,
        detectionMethod: 'price-change' as const,
        testedAt: new Date().toISOString(),
      };

      await expect(recordCouponFeedback(mockCoupon.id, true, metadata)).resolves.toBeDefined();
    });
  });

  describe('recordBatchCouponFeedback', () => {
    const mockCoupon1: Coupon = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      code: 'SAVE20',
      description: '20% off',
      successCount: 10,
      failureCount: 2,
      lastSuccessAt: new Date(),
      lastTestedAt: new Date(),
      expiryDate: null,
      source: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      retailerId: 'retailer-1',
    };

    const mockCoupon2: Coupon = {
      id: '123e4567-e89b-12d3-a456-426614174002',
      code: 'FREESHIP',
      description: 'Free shipping',
      successCount: 5,
      failureCount: 1,
      lastSuccessAt: new Date(),
      lastTestedAt: new Date(),
      expiryDate: null,
      source: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      retailerId: 'retailer-1',
    };

    it('should process all feedback items successfully', async () => {
      mockDb.coupon.findUnique.mockResolvedValueOnce(mockCoupon1).mockResolvedValueOnce(mockCoupon2);
      mockDb.coupon.update.mockResolvedValueOnce(mockCoupon1).mockResolvedValueOnce(mockCoupon2);

      const feedbackItems = [
        { couponId: mockCoupon1.id, success: true },
        { couponId: mockCoupon2.id, success: false },
      ];

      const result = await recordBatchCouponFeedback(feedbackItems);

      expect(result.processed).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(true);
    });

    it('should handle partial failures gracefully', async () => {
      mockDb.coupon.findUnique.mockResolvedValueOnce(mockCoupon1).mockResolvedValueOnce(null); // Second coupon not found
      mockDb.coupon.update.mockResolvedValueOnce(mockCoupon1);

      const feedbackItems = [
        { couponId: mockCoupon1.id, success: true },
        { couponId: '123e4567-e89b-12d3-a456-426614174999', success: false },
      ];

      const result = await recordBatchCouponFeedback(feedbackItems);

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
      expect(result.results[1].error).toContain('not found');
    });

    it('should handle all failures', async () => {
      mockDb.coupon.findUnique.mockResolvedValue(null);

      const feedbackItems = [
        { couponId: '123e4567-e89b-12d3-a456-426614174001', success: true },
        { couponId: '123e4567-e89b-12d3-a456-426614174002', success: false },
      ];

      const result = await recordBatchCouponFeedback(feedbackItems);

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(2);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].success).toBe(false);
      expect(result.results[1].success).toBe(false);
    });
  });

  describe('calculateSuccessRate', () => {
    it('should calculate success rate correctly', () => {
      expect(calculateSuccessRate(80, 20)).toBe(80);
      expect(calculateSuccessRate(50, 50)).toBe(50);
      expect(calculateSuccessRate(33, 67)).toBe(33);
      expect(calculateSuccessRate(1, 99)).toBe(1);
    });

    it('should return 0 when no tests have been performed', () => {
      expect(calculateSuccessRate(0, 0)).toBe(0);
    });

    it('should return 100 when all tests succeeded', () => {
      expect(calculateSuccessRate(100, 0)).toBe(100);
    });

    it('should return 0 when all tests failed', () => {
      expect(calculateSuccessRate(0, 100)).toBe(0);
    });

    it('should round to nearest integer', () => {
      expect(calculateSuccessRate(33, 67)).toBe(33); // 33.33... -> 33
      expect(calculateSuccessRate(67, 33)).toBe(67); // 67.00 -> 67
      expect(calculateSuccessRate(1, 2)).toBe(33); // 33.33... -> 33
    });
  });
});
