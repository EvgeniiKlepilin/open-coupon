# Integration Test HTML Fixtures

This directory contains HTML test pages for testing the coupon field detector in real-world scenarios.

## Test Files

### 1. `test-simple-form.html`

**Purpose:** Test basic coupon field detection with a standard form.

**Features:**

- Simple form with `id="promo-code"` input field
- Clear submit button with "Apply Code" text
- Standard HTML structure

**Expected Detection:**

- Method: `attribute`
- Confidence: 70-90
- Should find input by `id` attribute containing "promo"

---

### 2. `test-amazon-style.html`

**Purpose:** Test detection of hidden coupon fields that appear when user clicks a toggle link.

**Features:**

- Hidden promo code section (similar to Amazon's checkout)
- Toggle link to reveal the coupon field
- Input field with `aria-label="Gift card or promo code"`
- Mock discount codes: `SAVE10`, `SAVE20`, `FREESHIP`

**Expected Detection:**

- Method: `attribute` or `label`
- Confidence: 60-80
- Should detect field only after it becomes visible
- Tests visibility checking logic

---

### 3. `test-dynamic-load.html`

**Purpose:** Test detection of dynamically loaded coupon fields (lazy loading simulation).

**Features:**

- Initial page loads with basic checkout fields
- Discount code section loads after 3 seconds (1s initial + 2s promo)
- Input has `data-coupon-field="true"` attribute
- Simulates real SPA/AJAX loading behavior

**Expected Detection:**

- Method: `attribute`
- Confidence: 70-90
- Should detect field after dynamic load
- Tests MutationObserver and retry logic

**Note:** Wait at least 3 seconds after page load before testing detection.

---

### 4. `test-no-coupon.html`

**Purpose:** Test that detector doesn't produce false positives on pages without coupon fields.

**Features:**

- Complete checkout form with billing information
- Email, phone, card number, address fields
- No coupon/promo/discount related fields

**Expected Detection:**

- Should return `null` result
- Confidence: 0
- No false positives (shouldn't mistake "card-number" for "code", etc.)

---

## How to Use These Test Files

### Manual Testing in Browser

1. **Load the extension:**

   ```bash
   cd client
   npm run build
   ```

   Then load `dist/` folder in Chrome at `chrome://extensions`

2. **Open test HTML files:**
   - Open any test file in Chrome
   - Click the extension icon to trigger detection
   - Check browser console for detection logs

### Automated E2E Testing

To create automated tests using these fixtures:

```typescript
import { chromium } from 'playwright';

describe('Coupon Detector E2E', () => {
  it('should detect simple form', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto('file://' + __dirname + '/test-simple-form.html');

    // Inject content script and test detection
    const result = await page.evaluate(() => {
      // Your detection logic here
    });

    expect(result.inputElement).toBeTruthy();
    expect(result.confidence).toBeGreaterThan(60);

    await browser.close();
  });
});
```

### Testing Dynamic Load

For `test-dynamic-load.html`:

```typescript
it('should detect dynamically loaded field', async () => {
  await page.goto('file://' + __dirname + '/test-dynamic-load.html');

  // Wait for dynamic content (3 seconds)
  await page.waitForTimeout(3000);

  const result = await page.evaluate(() => {
    return findCouponElements();
  });

  expect(result.inputElement?.id).toBe('discount-code');
});
```

## Validation Checklist

When testing the detector with these fixtures, verify:

- ✅ **Attribute detection** works on all files except `test-no-coupon.html`
- ✅ **Visibility checking** prevents detection of hidden fields in `test-amazon-style.html`
- ✅ **MutationObserver** detects dynamically added fields in `test-dynamic-load.html`
- ✅ **False positive prevention** returns null on `test-no-coupon.html`
- ✅ **Submit button** detection works on all applicable pages
- ✅ **Confidence scoring** is appropriate for each detection method
- ✅ **Caching** works across repeated detections

## Adding New Test Cases

To add a new test fixture:

1. Create a new HTML file following the naming pattern `test-{scenario}.html`
2. Include realistic HTML structure from actual e-commerce sites
3. Add inline styles and JavaScript for interactivity
4. Document expected detection results in this README
5. Add corresponding unit/integration test cases

## Common Issues

**Issue:** Detector finds field in `test-no-coupon.html`

- **Cause:** Keywords too broad or insufficient validation
- **Fix:** Review keyword list and element validation logic

**Issue:** Dynamic load test fails

- **Cause:** MutationObserver not properly configured or timeout too short
- **Fix:** Check observer setup and increase retry attempts/delay

**Issue:** Amazon-style test detects hidden field

- **Cause:** Visibility checking not working
- **Fix:** Verify `isElementVisible()` checks all CSS properties correctly
