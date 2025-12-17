/**
 * Database Seed Script
 * Populates the database with test data for development
 */

import { PrismaClient } from '../src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.coupon.deleteMany();
  await prisma.retailer.deleteMany();

  // Create Nike retailer with coupons
  console.log('🏪 Creating Nike retailer...');
  const nike = await prisma.retailer.create({
    data: {
      domain: 'nike.com',
      name: 'Nike',
      logoUrl: 'https://logo.clearbit.com/nike.com',
      homeUrl: 'https://www.nike.com',
      isActive: true,
      selectorConfig: {
        input: '#promoCode',
        submit: 'button[type="submit"]',
      },
      coupons: {
        create: [
          {
            code: 'NIKE20',
            description: '20% off entire order',
            successCount: 150,
            failureCount: 10,
            source: 'admin',
            lastSuccessAt: new Date('2024-12-15'),
            lastTestedAt: new Date('2024-12-16'),
          },
          {
            code: 'FREESHIP',
            description: 'Free shipping on orders over $50',
            successCount: 89,
            failureCount: 5,
            source: 'user-submission',
            lastSuccessAt: new Date('2024-12-14'),
            lastTestedAt: new Date('2024-12-16'),
          },
          {
            code: 'SAVE15',
            description: '$15 off orders over $100',
            successCount: 45,
            failureCount: 12,
            source: 'scraper-v1',
            lastTestedAt: new Date('2024-12-10'),
          },
        ],
      },
    },
  });

  // Create Amazon retailer with coupons
  console.log('🏪 Creating Amazon retailer...');
  const amazon = await prisma.retailer.create({
    data: {
      domain: 'amazon.com',
      name: 'Amazon',
      logoUrl: 'https://logo.clearbit.com/amazon.com',
      homeUrl: 'https://www.amazon.com',
      isActive: true,
      selectorConfig: {
        input: '#gc-redemption-input',
        submit: '#gc-redemption-apply',
      },
      coupons: {
        create: [
          {
            code: 'PRIME10',
            description: '10% off for Prime members',
            successCount: 200,
            failureCount: 3,
            source: 'admin',
            lastSuccessAt: new Date('2024-12-16'),
            lastTestedAt: new Date('2024-12-16'),
          },
          {
            code: 'WELCOME5',
            description: '$5 off first order',
            successCount: 112,
            failureCount: 8,
            source: 'user-submission',
            lastSuccessAt: new Date('2024-12-15'),
            lastTestedAt: new Date('2024-12-16'),
            expiryDate: new Date('2025-12-31'),
          },
        ],
      },
    },
  });

  // Create an inactive retailer (should not return coupons)
  console.log('🏪 Creating Best Buy retailer (inactive)...');
  await prisma.retailer.create({
    data: {
      domain: 'bestbuy.com',
      name: 'Best Buy',
      logoUrl: 'https://logo.clearbit.com/bestbuy.com',
      homeUrl: 'https://www.bestbuy.com',
      isActive: false,
      coupons: {
        create: [
          {
            code: 'INACTIVE',
            description: 'This should not be returned',
            successCount: 0,
            failureCount: 0,
            source: 'admin',
          },
        ],
      },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('   - Nike: 3 coupons');
  console.log('   - Amazon: 2 coupons');
  console.log('   - Best Buy: 1 coupon (inactive retailer)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
