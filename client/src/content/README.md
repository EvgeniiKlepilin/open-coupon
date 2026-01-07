# Content Scripts - Coupon Field Detector

This module implements intelligent detection of coupon/promo code input fields on e-commerce checkout pages.

## Overview

The detector uses multiple strategies to find coupon input fields and their associated submit buttons across various e-commerce platforms. It supports both static and dynamically loaded content.

## Files

- **`detector.ts`** - Main detection module with all detection strategies
- **`detector.test.ts`** - Comprehensive unit tests (45 test cases)

## Features

### Detection Strategies

The detector tries multiple approaches in priority order:

1. **Retailer-Specific Selectors** (Confidence: 100)
   - Uses custom CSS selectors from backend `selectorConfig`
   - Highest priority for known retailers
   - Example: `{ input: '#promo-input', submit: '#apply-btn' }`

2. **Attribute-Based Detection** (Confidence: 70-90)
   - Searches input attributes for keywords
   - Checks: `id`, `name`, `placeholder`, `aria-label`, `class`, `data-*`
   - Keywords: coupon, promo, promotional, discount, voucher, code, gift
   - Case-insensitive matching
   - Prefers inputs with multiple keyword matches

3. **Label-Based Detection** (Confidence: 60)
   - Finds `<label>` elements with relevant text
   - Traces to associated input via:
     - `for` attribute
     - Nested inputs within label
     - Next sibling inputs
   - Useful when inputs lack descriptive attributes

4. **Heuristic Detection** (Confidence: 30-40)
   - Fallback method for edge cases
   - Returns null if confidence < 30 to avoid false positives

### Dynamic Content Handling

- **MutationObserver** watches for lazy-loaded coupon fields
- Retry logic with configurable attempts and delay
- Default: 3 retries with 1000ms delay
- 10-second timeout for dynamic content

### Confidence Scoring

Each detection includes a confidence score (0-100):

- 100: Retailer-specific selector match
- 80-90: Attribute match (90 for multiple keywords)
- 60: Label-based match
- 30-40: Heuristic fallback
- 0: No match or invalid element

### Validation & Filtering

Elements must pass validation to be considered:

- ✅ Visible (not `display: none`, `visibility: hidden`, `opacity: 0`)
- ✅ Not disabled
- ✅ Keyboard accessible (`tabindex !== "-1"`)
- ✅ Proper input type (text, search, or no type)

### Caching

- Results cached for 60 seconds (1 minute TTL)
- Avoids redundant DOM scans
- `clearCache()` available for manual invalidation

## API Reference

### `findCouponElements(options?: DetectorOptions): Promise<DetectionResult>`

Main detection function that tries all strategies.

**Options:**

```typescript
interface DetectorOptions {
  selectorConfig?: SelectorConfig; // Retailer-specific selectors
  keywords?: string[]; // Custom keywords (default: DEFAULT_KEYWORDS)
  retryAttempts?: number; // Retry attempts (default: 3)
  retryDelay?: number; // Delay between retries in ms (default: 1000)
}
```

**Returns:**

```typescript
interface DetectionResult {
  inputElement: HTMLInputElement | null;
  submitElement: HTMLElement | null;
  confidence: number; // 0-100
  detectionMethod: 'retailer-specific' | 'attribute' | 'label' | 'heuristic';
  containerElement?: HTMLElement; // Parent form or container
}
```

**Example:**

```typescript
const result = await findCouponElements({
  selectorConfig: {
    input: '#discount-code',
    submit: '#apply-discount',
  },
  retryAttempts: 5,
  retryDelay: 500,
});

if (result.confidence >= 60) {
  console.log('Found coupon field:', result.inputElement);
  console.log('Submit button:', result.submitElement);
}
```

### `findByRetailerConfig(config: SelectorConfig): DetectionResult | null`

Find elements using retailer-specific CSS selectors.

**Example:**

```typescript
const result = findByRetailerConfig({
  input: '#promo-code',
  submit: 'button[data-testid="apply-promo"]',
  container: '.checkout-sidebar',
});
```

### `findByAttributes(keywords: string[]): DetectionResult | null`

Find elements by searching attributes for keywords.

**Example:**

