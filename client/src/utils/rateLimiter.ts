/**
 * Rate Limiter
 * Client-side rate limiting to prevent API abuse
 */

export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 20, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Attempt to acquire a rate limit slot
   * Throws error if rate limit exceeded
   */
  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      throw new Error(
        `Rate limit exceeded. Maximum ${this.maxRequests} requests per ${this.windowMs / 1000}s. Try again in ${Math.ceil(waitTime / 1000)}s`
      );
    }

    this.requests.push(now);
  }

  /**
   * Get current usage statistics
   */
  getStats(): { current: number; max: number; resetIn: number } {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    const resetIn = this.requests.length > 0
      ? this.windowMs - (now - this.requests[0])
      : 0;

    return {
      current: this.requests.length,
      max: this.maxRequests,
      resetIn,
    };
  }

  /**
   * Reset the rate limiter
   */
  reset(): void {
    this.requests = [];
  }
}

// Global rate limiters for different services
export const apiRateLimiter = new RateLimiter(20, 60000); // 20 requests per minute
export const feedbackRateLimiter = new RateLimiter(50, 60000); // 50 requests per minute
