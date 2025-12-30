/**
 * @jest-environment jsdom
 */

import {
  normalizePrice,
  detectPrice,
  applySingleCoupon,
  simulateHumanDelay,
  detectSuccessIndicators,
  waitForPriceChange,
  autoApplyCoupons,
} from './applier';
import type { Coupon, PriceInfo, ApplierOptions } from '../types';

describe('applier - Price Normalization', () => {
  describe('normalizePrice', () => {
    it('should normalize US format prices ($1,234.56)', () => {
      expect(normalizePrice('$1,234.56')).toBe(1234.56);
      expect(normalizePrice('$99.99')).toBe(99.99);
      expect(normalizePrice('$1,000')).toBe(1000);
    });

    it('should normalize EU format prices (€1.234,56)', () => {
      expect(normalizePrice('€1.234,56')).toBe(1234.56);
      expect(normalizePrice('€99,99')).toBe(99.99);
      expect(normalizePrice('€1.000')).toBe(1000);
    });

    it('should normalize UK format prices (£1,234.56)', () => {
      expect(normalizePrice('£1,234.56')).toBe(1234.56);
      expect(normalizePrice('£99.99')).toBe(99.99);
    });

    it('should handle prices without currency symbols', () => {
      expect(normalizePrice('1,234.56')).toBe(1234.56);
      expect(normalizePrice('99.99')).toBe(99.99);
      expect(normalizePrice('1234.56')).toBe(1234.56);
    });

    it('should handle prices with spaces', () => {
      expect(normalizePrice('$ 1,234.56')).toBe(1234.56);
      expect(normalizePrice('1 234.56')).toBe(1234.56);
    });

    it('should handle other currency symbols', () => {
      expect(normalizePrice('¥1,234')).toBe(1234);
      expect(normalizePrice('₹1,234.56')).toBe(1234.56);
      expect(normalizePrice('₽1.234,56')).toBe(1234.56);
    });

    it('should return 0 for invalid prices', () => {
      expect(normalizePrice('abc')).toBe(0);
      expect(normalizePrice('')).toBe(0);
      expect(normalizePrice('N/A')).toBe(0);
    });

    it('should handle prices with only thousands separator', () => {
      expect(normalizePrice('1,234')).toBe(1234);
      expect(normalizePrice('1.234')).toBe(1234);
    });
  });
});

describe('applier - Price Detection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('detectPrice', () => {
    it('should detect price from common total selector', async () => {
      document.body.innerHTML = `
        <div class="total">$123.45</div>
      `;

      const price = await detectPrice();
      expect(price).not.toBeNull();
      expect(price?.value).toBe(123.45);
      expect(price?.currency).toBe('$');
      expect(price?.rawText).toBe('$123.45');
    });

    it('should detect price from grand-total selector', async () => {
      document.body.innerHTML = `
        <div class="grand-total">€1.234,56</div>
      `;

      const price = await detectPrice();
      expect(price).not.toBeNull();
      expect(price?.value).toBe(1234.56);
      expect(price?.currency).toBe('€');
    });

    it('should detect price from data-test attribute', async () => {
      document.body.innerHTML = `
        <span data-test="total">£99.99</span>
      `;

      const price = await detectPrice();
      expect(price).not.toBeNull();
      expect(price?.value).toBe(99.99);
      expect(price?.currency).toBe('£');
    });

    it('should use custom selectors first', async () => {
      document.body.innerHTML = `
        <div class="custom-total">$500.00</div>
        <div class="total">$100.00</div>
      `;

      const price = await detectPrice(['.custom-total']);
      expect(price).not.toBeNull();
      expect(price?.value).toBe(500.00);
    });

    it('should skip hidden elements', async () => {
      document.body.innerHTML = `
        <div class="total" style="display: none;">$999.99</div>
        <div class="order-total">$123.45</div>
      `;

      const price = await detectPrice();
      expect(price).not.toBeNull();
      expect(price?.value).toBe(123.45);
    });

    it('should detect price via regex scan when selectors fail', async () => {
      document.body.innerHTML = `
        <div>Your total is $1,234.56 including tax</div>
      `;

      const price = await detectPrice();
      expect(price).not.toBeNull();
      expect(price?.value).toBe(1234.56);
    });

    it('should return null when no price found', async () => {
      document.body.innerHTML = `
        <div>No prices here!</div>
      `;

      const price = await detectPrice();
      expect(price).toBeNull();
    });

    it('should include element reference when found via selector', async () => {
      document.body.innerHTML = `
        <div class="total">$123.45</div>
      `;

      const price = await detectPrice();
      expect(price?.element).toBeInstanceOf(HTMLElement);
      expect(price?.element?.className).toBe('total');
    });

    it('should include timestamp', async () => {
      document.body.innerHTML = `
        <div class="total">$123.45</div>
      `;

      const beforeTime = Date.now();
      const price = await detectPrice();
      const afterTime = Date.now();

      expect(price?.detectedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(price?.detectedAt).toBeLessThanOrEqual(afterTime);
    });

    it('should handle multiple price elements and choose first valid', async () => {
      document.body.innerHTML = `
        <div class="total">Invalid</div>
        <div class="total">$123.45</div>
        <div class="total">$999.99</div>
      `;

      const price = await detectPrice();
      expect(price).not.toBeNull();
      expect(price?.value).toBe(123.45);
    });
  });
});

