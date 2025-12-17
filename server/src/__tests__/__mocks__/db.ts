/**
 * Manual mock for database client
 * Used in unit tests
 */

export const mockFindUnique = jest.fn();

export const db = {
  retailer: {
    findUnique: mockFindUnique,
  },
  coupon: {
    deleteMany: jest.fn(),
  },
  $disconnect: jest.fn(),
} as any;
