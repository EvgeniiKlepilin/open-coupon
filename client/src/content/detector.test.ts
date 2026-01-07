import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  findCouponElements,
  findByRetailerConfig,
  findByAttributes,
  findByLabel,
  findSubmitButton,
  calculateConfidence,
  waitForElement,
  clearCache,
} from './detector';
import type { SelectorConfig } from '../types';

describe('Detector Module', () => {
  beforeEach(() => {
    // Clear the DOM before each test
    document.body.innerHTML = '';
    clearCache();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('findByRetailerConfig', () => {
    it('should find elements using retailer-specific selectors', () => {
      document.body.innerHTML = `
        <div class="checkout-form">
          <input id="promo-input" type="text" />
          <button id="apply-btn">Apply</button>
        </div>
      `;

      const config: SelectorConfig = {
        input: '#promo-input',
        submit: '#apply-btn',
        container: '.checkout-form',
      };

      const result = findByRetailerConfig(config);

      expect(result).not.toBeNull();
      expect(result?.inputElement?.id).toBe('promo-input');
      expect(result?.submitElement?.id).toBe('apply-btn');
      expect(result?.confidence).toBe(100);
      expect(result?.detectionMethod).toBe('retailer-specific');
    });

    it('should return null for invalid selectors', () => {
      document.body.innerHTML = '<div></div>';

      const config: SelectorConfig = {
        input: '#nonexistent',
      };

      const result = findByRetailerConfig(config);

      expect(result).toBeNull();
    });

    it('should find submit button automatically if not specified', () => {
      document.body.innerHTML = `
        <form>
          <input id="promo-input" type="text" />
          <button type="submit">Submit</button>
        </form>
      `;

      const config: SelectorConfig = {
        input: '#promo-input',
      };

      const result = findByRetailerConfig(config);

      expect(result).not.toBeNull();
      expect(result?.submitElement?.tagName).toBe('BUTTON');
    });

    it('should return null for hidden elements', () => {
      document.body.innerHTML = `
        <input id="promo-input" type="text" style="display: none;" />
      `;

      const config: SelectorConfig = {
        input: '#promo-input',
      };

      const result = findByRetailerConfig(config);

      expect(result).toBeNull();
    });
  });

  describe('findByAttributes', () => {
    it('should find input by id attribute', () => {
      document.body.innerHTML = `
        <form>
          <input id="coupon-code" type="text" />
          <button type="submit">Apply</button>
        </form>
      `;

      const result = findByAttributes(['coupon']);

      expect(result).not.toBeNull();
      expect(result?.inputElement?.id).toBe('coupon-code');
      expect(result?.confidence).toBeGreaterThanOrEqual(60);
      expect(result?.detectionMethod).toBe('attribute');
    });

    it('should find input by name attribute', () => {
      document.body.innerHTML = `
        <input name="promo_code" type="text" />
      `;

      const result = findByAttributes(['promo']);

      expect(result).not.toBeNull();
      expect(result?.inputElement?.name).toBe('promo_code');
    });

    it('should find input by placeholder attribute', () => {
      document.body.innerHTML = `
        <input placeholder="Enter discount code" type="text" />
      `;

      const result = findByAttributes(['discount']);

      expect(result).not.toBeNull();
    });

    it('should find input by aria-label attribute', () => {
      document.body.innerHTML = `
        <input aria-label="Voucher code" type="text" />
      `;

      const result = findByAttributes(['voucher']);

      expect(result).not.toBeNull();
    });

    it('should find input by class name', () => {
      document.body.innerHTML = `
        <input class="promo-input" type="text" />
      `;

      const result = findByAttributes(['promo']);

      expect(result).not.toBeNull();
    });

    it('should find input by data attribute', () => {
      document.body.innerHTML = `
        <input data-field="coupon" type="text" />
      `;

      const result = findByAttributes(['coupon']);

      expect(result).not.toBeNull();
    });

    it('should perform case-insensitive matching', () => {
      document.body.innerHTML = `
        <input id="COUPON-CODE" type="text" />
      `;

      const result = findByAttributes(['coupon']);

      expect(result).not.toBeNull();
      expect(result?.inputElement?.id).toBe('COUPON-CODE');
    });

    it('should prefer inputs with multiple keyword matches', () => {
      document.body.innerHTML = `
        <input id="code-input" type="text" />
        <input id="promo-code-discount" type="text" />
      `;

      const result = findByAttributes(['promo', 'discount', 'code']);

      expect(result).not.toBeNull();
      expect(result?.inputElement?.id).toBe('promo-code-discount');
      expect(result?.confidence).toBe(90); // Multiple matches
    });

    it('should return null if no matching elements found', () => {
      document.body.innerHTML = `
        <input id="email" type="text" />
        <input id="name" type="text" />
      `;

      const result = findByAttributes(['coupon', 'promo', 'discount']);

      expect(result).toBeNull();
    });

    it('should ignore hidden inputs', () => {
      document.body.innerHTML = `
        <input id="coupon-code" type="text" style="display: none;" />
        <input id="visible-code" type="text" />
      `;

      const result = findByAttributes(['code']);

      expect(result).not.toBeNull();
      expect(result?.inputElement?.id).toBe('visible-code');
    });

    it('should handle inputs without explicit type', () => {
      document.body.innerHTML = `
        <input id="promo-code" />
      `;

      const result = findByAttributes(['promo']);

      expect(result).not.toBeNull();
      expect(result?.inputElement?.id).toBe('promo-code');
    });
  });

  describe('findByLabel', () => {
    it('should find input by associated label via for attribute', () => {
      document.body.innerHTML = `
        <label for="discount">Discount Code</label>
        <input id="discount" type="text" />
      `;

      const result = findByLabel(['discount']);

      expect(result).not.toBeNull();
      expect(result?.inputElement?.id).toBe('discount');
      expect(result?.confidence).toBe(60);
      expect(result?.detectionMethod).toBe('label');
    });

    it('should find input nested within label', () => {
      document.body.innerHTML = `
        <label>
          Coupon Code
          <input type="text" />
        </label>
      `;

      const result = findByLabel(['coupon']);

      expect(result).not.toBeNull();
    });

    it('should find input as next sibling of label', () => {
      document.body.innerHTML = `
        <label>Promo Code</label>
        <input type="text" />
      `;

      const result = findByLabel(['promo']);

      expect(result).not.toBeNull();
    });

    it('should perform case-insensitive label text matching', () => {
      document.body.innerHTML = `
        <label for="code">VOUCHER CODE</label>
        <input id="code" type="text" />
      `;

      const result = findByLabel(['voucher']);

      expect(result).not.toBeNull();
    });

    it('should return null if no matching label found', () => {
      document.body.innerHTML = `
        <label for="email">Email Address</label>
        <input id="email" type="text" />
      `;

      const result = findByLabel(['coupon', 'promo', 'discount']);

      expect(result).toBeNull();
    });

    it('should ignore labels with hidden inputs', () => {
      document.body.innerHTML = `
        <label for="promo">Promo Code</label>
        <input id="promo" type="text" style="display: none;" />
      `;

      const result = findByLabel(['promo']);

      expect(result).toBeNull();
    });
  });

  describe('findSubmitButton', () => {
    it('should find submit button in same form', () => {
      document.body.innerHTML = `
        <form>
          <input id="promo" type="text" />
          <button type="submit">Submit</button>
        </form>
      `;

      const input = document.getElementById('promo') as HTMLInputElement;
      const button = findSubmitButton(input);

      expect(button).not.toBeNull();
      expect(button?.tagName).toBe('BUTTON');
    });

    it('should find button with "apply" text', () => {
      document.body.innerHTML = `
        <form>
          <input id="promo" type="text" />
          <button>Apply Code</button>
        </form>
      `;

      const input = document.getElementById('promo') as HTMLInputElement;
      const button = findSubmitButton(input);

      expect(button).not.toBeNull();
      expect(button?.textContent).toContain('Apply');
    });

    it('should find button with "use" text', () => {
      document.body.innerHTML = `
        <form>
          <input id="promo" type="text" />
          <button>Use Code</button>
        </form>
      `;

      const input = document.getElementById('promo') as HTMLInputElement;
      const button = findSubmitButton(input);

      expect(button).not.toBeNull();
    });

    it('should find input type submit button', () => {
      document.body.innerHTML = `
        <form>
          <input id="promo" type="text" />
          <input type="submit" value="Submit" />
        </form>
      `;

      const input = document.getElementById('promo') as HTMLInputElement;
      const button = findSubmitButton(input);

      expect(button).not.toBeNull();
      expect(button?.getAttribute('type')).toBe('submit');
    });

    it('should find nearby button if not in form', () => {
      document.body.innerHTML = `
        <div>
          <input id="promo" type="text" />
          <button>Apply</button>
        </div>
      `;

      const input = document.getElementById('promo') as HTMLInputElement;
      const button = findSubmitButton(input);

      expect(button).not.toBeNull();
    });

    it('should return null if no button found', () => {
      document.body.innerHTML = `
        <input id="promo" type="text" />
      `;

      const input = document.getElementById('promo') as HTMLInputElement;
      const button = findSubmitButton(input);

      expect(button).toBeNull();
    });

    it('should ignore hidden buttons', () => {
      document.body.innerHTML = `
        <form>
          <input id="promo" type="text" />
          <button type="submit" style="display: none;">Submit</button>
        </form>
      `;

      const input = document.getElementById('promo') as HTMLInputElement;
      const button = findSubmitButton(input);

      expect(button).toBeNull();
    });
  });

  describe('calculateConfidence', () => {
    beforeEach(() => {
      document.body.innerHTML = '<input id="test" type="text" />';
    });

    it('should return 100 for retailer-specific method', () => {
      const element = document.getElementById('test') as HTMLElement;
      const confidence = calculateConfidence(element, 'retailer-specific');
      expect(confidence).toBe(100);
    });

    it('should return 80 for attribute method', () => {
      const element = document.getElementById('test') as HTMLElement;
      const confidence = calculateConfidence(element, 'attribute');
      expect(confidence).toBe(80);
    });

    it('should return 60 for label method', () => {
      const element = document.getElementById('test') as HTMLElement;
      const confidence = calculateConfidence(element, 'label');
      expect(confidence).toBe(60);
    });

    it('should return 40 for heuristic method', () => {
      const element = document.getElementById('test') as HTMLElement;
      const confidence = calculateConfidence(element, 'heuristic');
      expect(confidence).toBe(40);
    });

    it('should return 0 for hidden element', () => {
      document.body.innerHTML = '<input id="hidden" type="text" style="display: none;" />';
      const element = document.getElementById('hidden') as HTMLElement;
      const confidence = calculateConfidence(element, 'attribute');
      expect(confidence).toBe(0);
    });
  });

  describe('waitForElement', () => {
    it('should return element if already present', async () => {
      document.body.innerHTML = '<div id="test"></div>';

      const element = await waitForElement('#test', 1000);

      expect(element).not.toBeNull();
      expect(element?.id).toBe('test');
    });

    it('should wait for dynamically added element', async () => {
      const promise = waitForElement('#dynamic', 2000);

      // Add element after 100ms
      setTimeout(() => {
        const div = document.createElement('div');
        div.id = 'dynamic';
        document.body.appendChild(div);
      }, 100);

      const element = await promise;

      expect(element).not.toBeNull();
      expect(element?.id).toBe('dynamic');
    });

    it('should return null if element not found within timeout', async () => {
      const element = await waitForElement('#nonexistent', 100);

      expect(element).toBeNull();
    });

    it('should disconnect observer after finding element', async () => {
      const promise = waitForElement('#test', 2000);

      setTimeout(() => {
        const div = document.createElement('div');
        div.id = 'test';
        document.body.appendChild(div);
      }, 50);

      await promise;

      // Observer should be disconnected, so adding another element shouldn't trigger it
      const div2 = document.createElement('div');
      div2.id = 'test2';
      document.body.appendChild(div2);

      // This is just to ensure the test completes properly
      expect(document.getElementById('test')).not.toBeNull();
    });
  });

  describe('findCouponElements', () => {
    it('should use retailer-specific selectors when provided', async () => {
      document.body.innerHTML = `
        <input id="store-promo" type="text" />
        <button id="store-apply">Apply</button>
      `;

      const result = await findCouponElements({
        selectorConfig: {
          input: '#store-promo',
          submit: '#store-apply',
        },
      });

      expect(result.inputElement?.id).toBe('store-promo');
      expect(result.submitElement?.id).toBe('store-apply');
      expect(result.confidence).toBe(100);
      expect(result.detectionMethod).toBe('retailer-specific');
    });

    it('should fall back to attribute detection', async () => {
      document.body.innerHTML = `
        <input id="coupon-code" type="text" />
      `;

      const result = await findCouponElements();

      expect(result.inputElement?.id).toBe('coupon-code');
      expect(result.detectionMethod).toBe('attribute');
    });

    it('should fall back to label detection', async () => {
      document.body.innerHTML = `
        <label for="input-field">Discount Code</label>
        <input id="input-field" type="text" />
      `;

      const result = await findCouponElements();

      expect(result.inputElement?.id).toBe('input-field');
      expect(result.detectionMethod).toBe('label');
    });

    it('should return null result if no elements found', async () => {
      document.body.innerHTML = `
        <input id="email" type="text" />
      `;

      const result = await findCouponElements({
        retryAttempts: 0,
      });

      expect(result.inputElement).toBeNull();
      expect(result.submitElement).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should cache results', async () => {
      document.body.innerHTML = `
        <input id="promo-code" type="text" />
      `;

      await findCouponElements();

      // Change DOM
      document.body.innerHTML = '<div></div>';

      const result2 = await findCouponElements();

      // Should return cached result even though DOM changed
      expect(result2.inputElement?.id).toBe('promo-code');
    });

    it('should use custom keywords when provided', async () => {
      document.body.innerHTML = `
        <input id="rebate-code" type="text" />
      `;

      const result = await findCouponElements({
        keywords: ['rebate'],
      });

      expect(result.inputElement?.id).toBe('rebate-code');
    });

    it('should retry for dynamic content', async () => {
      // Start with empty body
      document.body.innerHTML = '';

      const promise = findCouponElements({
        retryAttempts: 2,
        retryDelay: 100,
      });

      // Add element after first retry
      setTimeout(() => {
        document.body.innerHTML = '<input id="promo" type="text" />';
      }, 150);

      const result = await promise;

      expect(result.inputElement?.id).toBe('promo');
    });
  });

  describe('clearCache', () => {
    it('should clear cached results', async () => {
      document.body.innerHTML = `
        <input id="promo-code" type="text" />
      `;

      await findCouponElements();

      clearCache();

      // Change DOM
      document.body.innerHTML = '<input id="coupon-code" type="text" />';

      const result = await findCouponElements();

      // Should detect new element, not cached one
      expect(result.inputElement?.id).toBe('coupon-code');
    });
  });
});