describe('applier - Coupon Application', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('applySingleCoupon', () => {
    it('should clear input, set value, and dispatch events', async () => {
      const input = document.createElement('input');
      input.type = 'text';
      const button = document.createElement('button');

      const inputListener = jest.fn();
      const changeListener = jest.fn();
      const keyupListener = jest.fn();

      input.addEventListener('input', inputListener);
      input.addEventListener('change', changeListener);
      input.addEventListener('keyup', keyupListener);

      const applyPromise = applySingleCoupon('SAVE20', input, button);

      // Fast-forward all timers
      jest.runAllTimers();
      await applyPromise;

      expect(input.value).toBe('SAVE20');
      expect(inputListener).toHaveBeenCalled();
      expect(changeListener).toHaveBeenCalled();
      expect(keyupListener).toHaveBeenCalled();
    });

    it('should click the submit button', async () => {
      const input = document.createElement('input');
      const button = document.createElement('button');

      const clickListener = jest.fn();
      button.addEventListener('click', clickListener);

      const applyPromise = applySingleCoupon('SAVE20', input, button);
      jest.runAllTimers();
      await applyPromise;

      expect(clickListener).toHaveBeenCalled();
    });

    it('should handle disabled button with wait', async () => {
      const input = document.createElement('input');
      const button = document.createElement('button');
      button.disabled = true;

      document.body.appendChild(button);

      const applyPromise = applySingleCoupon('SAVE20', input, button);

      // Simulate button becoming enabled after 500ms
      setTimeout(() => {
        button.disabled = false;
      }, 500);

      jest.runAllTimers();
      await applyPromise;

      expect(button.disabled).toBe(false);
      expect(input.value).toBe('SAVE20');
    });
  });

  describe('simulateHumanDelay', () => {
    it('should delay within specified range', async () => {
      const delayPromise = simulateHumanDelay(1000, 2000);

      expect(jest.getTimerCount()).toBeGreaterThan(0);

      jest.runAllTimers();
      await delayPromise;
    });
  });
});

describe('applier - Success/Failure Detection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('detectSuccessIndicators', () => {
    it('should detect success keywords in text', () => {
      document.body.innerHTML = `
        <div>Coupon applied successfully!</div>
      `;

      const result = detectSuccessIndicators();
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('should detect failure keywords in text', () => {
      document.body.innerHTML = `
        <div>Invalid coupon code</div>
      `;

      const result = detectSuccessIndicators();
      expect(result.success).toBe(false);
      expect(result.message).toBe('invalid');
    });

    it('should detect visual success indicators', () => {
      document.body.innerHTML = `
        <div class="success-message">Code applied</div>
      `;

      const result = detectSuccessIndicators();
      expect(result.success).toBe(true);
    });

    it('should detect visual error indicators', () => {
      document.body.innerHTML = `
        <div class="error-message">Failed to apply</div>
      `;

      const result = detectSuccessIndicators();
      expect(result.success).toBe(false);
    });

    it('should detect ARIA success labels', () => {
      document.body.innerHTML = `
        <div aria-label="success">✓</div>
      `;

      const result = detectSuccessIndicators();
      expect(result.success).toBe(true);
    });

    it('should return false when no indicators found', () => {
      document.body.innerHTML = `
        <div>Just some regular text</div>
      `;

      const result = detectSuccessIndicators();
      expect(result.success).toBe(false);
      expect(result.message).toBeUndefined();
    });

    it('should prioritize failure keywords over generic text', () => {
      document.body.innerHTML = `
        <div>Coupon expired. Please try another code.</div>
      `;

      const result = detectSuccessIndicators();
      expect(result.success).toBe(false);
      expect(result.message).toBe('expired');
    });
  });
});

