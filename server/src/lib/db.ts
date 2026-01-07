/**
 * Database client instance
 * Singleton Prisma Client for database operations
 */

import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

/**
 * Global Prisma Client instance
 * Prevents multiple instances in development with hot-reload
 */
declare global {
  var prisma: PrismaClient | undefined;
}

// Create PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const db =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}
