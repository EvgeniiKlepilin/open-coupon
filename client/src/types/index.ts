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

// Detector types
export type DetectionMethod = 'retailer-specific' | 'attribute' | 'label' | 'heuristic';

export interface DetectionResult {
  inputElement: HTMLInputElement | null;
  submitElement: HTMLElement | null;
  confidence: number;
  detectionMethod: DetectionMethod;
  containerElement?: HTMLElement;
}

export interface SelectorConfig {
  input?: string;
  submit?: string;
  container?: string;
}

export interface DetectorOptions {
  selectorConfig?: SelectorConfig;
  keywords?: string[];
  retryAttempts?: number;
  retryDelay?: number;
}

// Applier types
export type DetectionMethodType = 'price-change' | 'success-message' | 'failure-message' | 'timeout';

export interface PriceInfo {
  value: number; // Normalized numeric price
  rawText: string; // Original price text from DOM
  currency: string; // Detected currency symbol
  element: HTMLElement | null; // DOM element containing price
  detectedAt: number; // Timestamp (Date.now())
}

export interface CouponTestResult {
  couponId: string;
  code: string;
  priceBefore: PriceInfo;
  priceAfter: PriceInfo;
  discountAmount: number; // Calculated: priceBefore - priceAfter
  discountPercentage: number; // Calculated: (discount / priceBefore) * 100
  success: boolean;
  failureReason?: string; // e.g., "Invalid coupon", "Expired", "Timeout"
  detectionMethod: DetectionMethodType;
  durationMs: number; // Time taken to test this coupon
}

export interface ApplierResult {
  tested: number; // Total coupons tested
  successful: number; // Number that successfully applied
  failed: number; // Number that failed
  bestCoupon: CouponTestResult | null; // Coupon with largest discount
  allResults: CouponTestResult[]; // Full test history
  cancelledByUser: boolean;
  errorMessage?: string; // Fatal error that stopped the process
}

export interface ApplierOptions {
  coupons: Coupon[]; // List of coupons to test (from API)
  inputElement: HTMLInputElement;
  submitElement: HTMLElement;
  priceSelectors?: string[]; // Custom price element selectors
  delayBetweenAttempts?: number; // Milliseconds (default: 2000-4000 random)
  maxAttempts?: number; // Maximum coupons to test (default: 20)
  timeout?: number; // Max wait per coupon (default: 5000ms)
  onProgress?: (current: number, total: number, couponCode: string) => void;
  onCouponTested?: (result: CouponTestResult) => void;
  onComplete?: (result: ApplierResult) => void;
  onCancel?: () => void;
}

// Feedback types
export type FailureReason = 'expired' | 'invalid' | 'minimum-not-met' | 'out-of-stock' | 'other';

export interface FeedbackMetadata {
  discountAmount?: number;
  discountPercentage?: number;
  failureReason?: FailureReason;
  domain: string;
  testDurationMs: number;
  detectionMethod: DetectionMethodType;
  testedAt: string;
}

export interface FeedbackRequest {
  success: boolean;
  metadata?: FeedbackMetadata;
}

export interface FeedbackResponse {
  success: true;
  message: string;
  updatedCoupon: {
    id: string;
    successCount: number;
    failureCount: number;
    successRate: number;
    lastSuccessAt?: string;
    lastTestedAt: string;
  };
}

export interface FeedbackError {
  success: false;
  error: string;
  code?: 'COUPON_NOT_FOUND' | 'INVALID_REQUEST' | 'RATE_LIMITED' | 'SERVER_ERROR';
}

export interface BatchFeedbackItem {
  couponId: string;
  success: boolean;
  metadata?: FeedbackMetadata;
}

export interface BatchFeedbackRequest {
  feedback: BatchFeedbackItem[];
}

export interface BatchFeedbackResponse {
  success: true;
  message: string;
  processed: number;
  failed: number;
  results: Array<{
    couponId: string;
    success: boolean;
    error?: string;
  }>;
}

export interface QueuedFeedback {
  couponId: string;
  feedback: FeedbackRequest;
  attempts: number;
  createdAt: number;
  lastAttemptAt?: number;
}
