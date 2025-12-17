/**
 * Jest test setup file
 * Runs before each test suite
 */

// Set test environment
process.env.NODE_ENV = 'test';
// Use the same database as development for integration tests
// Tests will use isolated test data and clean up after themselves
process.env.DATABASE_URL = 'postgresql://admin:root@localhost:5432/opencoupon_db';