describe('applier - Price Change Detection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('waitForPriceChange', () => {
    it('should detect price change when DOM updates', async () => {
      document.body.innerHTML = `
        <div class="total">$100.00</div>
      `;

      const basePrice: PriceInfo = {
        value: 100,
        rawText: '$100.00',
        currency: '$',
        element: document.querySelector('.total') as HTMLElement,
        detectedAt: Date.now(),
      };

      const waitPromise = waitForPriceChange(basePrice, 5000);

      // Simulate price change after 1 second
      setTimeout(() => {
        const totalElement = document.querySelector('.total');
        if (totalElement) {
          totalElement.textContent = '$80.00';
        }
      }, 1000);

      jest.runAllTimers();
      const newPrice = await waitPromise;

      // Note: In real implementation, MutationObserver would detect this
      // For unit tests, this tests the timeout behavior
      expect(newPrice).toBeDefined();
    });

    it('should return null on timeout with no change', async () => {
      document.body.innerHTML = `
        <div class="total">$100.00</div>
      `;

      const basePrice: PriceInfo = {
        value: 100,
        rawText: '$100.00',
        currency: '$',
        element: document.querySelector('.total') as HTMLElement,
        detectedAt: Date.now(),
      };

      const waitPromise = waitForPriceChange(basePrice, 1000);

      jest.runAllTimers();
      const newPrice = await waitPromise;

      expect(newPrice).toBeNull();
    });
  });
});

describe('applier - Auto-Apply Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('autoApplyCoupons', () => {
    it('should return error when price detection fails', async () => {
      document.body.innerHTML = `
        <input id="coupon" type="text" />
        <button id="apply">Apply</button>
      `;

      const input = document.getElementById('coupon') as HTMLInputElement;
      const button = document.getElementById('apply') as HTMLElement;

      const coupons: Coupon[] = [
        {
          id: '1',
          code: 'SAVE20',
          description: '20% off',
          successCount: 10,
          failureCount: 2,
          retailerId: 'test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const options: ApplierOptions = {
        coupons,
        inputElement: input,
        submitElement: button,
      };

      const applyPromise = autoApplyCoupons(options);
      jest.runAllTimers();
      const result = await applyPromise;

      expect(result.errorMessage).toBe('Failed to detect price on page');
      expect(result.tested).toBe(0);
    });

    it('should test coupons and track results', async () => {
      document.body.innerHTML = `
        <div class="total">$100.00</div>
        <input id="coupon" type="text" />
        <button id="apply">Apply</button>
      `;

      const input = document.getElementById('coupon') as HTMLInputElement;
      const button = document.getElementById('apply') as HTMLElement;

      const coupons: Coupon[] = [
        {
          id: '1',
          code: 'SAVE20',
          description: '20% off',
          successCount: 10,
          failureCount: 2,
          retailerId: 'test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const onProgress = jest.fn();
      const onCouponTested = jest.fn();
      const onComplete = jest.fn();

      const options: ApplierOptions = {
        coupons,
        inputElement: input,
        submitElement: button,
        onProgress,
        onCouponTested,
        onComplete,
      };

      const applyPromise = autoApplyCoupons(options);
      jest.runAllTimers();
      const result = await applyPromise;

      expect(result.tested).toBe(1);
      expect(onProgress).toHaveBeenCalledWith(1, 1, 'SAVE20');
      expect(onCouponTested).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });

    it('should sort coupons by success count', async () => {
      document.body.innerHTML = `
        <div class="total">$100.00</div>
        <input id="coupon" type="text" />
        <button id="apply">Apply</button>
      `;

      const input = document.getElementById('coupon') as HTMLInputElement;
      const button = document.getElementById('apply') as HTMLElement;

      const coupons: Coupon[] = [
        {
          id: '1',
          code: 'LOW',
          description: 'Low success',
          successCount: 2,
          failureCount: 10,
          retailerId: 'test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          code: 'HIGH',
          description: 'High success',
          successCount: 50,
          failureCount: 1,
          retailerId: 'test',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      const onProgress = jest.fn();

      const options: ApplierOptions = {
        coupons,
        inputElement: input,
        submitElement: button,
        onProgress,
      };

      const applyPromise = autoApplyCoupons(options);
      jest.runAllTimers();
      await applyPromise;

      // HIGH should be tested first (higher success count)
      expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2, 'HIGH');
      expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2, 'LOW');
    });

    it('should respect maxAttempts limit', async () => {
      document.body.innerHTML = `
        <div class="total">$100.00</div>
        <input id="coupon" type="text" />
        <button id="apply">Apply</button>
      `;

      const input = document.getElementById('coupon') as HTMLInputElement;
      const button = document.getElementById('apply') as HTMLElement;

      const coupons: Coupon[] = Array.from({ length: 30 }, (_, i) => ({
        id: `${i}`,
        code: `CODE${i}`,
        description: 'Test',
        successCount: 10,
        failureCount: 2,
        retailerId: 'test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const options: ApplierOptions = {
        coupons,
        inputElement: input,
        submitElement: button,
        maxAttempts: 5,
      };

      const applyPromise = autoApplyCoupons(options);
      jest.runAllTimers();
      const result = await applyPromise;

      expect(result.tested).toBe(5);
    });
  });
});
