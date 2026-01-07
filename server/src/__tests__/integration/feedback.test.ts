/**
 * Integration tests for Feedback API endpoints
 * Tests the full request/response cycle for feedback submission
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import couponRoutes from '../../routes/coupon.routes.js';
import { errorHandler, notFoundHandler } from '../../middleware/error.middleware.js';
import { db } from '../../lib/db.js';

// Create test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/v1', couponRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

describe('Feedback API Integration Tests', () => {
  let testRetailerId: string;
  let testCouponId: string;
  let testCouponId2: string;
  let testCouponId3: string;

  beforeAll(async () => {
    // Seed test data
    const testStore = await db.retailer.create({
      data: {
        domain: 'feedbacktest.com',
        name: 'Feedback Test Store',
        isActive: true,
        coupons: {
          create: [
            {
              code: 'FEEDBACK20',
              description: '20% off',
              successCount: 5,
              failureCount: 2,
              source: 'admin',
            },
            {
              code: 'FEEDBACK30',
              description: '30% off',
              successCount: 10,
              failureCount: 1,
              source: 'admin',
            },
            {
              code: 'FEEDBACK50',
              description: '50% off',
              successCount: 0,
              failureCount: 0,
              source: 'admin',
            },
          ],
        },
      },
      include: {
        coupons: true,
      },
    });

    testRetailerId = testStore.id;
    testCouponId = testStore.coupons[0].id;
    testCouponId2 = testStore.coupons[1].id;
    testCouponId3 = testStore.coupons[2].id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (testRetailerId) {
      await db.retailer.delete({ where: { id: testRetailerId } });
    }
  });

  describe('POST /api/v1/coupons/:id/feedback', () => {
    it('should successfully record success feedback', async () => {
      const response = await request(app)
        .post(`/api/v1/coupons/${testCouponId}/feedback`)
        .send({
          success: true,
          metadata: {
            discountAmount: 25.5,
            discountPercentage: 20,
            domain: 'feedbacktest.com',
            testDurationMs: 2500,
            detectionMethod: 'price-change',
            testedAt: new Date().toISOString(),
          },
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Feedback recorded successfully',
        updatedCoupon: {
          id: testCouponId,
          successCount: 6,
          failureCount: 2,
        },
      });

      expect(response.body.updatedCoupon.lastSuccessAt).toBeDefined();
      expect(response.body.updatedCoupon.lastTestedAt).toBeDefined();
      expect(response.body.updatedCoupon.successRate).toBeGreaterThan(0);
    });

    it('should successfully record failure feedback', async () => {
      const response = await request(app)
        .post(`/api/v1/coupons/${testCouponId}/feedback`)
        .send({
          success: false,
          metadata: {
            failureReason: 'expired',
            domain: 'feedbacktest.com',
            testDurationMs: 1500,
            detectionMethod: 'failure-message',
            testedAt: new Date().toISOString(),
          },
        })
        .expect(200);

      expect(response.body.updatedCoupon.failureCount).toBe(3);
    });

    it('should accept minimal valid feedback (success only)', async () => {
      const response = await request(app)
        .post(`/api/v1/coupons/${testCouponId3}/feedback`)
        .send({
          success: true,
        })
        .expect(200);

      expect(response.body.updatedCoupon.successCount).toBe(1);
      expect(response.body.updatedCoupon.successRate).toBe(100);
    });

    it('should return 404 when coupon does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/123e4567-e89b-12d3-a456-999999999999/feedback')
        .send({
          success: true,
        })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should return 400 when coupon ID is invalid UUID', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/invalid-uuid/feedback')
        .send({
          success: true,
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid coupon ID');
    });

    it('should update lastSuccessAt only on success', async () => {
      // Get initial state
      const initialCoupon = await db.coupon.findUnique({
        where: { id: testCouponId2 },
      });

      const initialLastSuccessAt = initialCoupon?.lastSuccessAt;

      // Submit success feedback
      await request(app).post(`/api/v1/coupons/${testCouponId2}/feedback`).send({ success: true }).expect(200);

      // Verify lastSuccessAt was updated
      const updatedCoupon = await db.coupon.findUnique({
        where: { id: testCouponId2 },
      });

      expect(updatedCoupon?.lastSuccessAt).not.toEqual(initialLastSuccessAt);
      expect(updatedCoupon?.lastSuccessAt).toBeDefined();
    });
  });

  describe('POST /api/v1/coupons/feedback/batch', () => {
    it('should process batch feedback successfully', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/feedback/batch')
        .send({
          feedback: [
            {
              couponId: testCouponId,
              success: true,
              metadata: {
                discountAmount: 10,
                domain: 'feedbacktest.com',
                testDurationMs: 2000,
                detectionMethod: 'price-change',
                testedAt: new Date().toISOString(),
              },
            },
            {
              couponId: testCouponId2,
              success: false,
              metadata: {
                failureReason: 'invalid',
                domain: 'feedbacktest.com',
                testDurationMs: 1500,
                detectionMethod: 'failure-message',
                testedAt: new Date().toISOString(),
              },
            },
          ],
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        processed: 2,
        failed: 0,
      });

      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0].success).toBe(true);
      expect(response.body.results[1].success).toBe(true);
    });

    it('should handle partial batch failures gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/coupons/feedback/batch')
        .send({
          feedback: [
            {
              couponId: testCouponId,
              success: true,
            },
            {
              couponId: '123e4567-e89b-12d3-a456-999999999999', // Non-existent
              success: false,
            },
          ],
        })
        .expect(200);

      expect(response.body.processed).toBe(1);
      expect(response.body.failed).toBe(1);
      expect(response.body.results).toHaveLength(2);
      expect(response.body.results[0].success).toBe(true);
      expect(response.body.results[1].success).toBe(false);
      expect(response.body.results[1].error).toContain('not found');
    });
  });
});
