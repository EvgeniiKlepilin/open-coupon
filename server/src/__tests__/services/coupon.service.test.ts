/**
 * Unit tests for Coupon Service
 * Tests business logic with mocked Prisma client
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { Coupon, Retailer } from '../../generated/prisma/index.js';

// Mock the db module before importing the service
jest.unstable_mockModule('../../lib/db.js', () => ({
  db: {
    retailer: {
      findUnique: jest.fn(),
    },
  },
}));

// Import after mocking
const { getCouponsByDomain } = await import('../../services/coupon.service.js');
const { NotFoundError } = await import('../../lib/errors.js');
const { db } = await import('../../lib/db.js');

const mockDb = db as jest.Mocked<typeof db>;

describe('CouponService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCouponsByDomain', () => {
    const mockCoupons: Coupon[] = [
      {
        id: '1',
        code: 'SAVE20',
        description: '20% off',
        successCount: 100,
        failureCount: 5,
        lastSuccessAt: new Date('2024-12-15'),
        lastTestedAt: new Date('2024-12-16'),
        expiryDate: null,
        source: 'admin',
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01'),
        retailerId: 'retailer-1',
      },
      {
        id: '2',
        code: 'FREESHIP',
        description: 'Free shipping',
        successCount: 50,
        failureCount: 2,
        lastSuccessAt: new Date('2024-12-14'),
        lastTestedAt: new Date('2024-12-16'),
        expiryDate: null,
        source: 'user-submission',
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-01'),
        retailerId: 'retailer-1',
      },
    ];

    const mockRetailer: Retailer & { coupons: Coupon[] } = {
      id: 'retailer-1',
      domain: 'nike.com',
      name: 'Nike',
      logoUrl: 'https://logo.clearbit.com/nike.com',
      homeUrl: 'https://www.nike.com',
      isActive: true,
      selectorConfig: null,
      createdAt: new Date('2024-12-01'),
      updatedAt: new Date('2024-12-01'),
      coupons: mockCoupons,
    };

    it('should return coupons for a valid domain', async () => {
      mockDb.retailer.findUnique.mockResolvedValue(mockRetailer);

      const result = await getCouponsByDomain('nike.com');

      expect(result).toEqual(mockCoupons);
      expect(mockDb.retailer.findUnique).toHaveBeenCalledWith({
        where: { domain: 'nike.com' },
        include: {
          coupons: {
            orderBy: {
              successCount: 'desc',
            },
          },
        },
      });
    });

    it('should strip www prefix from domain', async () => {
      mockDb.retailer.findUnique.mockResolvedValue(mockRetailer);

      await getCouponsByDomain('www.nike.com');

      expect(mockDb.retailer.findUnique).toHaveBeenCalledWith({
        where: { domain: 'nike.com' },
        include: expect.any(Object),
      });
    });

    it('should extract hostname from full URL', async () => {
      mockDb.retailer.findUnique.mockResolvedValue(mockRetailer);

      await getCouponsByDomain('https://www.nike.com/products');

      expect(mockDb.retailer.findUnique).toHaveBeenCalledWith({
        where: { domain: 'nike.com' },
        include: expect.any(Object),
      });
    });

    it('should handle URL without protocol', async () => {
      mockDb.retailer.findUnique.mockResolvedValue(mockRetailer);

      await getCouponsByDomain('nike.com/products');

      expect(mockDb.retailer.findUnique).toHaveBeenCalledWith({
        where: { domain: 'nike.com' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundError when retailer does not exist', async () => {
      mockDb.retailer.findUnique.mockResolvedValue(null);

      await expect(getCouponsByDomain('nonexistent.com')).rejects.toThrow(NotFoundError);
      await expect(getCouponsByDomain('nonexistent.com')).rejects.toThrow(
        'No retailer found for domain: nonexistent.com',
      );
    });

    it('should throw NotFoundError when retailer is inactive', async () => {
      const inactiveRetailer = { ...mockRetailer, isActive: false };
      mockDb.retailer.findUnique.mockResolvedValue(inactiveRetailer);

      await expect(getCouponsByDomain('nike.com')).rejects.toThrow(NotFoundError);
      await expect(getCouponsByDomain('nike.com')).rejects.toThrow('Retailer is not active: nike.com');
    });

    it('should return empty array when retailer has no coupons', async () => {
      const retailerWithNoCoupons = { ...mockRetailer, coupons: [] };
      mockDb.retailer.findUnique.mockResolvedValue(retailerWithNoCoupons);

      const result = await getCouponsByDomain('nike.com');

      expect(result).toEqual([]);
    });

    it('should return coupons ordered by successCount descending', async () => {
      mockDb.retailer.findUnique.mockResolvedValue(mockRetailer);

      const result = await getCouponsByDomain('nike.com');

      expect(result[0]?.successCount).toBeGreaterThan(result[1]?.successCount || 0);
    });

    it('should handle malformed URLs gracefully', async () => {
      mockDb.retailer.findUnique.mockResolvedValue(mockRetailer);

      // Should extract domain even from invalid URLs
      await getCouponsByDomain('not-a-url-at-all');

      // Verify it attempted to query with the cleaned input
      expect(mockDb.retailer.findUnique).toHaveBeenCalled();
    });
  });
});
