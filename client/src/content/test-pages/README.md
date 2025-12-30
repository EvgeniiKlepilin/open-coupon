# Integration Test Pages for Auto-Apply Functionality

This directory contains HTML test pages for manually testing the coupon auto-apply feature.

## Test Pages

### 1. test-shopify-checkout.html
**Purpose:** Tests standard Shopify-style checkout with price in `.total-line__price`

**Valid Coupons:**
- `SAVE10` - $10.00 discount
- `SAVE20` - $20.00 discount
- `SAVE30` - $30.00 discount
- `HALFOFF` - $50.00 discount

**Features:**
- Standard coupon input with submit button
- Price updates after 1 second delay
- Success/error messages displayed
- Discount line item added to order summary

**Base Price:** $110.00

---

### 2. test-woocommerce-checkout.html
**Purpose:** Tests WooCommerce-style checkout with price in `.order-total .amount`

**Valid Coupons:**
- `WOO10` - $20.00 discount (10% off)
- `WOO20` - $40.00 discount (20% off)
- `FREESHIP` - $15.00 discount (free shipping)
- `MEGA50` - $100.00 discount (50% off)

**Features:**
- WooCommerce-specific HTML structure
- Success message: "Coupon code applied successfully."
- Error message: "Coupon 'CODE' does not exist!"
- 800ms processing delay

**Base Price:** $215.00

---

### 3. test-dynamic-price.html
**Purpose:** Tests dynamic price updates with AJAX-style delays

**Valid Coupons:**
- `ASYNC10` - $15.00 discount
- `ASYNC20` - $30.00 discount
- `ASYNC50` - $75.00 discount
- `DELUXE` - $100.00 discount

**Features:**
- 2-second delay for price updates (tests MutationObserver)
- Loading spinner during processing
- Dynamic discount row addition
- Price change animation

**Base Price:** $162.00

**Special:** This page is designed to test the applier's ability to wait for and detect asynchronous price changes using MutationObserver.

---

### 4. test-success-message.html
**Purpose:** Tests success message detection when price updates are delayed or minimal

**Valid Coupons:**
- `GIFT25` - $25.00 discount
- `GIFT50` - $50.00 discount
- `GIFT100` - $100.00 discount
- `VIPFREE` - $250.00 discount (100% off!)

**Features:**
- Success message appears immediately (before price update)
- Price updates 1 second after success message
- Green success alert with checkmark
- Tests detection of success indicators independent of price changes

**Base Price:** $270.00

**Special:** This page tests the `detectSuccessIndicators()` function by showing success messages before price changes occur.

---

### 5. test-error-message.html
**Purpose:** Tests error message detection and failure handling

**Valid Coupons (won't trigger errors):**
- `VALID10` - $18.00 discount (10% off)
- `VALID20` - $36.00 discount (20% off)

**Invalid Coupons (trigger specific errors):**
- `SUMMER2023`, `FALL2023`, `OLDCODE`, `EXPIRED` → "This coupon has expired"
- Any other code → "Coupon code is not valid"
- Empty input → "Please enter a discount code"

**Features:**
- Red error messages with warning icon
- Input field shaking animation on error
- Error border styling
- Tests `detectSuccessIndicators()` failure detection

**Base Price:** $207.36

**Special:** This page tests the applier's ability to detect and handle various error messages and failure scenarios.

---

## How to Use These Test Pages

### Manual Testing
1. Open any test HTML file in your browser
2. Open browser DevTools console to see detection logs
3. Load the OpenCoupon extension in your browser
4. Navigate to the test page
5. Open the extension popup
6. Click "Auto-Apply Coupons" to test the functionality

### Automated E2E Testing (Future)
These pages can be used with Playwright or Puppeteer for automated end-to-end testing:

```javascript
// Example Playwright test
test('should detect and apply best coupon on Shopify page', async ({ page }) => {
  await page.goto('file:///path/to/test-shopify-checkout.html');

  // Trigger auto-apply
  await page.evaluate(() => {
    // Call auto-apply function from content script
  });

  // Verify best coupon applied
  const total = await page.textContent('#grand-total');
  expect(total).toBe('$60.00'); // After HALFOFF ($50 discount)
});
```

---

## Testing Checklist

When testing the auto-apply functionality, verify:

- [ ] **Price Detection**
  - ✅ Detects baseline price correctly
  - ✅ Detects price changes after coupon application
  - ✅ Handles hidden/invisible price elements
  - ✅ Works with different currency formats

- [ ] **Coupon Application**
  - ✅ Clears input field before applying new code
  - ✅ Sets input value correctly
  - ✅ Dispatches required events (input, change, keyup)
  - ✅ Clicks submit button
  - ✅ Handles disabled buttons

- [ ] **Success/Failure Detection**
  - ✅ Detects price decreases
  - ✅ Detects success messages in DOM
  - ✅ Detects error messages in DOM
  - ✅ Handles timeouts gracefully
  - ✅ Distinguishes between success and failure

- [ ] **Best Coupon Selection**
  - ✅ Tests all coupons sequentially
  - ✅ Tracks discount amounts
  - ✅ Identifies best coupon (highest discount)
  - ✅ Re-applies best coupon at end

- [ ] **User Experience**
  - ✅ Shows progress indicator
  - ✅ Displays current coupon being tested
  - ✅ Updates best discount found
  - ✅ Allows cancellation
  - ✅ Shows final result notification

- [ ] **Performance & Safety**
  - ✅ Uses random delays (2-4 seconds)
  - ✅ Respects max attempts limit
  - ✅ Stops on rate limiting detection
  - ✅ Disconnects MutationObservers
  - ✅ Handles errors gracefully

---

## Common Issues & Debugging

### Issue: Price not detected
**Check:**
- Console logs for price detection attempts
- Verify price element is visible (not `display: none`)
- Check if price selectors match page structure

### Issue: Coupon not applying
**Check:**
- Console logs for event dispatching
- Verify input element is correct
- Check if submit button is clickable
- Look for JavaScript errors

### Issue: Timeout on every coupon
**Check:**
- Verify MutationObserver is detecting changes
- Check timeout value (default 5 seconds)
- Look for price change delays longer than timeout
- Verify success/failure message detection

### Issue: Wrong coupon selected as best
**Check:**
- Console logs for discount calculations
- Verify price normalization is correct
- Check if all coupons were tested
- Verify sorting by successCount

---

## Future Enhancements

1. **Additional Test Pages:**
   - Amazon-style hidden coupon field
   - Multi-step checkout process
   - React/Vue SPA with virtual DOM
   - Mobile-responsive checkout

2. **Test Automation:**
   - Playwright E2E test suite
   - Visual regression testing
   - Performance benchmarks
   - Cross-browser compatibility tests

3. **Edge Cases:**
   - Multiple coupon inputs on same page
   - Coupon + gift card combination
   - Minimum purchase requirements
   - Expired but still valid coupons
