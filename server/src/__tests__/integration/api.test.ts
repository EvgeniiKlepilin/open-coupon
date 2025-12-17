/**
 * Integration tests for API endpoints
 * Tests the full request/response cycle with Supertest
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

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/v1', couponRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

describe('API Integration Tests', () => {
  // Store test data IDs for cleanup
  const testRetailerIds: string[] = [];

  beforeAll(async () => {
    // Seed test data (don't clear existing data)
    const testStore = await db.retailer.create({
      data: {
        domain: 'teststore.com',
        name: 'Test Store',
        logoUrl: 'https://example.com/logo.png',
        homeUrl: 'https://teststore.com',
        isActive: true,
        selectorConfig: {
          input: '#promo',
          submit: '#apply',
        },
        coupons: {
          create: [
            {
              code: 'TEST20',
              description: '20% off',
              successCount: 100,
              failureCount: 5,
              source: 'admin',
              lastSuccessAt: new Date('2024-12-15'),
              lastTestedAt: new Date('2024-12-16'),
            },
            {
              code: 'FREESHIP',
              description: 'Free shipping',
              successCount: 50,
              failureCount: 2,
              source: 'user-submission',
              lastSuccessAt: new Date('2024-12-14'),
              lastTestedAt: new Date('2024-12-16'),
            },
            {
              code: 'SAVE10',
              description: '$10 off',
              successCount: 25,
              failureCount: 10,
              source: 'scraper-v1',
              lastTestedAt: new Date('2024-12-10'),
            },
          ],
        },
      },
    });
    testRetailerIds.push(testStore.id);

    // Create inactive retailer
    const inactiveStore = await db.retailer.create({
      data: {
        domain: 'inactive.com',
        name: 'Inactive Store',
        isActive: false,
        coupons: {
          create: [
            {
              code: 'INACTIVE',
              description: 'Should not be returned',
              successCount: 0,
              failureCount: 0,
              source: 'admin',
            },
          ],
        },
      },
    });
    testRetailerIds.push(inactiveStore.id);
  });

  afterAll(async () => {
    // Clean up ONLY test data (not seed data)
    // Delete retailers cascade deletes their coupons
    await db.retailer.deleteMany({
      where: {
        id: {
          in: testRetailerIds,
        },
      },
    });
    await db.$disconnect();
  });

  describe('GET /health', () => {
    it('should return 200 OK with status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /api/v1/coupons', () => {
    it('should return coupons for a valid domain', async () => {
      const response = await request(app).get('/api/v1/coupons?domain=teststore.com');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(3);

      // Verify coupons are ordered by successCount DESC
      expect(response.body.data[0].successCount).toBeGreaterThanOrEqual(
        response.body.data[1].successCount
      );
      expect(response.body.data[1].successCount).toBeGreaterThanOrEqual(
        response.body.data[2].successCount
      );
    });

    it('should return coupons with correct structure', async () => {
      const response = await request(app).get('/api/v1/coupons?domain=teststore.com');

      expect(response.status).toBe(200);
      const coupon = response.body.data[0];

      expect(coupon).toHaveProperty('id');
      expect(coupon).toHaveProperty('code');
      expect(coupon).toHaveProperty('description');
      expect(coupon).toHaveProperty('successCount');
      expect(coupon).toHaveProperty('failureCount');
      expect(coupon).toHaveProperty('lastSuccessAt');
      expect(coupon).toHaveProperty('lastTestedAt');
      expect(coupon).toHaveProperty('expiryDate');
      expect(coupon).toHaveProperty('source');
      expect(coupon).toHaveProperty('createdAt');
      expect(coupon).toHaveProperty('updatedAt');
      expect(coupon).toHaveProperty('retailerId');
    });

    it('should handle www prefix in domain', async () => {
      const response = await request(app).get('/api/v1/coupons?domain=www.teststore.com');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
    });

    it('should handle full URL with path', async () => {
      const response = await request(app).get(
        '/api/v1/coupons?domain=https://www.teststore.com/products'
      );

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
    });

    it('should return 404 for non-existent retailer', async () => {
      const response = await request(app).get('/api/v1/coupons?domain=nonexistent.com');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.message).toContain('No retailer found');
      expect(response.body.error.statusCode).toBe(404);
    });

    it('should return 404 for inactive retailer', async () => {
      const response = await request(app).get('/api/v1/coupons?domain=inactive.com');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('Retailer is not active');
      expect(response.body.error.statusCode).toBe(404);
    });

    it('should return 400 when domain parameter is missing', async () => {
      const response = await request(app).get('/api/v1/coupons');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('domain');
      expect(response.body.error.message).toContain('required');
      expect(response.body.error.statusCode).toBe(400);
    });

    it('should return 400 when domain parameter is empty', async () => {
      const response = await request(app).get('/api/v1/coupons?domain=');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should set correct Content-Type header', async () => {
      const response = await request(app).get('/api/v1/coupons?domain=teststore.com');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should return empty array for retailer with no coupons', async () => {
      // Create retailer with no coupons
      const noCouponsStore = await db.retailer.create({
        data: {
          domain: 'nocoupons.com',
          name: 'No Coupons Store',
          isActive: true,
        },
      });

      const response = await request(app).get('/api/v1/coupons?domain=nocoupons.com');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);

      // Clean up this specific test data
      await db.retailer.delete({
        where: { id: noCouponsStore.id },
      });
    });
  });

  describe('GET /api/v1/undefined-route', () => {
    it('should return 404 for undefined routes', async () => {
      const response = await request(app).get('/api/v1/undefined-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.message).toContain('not found');
    });
  });

  describe('Error handling', () => {
    it('should not expose stack trace in non-development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app).get('/api/v1/coupons?domain=error.com');

      expect(response.body.error).not.toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });
  });
});
