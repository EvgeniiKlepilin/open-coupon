import type { Coupon } from '@/types';

export const mockCoupons: Coupon[] = [
  {
    id: '1',
    code: 'SAVE20',
    description: '20% off your entire purchase',
    successCount: 150,
    failureCount: 10,
    lastSuccessAt: '2024-12-01T10:00:00Z',
    lastTestedAt: '2024-12-10T10:00:00Z',
    expiryDate: '2025-12-31T23:59:59Z',
    source: 'admin',
    retailerId: 'retailer-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-10T10:00:00Z',
  },
  {
    id: '2',
    code: 'FREESHIP',
    description: 'Free shipping on orders over $50',
    successCount: 80,
    failureCount: 120,
    lastSuccessAt: '2024-11-15T10:00:00Z',
    lastTestedAt: '2024-12-05T10:00:00Z',
    source: 'user-submission',
    retailerId: 'retailer-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-05T10:00:00Z',
  },
  {
    id: '3',
    code: 'EXPIRED10',
    description: 'Expired coupon',
    successCount: 200,
    failureCount: 5,
    lastSuccessAt: '2024-10-01T10:00:00Z',
    expiryDate: '2024-11-01T00:00:00Z', // Expired
    source: 'scraper-v1',
    retailerId: 'retailer-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-11-01T00:00:00Z',
  },
  {
    id: '4',
    code: 'EXPIRING30',
    description: 'Expires soon - 30% off',
    successCount: 50,
    failureCount: 50,
    lastSuccessAt: '2024-12-15T10:00:00Z',
    expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 3 days
    source: 'admin',
    retailerId: 'retailer-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z',
  },
];

export const mockTab: chrome.tabs.Tab = {
  id: 1,
  index: 0,
  pinned: false,
  highlighted: false,
  windowId: 1,
  active: true,
  incognito: false,
  selected: false,
  discarded: false,
  autoDiscardable: true,
  groupId: -1,
  url: 'https://example.com/checkout',
  title: 'Example Store - Checkout',
};

export const mockInvalidTab: chrome.tabs.Tab = {
  ...mockTab,
  url: 'chrome://extensions/',
};
