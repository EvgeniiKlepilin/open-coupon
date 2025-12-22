export interface Coupon {
  id: string;
  code: string;
  description: string;
  successCount: number;
  failureCount: number;
  lastSuccessAt?: string;
  lastTestedAt?: string;
  expiryDate?: string;
  source?: string;
  retailerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Retailer {
  id: string;
  domain: string;
  name: string;
  logoUrl?: string;
  homeUrl?: string;
  isActive: boolean;
  selectorConfig?: {
    input?: string;
    submit?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CouponResponse {
  data: Coupon[];
  retailer?: Retailer;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