```typescript
const result = findByAttributes(['coupon', 'promo', 'discount']);
```

### `findByLabel(keywords: string[]): DetectionResult | null`

Find elements by searching label text for keywords.

**Example:**

```typescript
const result = findByLabel(['gift card', 'voucher']);
```

### `findSubmitButton(inputElement: HTMLInputElement): HTMLElement | null`

Find the submit button associated with an input element.

Searches for:

- `<button type="submit">` in same form
- Buttons with text: "apply", "submit", "use"
- `<input type="submit">` in same form
- Nearby buttons in parent container

### `calculateConfidence(element: HTMLElement, method: DetectionMethod): number`

Calculate confidence score for a detected element.

### `waitForElement(selector: string, timeout: number): Promise<HTMLElement | null>`

Wait for an element to appear in the DOM using MutationObserver.

**Example:**

```typescript
const element = await waitForElement('#dynamic-promo', 5000);
if (element) {
  console.log('Element appeared:', element);
}
```

### `clearCache(): void`

Clear the detection cache to force re-detection.

## Usage Examples

### Basic Detection

```typescript
import { findCouponElements } from './detector';

// Simple detection with defaults
const result = await findCouponElements();

if (result.inputElement) {
  result.inputElement.value = 'SAVE20';
  result.submitElement?.click();
}
```

### With Retailer-Specific Config

```typescript
// Get retailer config from API
const retailerConfig = {
  input: '#coupon-input',
  submit: 'button.apply-coupon',
};

const result = await findCouponElements({
  selectorConfig: retailerConfig,
});

console.log('Detection method:', result.detectionMethod); // 'retailer-specific'
console.log('Confidence:', result.confidence); // 100
```

### With Custom Keywords

```typescript
// Detect gift card field
const result = await findCouponElements({
  keywords: ['gift', 'card', 'certificate'],
});
```

### Handling Dynamic Content

```typescript
// For SPAs with lazy-loaded checkout sections
const result = await findCouponElements({
  retryAttempts: 5,
  retryDelay: 2000, // 2 seconds between retries
});

if (result.confidence > 0) {
  console.log('Found after', result.detectionMethod, 'detection');
}
```

## Testing

### Run Tests

```bash
npm test -- detector.test.ts
```

### Test Coverage

- 45 unit tests covering all detection strategies
- Tests for visibility checking, caching, dynamic content
- jsdom-compatible test environment

### Integration Test HTML Files

Located in `src/test/fixtures/`:

1. **`test-simple-form.html`** - Basic form with standard promo field
2. **`test-amazon-style.html`** - Hidden field revealed by toggle link
3. **`test-dynamic-load.html`** - Lazy-loaded coupon section (3s delay)
4. **`test-no-coupon.html`** - Page without coupon fields (false positive test)

See `src/test/fixtures/README.md` for details on using these test pages.

## Performance Considerations

- **Caching**: Results cached for 60s to avoid redundant scans
- **Early Exit**: Stops at first high-confidence match (≥30)
- **Efficient Selectors**: Uses specific queries, not broad DOM scans
- **Debouncing**: MutationObserver uses 300ms debounce (implementation detail)

## Browser Compatibility

- ✅ Chrome/Edge (Manifest V3)
- ✅ Firefox (with polyfills)
- ✅ Safari (with polyfills)

Requires:

- `MutationObserver` API (all modern browsers)
- `querySelectorAll` (all modern browsers)
- `getComputedStyle` (all modern browsers)

## Future Enhancements

Potential improvements for future iterations:

1. **Machine Learning**: Train model on labeled checkout pages
2. **Visual Detection**: Use element positioning and styling
3. **Multi-language Support**: Keyword translations
4. **A/B Test Detection**: Handle variant checkout flows
5. **Shadow DOM Support**: Detect fields in web components
6. **Analytics**: Track detection success rates per retailer

## Contributing

When adding new detection strategies:

1. Add the strategy method to `detector.ts`
2. Update confidence scoring in `calculateConfidence()`
3. Add unit tests in `detector.test.ts`
4. Update this README with examples
5. Create test HTML fixture if needed

## License

Part of the OpenCoupon project. See root LICENSE file.
