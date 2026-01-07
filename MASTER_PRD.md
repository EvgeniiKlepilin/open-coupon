This Master Product Requirement Document (PRD) is designed to guide an AI coding agent (like Claude Code or Gemini CLI) through the creation of an open-source coupon extension framework.

The project is architected as a **Monorepo** containing two main services: `extension-client` and `backend-api`.

---

# 📂 Master PRD: Open Source Coupon Extension Framework

**Project Name:** OpenCoupon (Placeholder)
**Vision:** A modular, open-source framework for building browser extensions that automatically find and apply coupon codes.
**Tech Stack:**

- **Frontend:** React (Vite) + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express.js + TypeScript
- **Database:** PostgreSQL (managed via Prisma ORM)
- **Infrastructure:** Docker Compose (for local dev of DB + API)

## 🛠️ Global Development Standards (System Prompt for AI)

_Before starting any task, ingest these standards:_

1. **Strict TypeScript:** `noImplicitAny` must be true. Interfaces for all API responses. Shared types between BE and FE in a `shared/types` folder if possible.
2. **Testing:** Jest for unit tests. Supertest for API integration. React Testing Library for frontend.
3. **Documentation:** JSDoc for all exported functions. Swagger/OpenAPI for backend routes.
4. **Error Handling:** Centralized error handling middleware in Express. Error boundaries in React.

---

## 🛣️ Project Roadmap

1. **Phase 1: Infrastructure & Scaffolding** (Setup Monorepo, Docker, CI/CD)
2. **Phase 2: Backend Core** (Coupon CRUD, Domain Management, API Logic)
3. **Phase 3: Extension Client - UI** (Popup, Settings, Login)
4. **Phase 4: Extension Client - Injection Engine** (The "Honey" Logic: DOM detection, Injection, Auto-apply)

---

# 📑 Feature PRD 1: Infrastructure & Scaffolding

**Goal:** Initialize the repo, set up Docker Compose for PostgreSQL, and create the basic folder structure.

### Story 1.1: Monorepo Initialization

- **Description:** Initialize a root directory with two distinct packages: `client` (Vite+React+TS) and `server` (Node+Express+TS). Setup ESLint and Prettier at the root.
- **AI Instructions:**
  - Create root folder `opencoupon`.
  - Initialize `client` using `npm create vite@latest client -- --template react-ts`.
  - Initialize `server` with `npm init -y` and install `typescript`, `ts-node`, `nodemon`, `express`. Generate `tsconfig.json` for server with `outDir: ./dist` and `rootDir: ./src`.
  - Create a `docker-compose.yml` at root.
- **Acceptance Criteria:**
  - `npm run dev` in client starts Vite server.
  - `npm run dev` in server starts Express server.
- **Testing:** Verify directory structure.

### Story 1.2: Docker Database Setup

- **Description:** Configure Docker Compose to spin up a PostgreSQL container and a pgAdmin container for management.
- **AI Instructions:**
  - Edit `docker-compose.yml`.
  - Service 1: `postgres` (Image: `postgres:15-alpine`). Map port `5432:5432`. Set env vars for user/pass.
  - Service 2: `pgadmin` (Image: `dpage/pgadmin4`). Map port `5050:80`.
  - Define a named volume `postgres_data` for persistence.
- **Acceptance Criteria:**
  - `docker compose up -d` successfully starts DB.
  - Connection to `localhost:5432` is successful using defined credentials.

---

# 📑 Feature PRD 2: Backend Core (Coupons & API)

**Goal:** Create the REST API to serve coupon data to the extension.

### Story 2.1: Database Schema (Prisma)

- **Description:** Define data models for `Retailer` and `Coupon` with enhanced fields for smart coupon management.
- **AI Instructions:**
  - Install `prisma` and `@prisma/client` in `server`. Initialize with `npx prisma init`.
  - Define Model `Retailer`:
    - `id` (UUID, primary key)
    - `domain` (String, unique, indexed)
    - `name` (String)
    - `logoUrl` (String?, optional) - For displaying in Extension Popup
    - `homeUrl` (String?, optional) - Direct link to the store
    - `isActive` (Boolean, default: true) - Active status flag
    - `selectorConfig` (Json?, optional) - Smart DOM metadata for CSS selectors (e.g., `{ "input": "#promo-code", "submit": ".btn-apply" }`)
    - `createdAt` (DateTime, default: now())
    - `updatedAt` (DateTime, auto-updated)
    - Relation: One-to-many with `Coupon`
  - Define Model `Coupon`:
    - `id` (UUID, primary key)
    - `code` (String)
    - `description` (String)
    - `successCount` (Int, default: 0)
    - `failureCount` (Int, default: 0)
    - `lastSuccessAt` (DateTime?, optional) - Helps prioritize "fresh" coupons
    - `lastTestedAt` (DateTime?, optional) - Helps prune "stale" coupons
    - `expiryDate` (DateTime?, optional) - If the source provided an expiry
    - `source` (String?, optional) - e.g., "user-submission", "scraper-v1", "admin"
    - `createdAt` (DateTime, default: now())
    - `updatedAt` (DateTime, auto-updated)
    - `retailerId` (UUID, foreign key to Retailer with CASCADE delete)
    - Unique constraint: `@@unique([retailerId, code])` - Prevents duplicate coupons per retailer
    - Index: `@@index([retailerId])`
  - Run migrations: `npx prisma migrate dev --name init` and `npx prisma migrate dev --name add_enhanced_fields`.
  - Generate Prisma Client: `npx prisma generate`.
- **Acceptance Criteria:**
  - `schema.prisma` file exists and is valid.
  - Tables created in Docker Postgres instance with all enhanced fields.
  - Unique constraint ensures no duplicate coupon codes per retailer.
  - Prisma Client generated with updated types.

### Story 2.2: Coupon Lookup Endpoint

- **Description:** Create a GET endpoint that accepts a domain URL and returns valid coupons.
- **AI Instructions:**
  - Create route `GET /api/v1/coupons`.
  - Input: Query param `?domain=example.com`.
  - Logic: Extract hostname. Query `Retailer` table by domain. Return associated `Coupon` list ordered by `successCount` DESC. Use `lastSuccessAt` to prioritize fresh coupons.
  - Response Type: `JSON { data: Coupon[] }`.
  - Error Handling: Return 404 if retailer not found.
- **Testing:**
  - Unit Test: Mock Prisma response, verify controller logic.
  - Integration Test: Seed DB with 3 random non-existent retailer data and 10 coupons each, hit endpoint, verify JSON response.

---

# 📑 Feature PRD 3: Extension Client - UI (The Popup)

**Goal:** The user interface users see when clicking the extension icon.

### Story 3.1: Manifest V3 Configuration

- **Description:** Initialize the extension client using CRXJS framework.
- **Implementation:**
  - Extension initialized with `npx create-crxjs` command.
  - Uses `@crxjs/vite-plugin` for building Manifest V3 extensions with Vite.
  - Project structure created:
    - `manifest.config.ts` - Dynamic manifest configuration using `defineManifest`.
    - `src/popup/` - Popup UI entry point (index.html + main.tsx + App.tsx).
    - `src/sidepanel/` - Side panel UI entry point (index.html + main.tsx + App.tsx).
    - `src/content/` - Content scripts entry point (main.tsx).
    - `src/components/` - Shared React components.
    - `public/` - Static assets (logo.png).
  - Build configuration:
    - `vite.config.ts` includes crx plugin and zip packaging plugin.
    - TypeScript with strict mode and Chrome types (`@types/chrome`).
    - Path aliases configured (`@/*` -> `src/*`).
    - React 19 with TypeScript 5.8.
  - Current manifest configuration:
    - `manifest_version: 3`
    - Permissions: `sidePanel`, `contentSettings`
    - Content scripts: Matches `https://*/*`
    - Action: default_popup at `src/popup/index.html`
    - Side panel: default_path at `src/sidepanel/index.html`
- **Next Steps:**
  - Update manifest permissions to include `activeTab`, `storage`, `scripting` for coupon functionality.
  - Add host permissions for API endpoint access.
- **Acceptance Criteria:**
  - ✅ `npm run dev` starts development server.
  - ✅ `npm run build` generates dist folder loadable in Chrome `chrome://extensions`.
  - ✅ Extension includes popup, sidepanel, and content script entry points.

### Story 3.2: Popup UI - Coupon List

- **Description:** Build a React-based popup interface that fetches and displays available coupons for the current tab's domain.
- **Implementation Requirements:**
  - **Active Tab Detection:**
    - Use `chrome.tabs.query({ active: true, currentWindow: true })` to get current tab URL.
    - Extract hostname from the URL for API queries.
    - Handle edge cases: new tab, chrome:// URLs, local files.
  - **API Integration:**
    - Endpoint: `http://localhost:3030/api/v1/coupons?domain={hostname}`
    - Use `fetch` with proper error handling and timeout.
    - Implement retry logic for failed requests (max 3 attempts).
  - **TypeScript Interfaces:**
    - Define `Coupon` interface matching backend schema:
      ```typescript
      interface Coupon {
        id: string;
        code: string;
        description: string;
        successCount: number;
        failureCount: number;
        lastSuccessAt?: string;
        expiryDate?: string;
      }
      ```
    - Define `Retailer` interface for retailer information.
  - **Component Architecture:**
    - `CouponList` - Main container component in `src/popup/components/CouponList.tsx`.
    - `CouponCard` - Individual coupon card component:
      - Display: Coupon code (prominent), description, success rate percentage.
      - Actions: "Copy Code" button (copies to clipboard with visual feedback).
      - Visual indicators: Success rate badge (green for >50%, yellow for 25-50%, red for <25%).
      - Expiry warning: Show warning icon if expiry date is within 7 days.
    - `EmptyState` - Display when no coupons are available for the domain.
    - `ErrorState` - Display when API request fails.
  - **State Management:**
    - Loading state: Show skeleton loaders while fetching.
    - Error state: Display user-friendly error messages with retry button.
    - Empty state: Show message "No coupons available for this site" with option to contribute.
    - Success state: Display sorted coupon list (by successCount DESC, then lastSuccessAt).
  - **Styling:**
    - Install and configure Tailwind CSS if not already present.
    - Responsive design: Min-width 320px, max-width 400px for popup.
    - Clean card layout with proper spacing and hover effects.
    - Accessible color contrast (WCAG AA compliant).
  - **User Experience:**
    - Copy to clipboard: Use `navigator.clipboard.writeText()` with fallback.
    - Show toast notification: "Code copied!" with auto-dismiss after 2s.
    - Keyboard navigation: Ensure all interactive elements are keyboard accessible.
    - Loading animation: Smooth skeleton loaders, avoid jarring transitions.
  - **Performance:**
    - Cache coupon data in `chrome.storage.local` for 5 minutes to reduce API calls.
    - Debounce tab change events to avoid excessive API requests.
- **Acceptance Criteria:**
  - ✅ Popup opens and displays loading state immediately.
  - ✅ Fetches coupons for the current tab's domain.
  - ✅ Displays coupons sorted by success rate (highest first).
  - ✅ "Copy Code" button successfully copies coupon code to clipboard.
  - ✅ Shows appropriate messages for empty states and errors.
  - ✅ Handles network failures gracefully with retry option.
  - ✅ Caches results for 5 minutes to improve performance.
  - ✅ All interactive elements are keyboard accessible.
- **Testing:**
  - **Unit Tests (Jest + React Testing Library):**
    - Mock `chrome.tabs.query` to return test tab data.
    - Mock `fetch` to return test coupon data.
    - Test loading state renders skeleton loaders.
    - Test successful data fetch renders correct number of CouponCard components.
    - Test empty state renders EmptyState component.
    - Test error state renders ErrorState with retry button.
    - Test copy button calls `navigator.clipboard.writeText` with correct code.
    - Test success rate badge colors based on success percentage.
  - **Integration Tests:**
    - Test full flow: popup open → fetch → render → copy.
    - Test cache mechanism: second fetch within 5 minutes uses cached data.
    - Test retry logic on failed API calls.

---

# 📑 Feature PRD 4: The Injection Engine (The "Honey" Logic)

**Goal:** Inject code into the retailer's checkout page to detect input fields and apply coupons.

### Story 4.1: Input Field Detection (Heuristics)

- **Description:** A content script that intelligently scans the DOM to find coupon/promo code input fields and their associated submit buttons using multiple detection strategies.
- **Implementation Requirements:**
  - **Detection Strategies:**
    - **Attribute-based detection:**
      - Search keywords: `['coupon', 'promo', 'promotional', 'discount', 'voucher', 'code', 'gift']`
      - Check attributes: `id`, `name`, `placeholder`, `aria-label`, `data-*`, `class`
      - Case-insensitive matching with word boundary detection
    - **Label-based detection:**
      - Find `<label>` elements with relevant text, trace to associated input via `for` attribute or DOM hierarchy
      - Check label text for keywords even if input lacks descriptive attributes
    - **Input type detection:**
      - Primary: `input[type="text"]`
      - Secondary: `input[type="search"]`, `input[type="email"]` (some sites use non-standard types)
      - Fallback: `input:not([type])` (inputs without explicit type)
    - **Button/Link detection:**
      - Find "Apply", "Submit", "Use Code" buttons near detected inputs
      - Check for `<button>`, `<input type="submit">`, `<a>` with click handlers
      - Use spatial proximity (within same container/form) and visual hierarchy
    - **Retailer-specific selectors:**
      - Support for `selectorConfig` from backend (Story 2.1)
      - Prioritize retailer-specific CSS selectors when available
      - Fallback to heuristics if specific selectors fail
  - **TypeScript Interfaces:**

    ```typescript
    interface DetectionResult {
      inputElement: HTMLInputElement | null;
      submitElement: HTMLElement | null;
      confidence: number; // 0-100 score based on detection method
      detectionMethod: 'retailer-specific' | 'attribute' | 'label' | 'heuristic';
      containerElement?: HTMLElement; // Parent form or container
    }

    interface SelectorConfig {
      input?: string; // CSS selector for input field
      submit?: string; // CSS selector for submit button
      container?: string; // Optional parent container
    }

    interface DetectorOptions {
      selectorConfig?: SelectorConfig;
      keywords?: string[]; // Custom keywords to search for
      retryAttempts?: number; // Number of retry attempts for dynamic content
      retryDelay?: number; // Delay between retries in ms
    }
    ```

  - **Module Architecture:**
    - `client/src/content/detector.ts` - Main detection module
    - `findCouponElements(options?: DetectorOptions): Promise<DetectionResult>` - Primary detection function
    - `findByRetailerConfig(config: SelectorConfig): DetectionResult | null` - Retailer-specific detection
    - `findByAttributes(keywords: string[]): DetectionResult | null` - Attribute-based detection
    - `findByLabel(keywords: string[]): DetectionResult | null` - Label-based detection
    - `findSubmitButton(inputElement: HTMLInputElement): HTMLElement | null` - Button detection
    - `calculateConfidence(element: HTMLElement, method: string): number` - Confidence scoring
    - `waitForElement(selector: string, timeout: number): Promise<HTMLElement | null>` - Dynamic content handling
  - **Dynamic Content Handling:**
    - Implement `MutationObserver` to detect lazy-loaded coupon fields
    - Watch for changes in subtree with `{ childList: true, subtree: true }`
    - Debounce observer callbacks to avoid excessive re-detection (300ms delay)
    - Set timeout for observation (default: 10 seconds)
    - Disconnect observer once element is found
  - **Confidence Scoring System:**
    - Retailer-specific selector match: 100 points
    - Multiple keyword matches: 80-90 points
    - Single keyword match with appropriate input type: 60-70 points
    - Label-based match: 50-60 points
    - Heuristic fallback: 30-40 points
    - Return null if confidence < 30 (avoid false positives)
  - **Error Handling:**
    - Handle missing elements gracefully (return null, not error)
    - Log detection attempts and results for debugging (use `console.debug`)
    - Catch and handle DOM exceptions (SecurityError, InvalidAccessError)
    - Validate element visibility and interactivity before returning
  - **Performance:**
    - Cache detection results for current page (avoid re-scanning on every call)
    - Use `querySelectorAll` efficiently (specific selectors, not broad scans)
    - Limit MutationObserver scope to relevant DOM sections when possible
    - Set maximum retry attempts (default: 3) to prevent infinite loops
    - Implement early exit when high-confidence match is found
  - **Accessibility Considerations:**
    - Respect ARIA attributes (`aria-label`, `aria-labelledby`, `aria-describedby`)
    - Ensure detected elements are keyboard accessible (`:not([tabindex="-1"])`)
    - Check element visibility (not `display: none` or `visibility: hidden`)

- **Acceptance Criteria:**
  - ✅ Correctly identifies coupon input on test pages with various HTML structures:
    - Standard: `<input id="promo-code" type="text">`
    - Label-based: `<label for="discount">Discount Code</label><input id="discount">`
    - Class-based: `<input class="coupon-input" type="text">`
    - Data attribute: `<input data-coupon-field="true">`
  - ✅ Finds associated submit button within same form/container
  - ✅ Returns confidence score (0-100) for each detection
  - ✅ Handles retailer-specific `selectorConfig` with highest priority
  - ✅ Detects dynamically loaded elements using MutationObserver
  - ✅ Returns null for pages without coupon fields (no false positives)
  - ✅ Completes detection within 10 seconds or returns best match found
  - ✅ Caches results to avoid redundant DOM scans
- **Testing:**
  - **Unit Tests (Jest + jsdom):**
    - Mock DOM with various coupon field structures (attribute-based, label-based, class-based)
    - Test `findByRetailerConfig` with valid and invalid selectors
    - Test `findByAttributes` with keyword matching (case-insensitive, partial match)
    - Test `findByLabel` with label text containing keywords
    - Test `findSubmitButton` finds correct button in same container
    - Test `calculateConfidence` returns appropriate scores for different methods
    - Test `waitForElement` with simulated dynamic content insertion
    - Test caching mechanism: second call returns cached result
    - Test null return for pages without matching elements
  - **Integration Tests (E2E with test HTML pages):**
    - Create test HTML files simulating real retailer checkout pages:
      - `test-amazon-style.html` - Hidden promo field revealed by link
      - `test-simple-form.html` - Standard input with submit button
      - `test-dynamic-load.html` - Field loaded after 2-second delay
      - `test-no-coupon.html` - Page without any coupon field
    - Load content script in test environment
    - Verify correct detection on each test page
    - Verify confidence scores match expected values
    - Verify MutationObserver detects dynamically added elements
    - Verify no false positives on pages without coupon fields

### Story 4.2: The "Auto-Apply" Loop

- **Description:** Automated logic to intelligently iterate through available coupons, apply them to the detected input field, and determine which coupon provides the best discount by monitoring price changes and success indicators.
- **Implementation Requirements:**
  - **Auto-Apply Flow:**
    - User initiates auto-apply from popup UI (button click)
    - Display progress modal/overlay on the page showing:
      - Current coupon being tested (e.g., "Testing SAVE20... (3/10)")
      - Progress bar with percentage completion
      - Best discount found so far
      - Cancel button for user interruption
    - Test coupons sequentially from highest to lowest confidence (based on `successCount`)
    - Respect rate limiting delays between attempts (configurable, default: 2-3 seconds)
    - Support cancellation at any point without breaking page functionality
  - **Price Detection Strategies:**
    - **Multi-strategy price detection:**
      - Primary: Look for common price selectors (`.total`, `.grand-total`, `[data-test="total"]`, etc.)
      - Secondary: Regex scan for currency patterns (`$XX.XX`, `€XX,XX`, `£XX.XX`)
      - Tertiary: Monitor for "discount applied" success messages
      - Fallback: Compare entire cart/checkout section HTML before/after
    - **Price normalization:**
      - Strip currency symbols and formatting (`$1,234.56` → `1234.56`)
      - Handle international formats (comma vs period decimal separators)
      - Store as numeric value for comparison
    - **Baseline price capture:**
      - Capture initial price before any coupon application
      - Use as reference for calculating discount amount
      - Detect if page already has a coupon applied (warn user)
  - **Coupon Application Logic:**
    - **Input field interaction:**
      - Clear existing value: `inputElement.value = ''`
      - Set new coupon code: `inputElement.value = coupon.code`
      - Dispatch required events for framework detection:
        - `new Event('input', { bubbles: true })` - For React
        - `new Event('change', { bubbles: true })` - For Vue/Angular
        - `new KeyboardEvent('keyup', { bubbles: true })` - For vanilla JS listeners
      - Optional: Trigger focus/blur events if needed
    - **Submit button interaction:**
      - Click submit button: `submitBtn.click()`
      - Alternative: Submit parent form if button click fails: `form.submit()`
      - Handle disabled buttons (wait for re-enable with timeout)
    - **Wait for response:**
      - Use `MutationObserver` to watch for price/cart section changes
      - Set timeout threshold: 5 seconds default, configurable up to 10 seconds
      - Detect success indicators:
        - Price decrease detected
        - Success message appears (e.g., "Coupon applied successfully")
        - Green checkmark or success icon
      - Detect failure indicators:
        - Error message appears (e.g., "Invalid coupon", "Expired")
        - Price unchanged after timeout
        - Input field shows error styling (red border, shake animation)
  - **Success/Failure Detection:**
    - **Success criteria (prioritized):**
      1. Price decreased from previous state
      2. Success message detected in DOM (keyword search: "applied", "success", "saved")
      3. Visual success indicator (green checkmark, success icon with aria-label)
      4. Discount line item added to order summary
    - **Failure criteria:**
      1. Error message detected (keywords: "invalid", "expired", "not valid", "incorrect")
      2. Price unchanged after timeout
      3. Coupon input cleared automatically by site
      4. Error styling applied to input field
    - **Ambiguous state handling:**
      - If neither success nor failure detected after timeout, mark as "uncertain"
      - Continue to next coupon but log the uncertain result
      - Don't report uncertain results to feedback API
  - **Result Tracking:**
    - Track each coupon attempt with:
      - Coupon code tested
      - Price before application
      - Price after application
      - Discount amount (calculated)
      - Success/failure status
      - Detection method used
      - Time taken to detect result
    - Keep best result (largest discount) in memory
    - At end of loop, re-apply best coupon if different from last tested
  - **Anti-Bot Detection Avoidance:**
    - **Human-like behavior simulation:**
      - Random delay variation: 2-4 seconds between attempts (not fixed 2 seconds)
      - Mouse movement simulation: Move cursor to input before typing (optional)
      - Typing simulation: Set value character-by-character with small delays (optional, configurable)
    - **Rate limiting:**
      - Respect configurable max attempts per session (default: 20 coupons)
      - Implement exponential backoff if error rate increases
      - Stop immediately if CAPTCHA detected
    - **Warning messages:**
      - Display warning if testing >10 coupons ("This may take a while...")
      - Warn about potential rate limiting on known strict retailers
      - Log all attempts for debugging without exposing sensitive data
- **TypeScript Interfaces:**

  ```typescript
  interface PriceInfo {
    value: number; // Normalized numeric price
    rawText: string; // Original price text from DOM
    currency: string; // Detected currency symbol
    element: HTMLElement | null; // DOM element containing price
    detectedAt: number; // Timestamp (Date.now())
  }

  interface CouponTestResult {
    couponId: string;
    code: string;
    priceBefore: PriceInfo;
    priceAfter: PriceInfo;
    discountAmount: number; // Calculated: priceBefore - priceAfter
    discountPercentage: number; // Calculated: (discount / priceBefore) * 100
    success: boolean;
    failureReason?: string; // e.g., "Invalid coupon", "Expired", "Timeout"
    detectionMethod: 'price-change' | 'success-message' | 'failure-message' | 'timeout';
    durationMs: number; // Time taken to test this coupon
  }

  interface ApplierResult {
    tested: number; // Total coupons tested
    successful: number; // Number that successfully applied
    failed: number; // Number that failed
    bestCoupon: CouponTestResult | null; // Coupon with largest discount
    allResults: CouponTestResult[]; // Full test history
    cancelledByUser: boolean;
    errorMessage?: string; // Fatal error that stopped the process
  }

  interface ApplierOptions {
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
  ```

- **Module Architecture:**
  - `client/src/content/applier.ts` - Main auto-apply orchestration module
  - **Core Functions:**
    - `autoApplyCoupons(options: ApplierOptions): Promise<ApplierResult>` - Main entry point
    - `detectPrice(selectors?: string[]): Promise<PriceInfo | null>` - Multi-strategy price detection
    - `normalizePrice(priceText: string): number` - Parse and normalize price strings
    - `applySingleCoupon(code: string, input: HTMLInputElement, submit: HTMLElement): Promise<void>` - Apply one coupon
    - `waitForPriceChange(basePrice: PriceInfo, timeout: number): Promise<PriceInfo>` - Wait for price update via MutationObserver
    - `detectSuccessIndicators(): { success: boolean; message?: string }` - Scan for success/error messages
    - `simulateHumanDelay(min: number, max: number): Promise<void>` - Random delay utility
    - `reapplyBestCoupon(couponCode: string, input: HTMLInputElement, submit: HTMLElement): Promise<void>` - Re-apply winning coupon at end
  - **State Management:**
    - Maintain internal state object tracking current test progress
    - Allow external cancellation via AbortController pattern
    - Persist partial results to `chrome.storage.local` in case of crash
- **Dynamic Content Handling:**
  - **MutationObserver for price changes:**
    - Watch checkout/cart container for any DOM changes
    - Debounce observer callbacks (100ms) to avoid rapid re-checks
    - Look for changes in price element text content
    - Disconnect observer when price change detected or timeout reached
  - **Waiting for UI updates:**
    - After clicking submit, wait for loading indicators to disappear
    - Common loading indicators: spinners, disabled buttons, overlay masks
    - Maximum wait time per coupon: 5 seconds (configurable)
  - **Handling SPA re-renders:**
    - Some sites replace entire cart section after coupon apply
    - Re-query price element after each application (don't cache reference)
    - Validate element is still in DOM before reading value
- **Error Handling:**
  - **Graceful degradation:**
    - If price detection fails, ask user to manually verify best coupon
    - If submit button becomes unclickable, log error and skip to next coupon
    - If DOM structure changes mid-process, attempt to re-detect elements
  - **User interruption:**
    - Support cancellation via AbortController
    - When cancelled, return partial results with `cancelledByUser: true`
    - Restore original page state if possible (clear coupon input)
  - **Rate limiting detection:**
    - If multiple consecutive failures (>5), assume rate limiting
    - Stop auto-apply and show warning to user
    - Log failure pattern for debugging
  - **Error logging:**
    - Use `console.debug` for normal flow logs (can be filtered out)
    - Use `console.warn` for unexpected but recoverable errors
    - Use `console.error` for fatal errors that stop the process
    - Never expose sensitive data (full prices, user info) in logs
- **Performance:**
  - **Delay optimization:**
    - Minimum delay: 1.5 seconds (avoid too-fast bot detection)
    - Maximum delay: 4 seconds (avoid user frustration)
    - Random variation within range for human-like behavior
  - **Batch processing limits:**
    - Default max: 20 coupons per session
    - If >20 coupons available, test only top 20 by success rate
    - Allow user to configure max in extension settings
  - **Memory management:**
    - Clear `allResults` array after sending feedback to API
    - Disconnect MutationObservers when done
    - Remove progress UI elements from DOM when complete
  - **Early termination:**
    - If 100% discount found, stop immediately (free item!)
    - If user cancels, stop immediately and clean up
    - If CAPTCHA detected, stop and alert user
- **User Experience:**
  - **Progress Indicator:**
    - Overlay modal: Semi-transparent backdrop, centered card
    - Show: "Testing coupons... (3/10)" with spinner
    - Show: "Best discount so far: $15.50 (25% off)"
    - Cancel button: "Stop Testing" (always visible and clickable)
  - **Success Notification:**
    - When complete: "Found best coupon: SAVE20 - saved $25.00!"
    - Auto-dismiss after 5 seconds or user dismissal
    - Option to "Apply Best Coupon" if not auto-applied
  - **Error Recovery:**
    - If all coupons fail: "No valid coupons found for this purchase"
    - If cancelled: "Coupon testing cancelled. Best so far: ..." or "No coupons tested yet"
    - If fatal error: "Unable to test coupons. Please try manually."
  - **Accessibility:**
    - Progress modal should be keyboard accessible (focus trap)
    - Cancel button focusable and activated by Enter/Space
    - Announce progress to screen readers via `aria-live` region
- **Acceptance Criteria:**
  - ✅ Successfully tests multiple coupons sequentially on checkout page
  - ✅ Detects price changes after each coupon application using MutationObserver
  - ✅ Correctly identifies success/failure based on DOM changes and messages
  - ✅ Returns best coupon (largest discount) at end of test cycle
  - ✅ Re-applies best coupon if different from last tested coupon
  - ✅ Displays real-time progress to user in on-page modal
  - ✅ Supports user cancellation at any point without breaking page
  - ✅ Handles edge cases: no price change, ambiguous results, timeout
  - ✅ Uses random delays (2-4 seconds) between attempts to avoid bot detection
  - ✅ Stops testing if CAPTCHA detected or excessive failures occur
  - ✅ Logs all attempts for debugging without exposing sensitive data
  - ✅ Gracefully handles price detection failures (prompts user verification)
  - ✅ Works with common e-commerce platforms (Shopify, WooCommerce, Magento)
  - ✅ Respects configurable limits (max coupons to test, timeout per coupon)
- **Testing:**
  - **Unit Tests (Jest + jsdom):**
    - **Price Detection:**
      - Mock DOM with various price elements (class-based, ID-based, data attributes)
      - Test `detectPrice` with different price formats: `$1,234.56`, `€1.234,56`, `£1234.56`
      - Test `normalizePrice` correctly parses all common currency formats
      - Test price detection returns null when no price element found
    - **Coupon Application:**
      - Mock input element and submit button
      - Test `applySingleCoupon` sets input value correctly
      - Test dispatches all required events (input, change, keyup)
      - Test handles disabled submit buttons gracefully
    - **Result Tracking:**
      - Test `CouponTestResult` correctly calculates discount amount and percentage
      - Test result tracking maintains history of all tested coupons
      - Test identifies best coupon (highest discount) from multiple results
    - **State Management:**
      - Test cancellation via AbortController stops process immediately
      - Test partial results returned when cancelled mid-process
      - Test state persistence to chrome.storage.local on each coupon test
    - **Error Handling:**
      - Test graceful handling when price detection fails
      - Test graceful handling when submit button not found after DOM change
      - Test rate limiting detection after 5+ consecutive failures
  - **Integration Tests (E2E with test checkout pages):**
    - Create test HTML files simulating real checkout pages:
      - `test-shopify-checkout.html` - Standard Shopify checkout with price in `.total-line__price`
      - `test-woocommerce-checkout.html` - WooCommerce with price in `.order-total .amount`
      - `test-dynamic-price.html` - Price updates via AJAX after 1-second delay
      - `test-success-message.html` - Shows "Coupon applied!" message instead of immediate price change
      - `test-error-message.html` - Shows "Invalid coupon" error message
    - Test scenarios:
      - **Scenario 1: Happy path**
        - Test page with 5 coupons (3 valid, 2 invalid)
        - Verify all 5 tested sequentially
        - Verify best coupon identified and re-applied
        - Verify progress UI updates correctly
      - **Scenario 2: All coupons fail**
        - Test with 3 invalid coupons
        - Verify all marked as failed
        - Verify appropriate error message shown to user
      - **Scenario 3: User cancellation**
        - Start auto-apply with 10 coupons
        - Cancel after 3rd coupon tested
        - Verify process stops immediately
        - Verify partial results returned (3 tested)
      - **Scenario 4: Price detection failure**
        - Test on page with no detectable price element
        - Verify graceful handling with user prompt
      - **Scenario 5: Dynamic price updates**
        - Test on page where price updates after 2-second delay
        - Verify MutationObserver detects delayed price change
        - Verify doesn't timeout prematurely
    - Performance tests:
      - Verify delays between attempts are randomized (2-4 seconds)
      - Verify max attempts limit respected (stops at 20 coupons)
      - Verify MutationObserver disconnects after each coupon test
- **Best Practices & Warnings:**
  - ⚠️ **Rate Limiting:** Retailers may block IPs that test too many coupons too quickly. Implement exponential backoff and respect delays.
  - ⚠️ **CAPTCHA Detection:** If CAPTCHA appears, stop immediately and alert user. Do not attempt to bypass.
  - ⚠️ **Anti-Bot Measures:** Many sites use bot detection (e.g., reCAPTCHA, Cloudflare). Simulate human behavior with random delays and realistic event sequences.
  - ⚠️ **Privacy:** Never log full prices, user addresses, or payment info. Only log discount amounts and coupon codes.
  - ⚠️ **Error Recovery:** Always restore page to functional state after errors. Clear test coupons, re-enable buttons, remove overlays.
  - 💡 **Optimization:** Cache price selectors per domain in `chrome.storage.local` to speed up future detections on same site.
  - 💡 **User Control:** Always provide cancel button. Never force auto-apply without user consent.

### Story 4.3: Feedback Loop API

- **Description:** Implement a bidirectional feedback system that reports coupon test results back to the server, enabling the platform to learn which coupons are working and improve recommendations over time. This creates a crowdsourced intelligence layer that benefits all users.
- **Implementation Requirements:**
  - **Backend API Endpoint:**
    - **Route:** `POST /api/v1/coupons/:id/feedback`
    - **Authentication:** Optional for MVP (can add API key or user tokens later)
    - **Rate Limiting:** Max 100 requests per IP per hour to prevent abuse
    - **Request Validation:**
      - Validate `:id` is valid UUID format
      - Validate coupon exists in database before accepting feedback
      - Validate request body against schema (Zod/Joi)
      - Reject requests with invalid or missing required fields
    - **Business Logic:**
      - Increment `successCount` if `success: true`
      - Increment `failureCount` if `success: false`
      - Update `lastSuccessAt` timestamp if successful
      - Update `lastTestedAt` timestamp regardless of outcome
      - Calculate and store success rate percentage: `(successCount / (successCount + failureCount)) * 100`
      - Implement atomic updates (use database transactions to prevent race conditions)
    - **Response Format:**
      - Success: `{ success: true, message: "Feedback recorded", updatedCoupon: { id, successCount, failureCount, successRate } }`
      - Error: `{ success: false, error: "Error message" }`
    - **Database Considerations:**
      - Use optimistic locking or database-level atomic increments (`prisma.coupon.update({ data: { successCount: { increment: 1 } } })`)
      - Index on `successCount` and `lastSuccessAt` for efficient sorting
      - Consider archiving coupons with `failureCount > 50` and `successCount === 0`
  - **Batch Feedback Endpoint (Optional Enhancement):**
    - **Route:** `POST /api/v1/coupons/feedback/batch`
    - **Purpose:** Allow extension to send feedback for multiple coupons in single request
    - **Body:** `{ feedback: Array<{ couponId: string, success: boolean, metadata?: object }> }`
    - **Benefits:** Reduces network requests, better for auto-apply loops testing 10+ coupons
  - **Frontend Integration:**
    - **When to Send Feedback:**
      - After auto-apply loop completes (Story 4.2)
      - Send feedback for ALL tested coupons, not just successful ones
      - Include timestamp of test for analytics
    - **What to Send:**
      - Coupon ID (from API response)
      - Success/failure boolean
      - Optional metadata:
        - Discount amount achieved (if successful)
        - Failure reason (if detected: "expired", "invalid", "minimum not met")
        - Retailer domain
        - Test duration (time to get result)
    - **Error Handling:**
      - If feedback API fails, store in local queue (`chrome.storage.local`)
      - Retry failed feedback submissions on next extension startup
      - Max retry attempts: 3 per feedback item
      - Clear queue after 7 days (don't persist stale data)
    - **Privacy Considerations:**
      - NEVER send user's cart contents, prices, or personal information
      - Only send: coupon ID, success boolean, optional anonymous metadata
      - Don't include user IP or identifying information beyond what's in HTTP headers
      - Comply with privacy-first approach (user should be able to disable feedback in settings)
    - **User Control:**
      - Add setting in extension: "Help improve coupon recommendations" (toggle, default ON)
      - If disabled, skip all feedback API calls
      - Show user value proposition: "Anonymous usage data helps find working coupons faster"
  - **Module Architecture:**
    - **Backend:**
      - `server/src/routes/coupon.routes.ts` - Define feedback endpoint route
      - `server/src/controllers/coupon.controller.ts` - Handle request validation and response
      - `server/src/services/coupon.service.ts` - Business logic for updating counts
      - `server/src/middleware/rateLimiter.ts` - Rate limiting middleware
      - `server/src/validators/feedback.validator.ts` - Zod/Joi schema validation
    - **Frontend:**
      - `client/src/services/feedback.service.ts` - API client for sending feedback
      - `client/src/utils/feedbackQueue.ts` - Queue management for failed requests
      - `client/src/background/feedbackWorker.ts` - Background service for retry logic
  - **TypeScript Interfaces:**

    ```typescript
    // Shared types (both frontend and backend)
    interface FeedbackRequest {
      success: boolean;
      metadata?: {
        discountAmount?: number; // Only if successful
        discountPercentage?: number; // Only if successful
        failureReason?: 'expired' | 'invalid' | 'minimum-not-met' | 'out-of-stock' | 'other';
        domain: string; // Retailer domain for analytics
        testDurationMs: number; // How long test took
        detectionMethod: 'price-change' | 'success-message' | 'failure-message' | 'timeout';
        testedAt: string; // ISO timestamp
      };
    }

    interface FeedbackResponse {
      success: true;
      message: string;
      updatedCoupon: {
        id: string;
        successCount: number;
        failureCount: number;
        successRate: number; // Calculated percentage
        lastSuccessAt?: string;
        lastTestedAt: string;
      };
    }

    interface FeedbackError {
      success: false;
      error: string;
      code?: 'COUPON_NOT_FOUND' | 'INVALID_REQUEST' | 'RATE_LIMITED' | 'SERVER_ERROR';
    }

    // Batch feedback types
    interface BatchFeedbackRequest {
      feedback: Array<{
        couponId: string;
        success: boolean;
        metadata?: FeedbackRequest['metadata'];
      }>;
    }

    interface BatchFeedbackResponse {
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

    // Frontend queue types
    interface QueuedFeedback {
      couponId: string;
      feedback: FeedbackRequest;
      attempts: number;
      createdAt: number; // Timestamp
      lastAttemptAt?: number;
    }
    ```

- **Error Handling:**
  - **Backend:**
    - Return 404 if coupon ID not found in database
    - Return 400 for invalid request body or malformed UUID
    - Return 429 for rate limit exceeded (with `Retry-After` header)
    - Return 500 for database errors (log internally, don't expose details)
    - Use centralized error handler middleware
  - **Frontend:**
    - Catch network errors (offline, timeout, DNS failure)
    - Handle 404: Coupon may have been deleted, remove from queue
    - Handle 429: Implement exponential backoff, retry after delay
    - Handle 500: Queue for retry with exponential backoff
    - Log errors to extension console for debugging (use `console.warn`)
  - **Queue Management:**
    - Store failed feedback in `chrome.storage.local` under key `feedbackQueue`
    - Structure: `{ queue: QueuedFeedback[], lastProcessedAt: number }`
    - Process queue on extension startup and every 5 minutes (background worker)
    - Remove items after 3 failed attempts or 7 days old
    - Max queue size: 100 items (FIFO eviction if exceeded)
- **Performance & Optimization:**
  - **Backend:**
    - Use database connection pooling (Prisma default)
    - Add index on `coupon.id` (primary key, already indexed)
    - Use `SELECT FOR UPDATE` or atomic increments to prevent race conditions
    - Consider caching success rates in Redis for high-traffic scenarios (future)
    - Log slow queries (>100ms) for optimization
  - **Frontend:**
    - Batch feedback when possible (send all results from auto-apply in one request)
    - Debounce feedback submissions (don't send immediately, wait 2 seconds)
    - Use `navigator.sendBeacon()` for fire-and-forget feedback on extension unload
    - Compress request payload for batch feedback (gzip if >1KB)
  - **Rate Limiting Strategy:**
    - Backend: 100 requests/hour per IP (configurable via env var)
    - Frontend: Max 1 batch request per domain per 5 minutes
    - Implement client-side rate limit cache to avoid unnecessary API calls
- **Security Considerations:**
  - **Input Validation:**
    - Sanitize all input fields (prevent NoSQL injection if using MongoDB, SQL injection if using raw queries)
    - Validate UUID format using regex or library
    - Limit metadata object size (max 1KB JSON)
    - Reject requests with suspicious patterns (e.g., rapid-fire from same IP)
  - **Anti-Abuse:**
    - Implement CAPTCHA for IPs exceeding rate limits repeatedly
    - Block IPs with malicious patterns (e.g., trying to SQL inject)
    - Log all feedback submissions for audit trail
    - Consider implementing request signing (HMAC) to verify requests from official extension
  - **Privacy:**
    - Don't log user IP addresses in application logs (only in web server access logs)
    - Anonymize metadata before storing (strip any PII accidentally included)
    - Provide clear privacy policy about what data is collected
    - Allow users to opt-out via extension settings
- **Analytics & Monitoring:**
  - **Metrics to Track:**
    - Total feedback submissions per day
    - Success vs failure ratio across all coupons
    - Top performing coupons (highest success rate)
    - Worst performing coupons (candidates for removal)
    - Average time between last test and last success (freshness metric)
    - Number of coupons tested per domain
  - **Alerting:**
    - Alert if feedback API error rate >10%
    - Alert if database write latency >500ms
    - Alert if rate limiting is triggered >100 times/hour (potential attack)
  - **Dashboards:**
    - Create admin dashboard showing coupon performance metrics
    - Display trend graphs: success rate over time per retailer
    - Show "stale" coupons (not tested in 30+ days) for review
- **Acceptance Criteria:**
  - ✅ Backend endpoint `POST /api/v1/coupons/:id/feedback` successfully updates coupon counts
  - ✅ `successCount` increments when `success: true` sent
  - ✅ `failureCount` increments when `success: false` sent
  - ✅ `lastSuccessAt` updates to current timestamp on successful feedback
  - ✅ `lastTestedAt` updates on every feedback submission
  - ✅ Returns 404 when coupon ID doesn't exist
  - ✅ Returns 400 when request body is invalid
  - ✅ Returns 429 when rate limit exceeded (with appropriate headers)
  - ✅ Frontend sends feedback for all tested coupons after auto-apply completes
  - ✅ Failed feedback requests are queued in `chrome.storage.local`
  - ✅ Queued feedback retries on next extension startup
  - ✅ Queue items are removed after 3 failed attempts or 7 days
  - ✅ User can disable feedback submission via extension settings
  - ✅ No sensitive user data (prices, cart contents, PII) is sent to server
  - ✅ Batch feedback endpoint processes multiple coupons in single request
  - ✅ Database updates are atomic (no race conditions on concurrent requests)
  - ✅ Rate limiting prevents abuse (100 requests/hour per IP)
- **Testing:**
  - **Backend Unit Tests (Jest + Supertest):**
    - **Endpoint Tests:**
      - Test `POST /api/v1/coupons/:id/feedback` with valid success feedback increments `successCount`
      - Test with valid failure feedback increments `failureCount`
      - Test with success feedback updates `lastSuccessAt` timestamp
      - Test with any feedback updates `lastTestedAt` timestamp
      - Test with non-existent coupon ID returns 404
      - Test with invalid UUID format returns 400
      - Test with missing request body returns 400
      - Test with malformed JSON returns 400
    - **Validation Tests:**
      - Test Zod/Joi schema rejects invalid `success` field (non-boolean)
      - Test schema accepts optional `metadata` object
      - Test schema rejects metadata exceeding size limit (>1KB)
    - **Rate Limiting Tests:**
      - Test 101st request within 1 hour returns 429
      - Test `Retry-After` header is present in 429 response
      - Test rate limit resets after time window expires
    - **Database Tests:**
      - Mock Prisma client to verify correct update queries
      - Test atomic increment operations (no race conditions)
      - Test transaction rollback on database error
  - **Backend Integration Tests:**
    - Seed database with test coupon (id: `test-coupon-123`, successCount: 5, failureCount: 2)
    - Send success feedback, verify count becomes 6
    - Send failure feedback, verify count becomes 3
    - Send 100 requests rapidly, verify 101st is rate limited
    - Test batch endpoint with 10 feedback items, verify all processed
  - **Frontend Unit Tests (Jest + React Testing Library):**
    - **Feedback Service Tests:**
      - Mock `fetch` API, test `sendFeedback()` calls correct endpoint with correct payload
      - Test successful response (200) resolves promise
      - Test network error rejects promise
      - Test 429 response triggers exponential backoff
    - **Queue Management Tests:**
      - Mock `chrome.storage.local`, test failed feedback is queued
      - Test queue retrieval returns all queued items
      - Test queue processing retries failed items
      - Test items removed from queue after 3 attempts
      - Test items removed from queue if older than 7 days
      - Test queue max size (100 items) with FIFO eviction
    - **Background Worker Tests:**
      - Mock `chrome.alarms` API for periodic queue processing
      - Test worker processes queue on extension startup
      - Test worker processes queue every 5 minutes
      - Test worker handles empty queue gracefully
  - **Frontend Integration Tests (E2E):**
    - **Scenario 1: Successful feedback submission**
      - Complete auto-apply loop with 3 coupons (2 success, 1 fail)
      - Verify 3 feedback requests sent to API
      - Verify 2 with `success: true`, 1 with `success: false`
      - Verify queue is empty after successful submission
    - **Scenario 2: Failed feedback with retry**
      - Mock API to return 500 error
      - Complete auto-apply loop with 1 coupon
      - Verify feedback queued in `chrome.storage.local`
      - Verify retry attempted on next startup
      - Mock API to return 200 on retry
      - Verify queue cleared after successful retry
    - **Scenario 3: Rate limiting**
      - Send 100 feedback requests rapidly
      - Mock API to return 429 on 101st request
      - Verify exponential backoff implemented
      - Verify request queued for later retry
    - **Scenario 4: User opt-out**
      - Disable feedback in extension settings
      - Complete auto-apply loop
      - Verify NO feedback requests sent
      - Verify queue remains empty
    - **Scenario 5: Batch feedback**
      - Complete auto-apply loop with 10 coupons
      - Verify single batch request sent with all 10 feedback items
      - Verify individual feedback not sent
- **Future Enhancements (Out of Scope for MVP):**
  - 🔮 **User Accounts:** Tie feedback to authenticated users for personalized recommendations
  - 🔮 **Machine Learning:** Analyze feedback patterns to predict coupon expiry dates
  - 🔮 **Reputation System:** Weight feedback from "trusted" users more heavily (based on accuracy history)
  - 🔮 **Real-time Updates:** Use WebSockets to push newly validated coupons to active users
  - 🔮 **A/B Testing:** Test different coupon sorting algorithms based on feedback data
  - 🔮 **Fraud Detection:** Use ML to detect fake feedback submissions (bots, competitors)
  - 🔮 **Coupon Health Score:** Combine success rate, recency, and test volume into single metric

---

# 📝 Technical Documentation & Handover

### How to use this with an AI CLI (e.g., Claude/Gemini)

1. **Context Loading:** Copy the "Tech Stack" and "Global Standards" into the chat first.
2. **Iterative Execution:** Copy **one Story at a time**. Do not ask the AI to do the whole PRD at once.
3. **Review:** Ask the AI to write the tests _before_ writing the code (TDD style) to ensure adherence to requirements.

### Example Prompt for Story 2.1

> "Acting as a Senior Backend Engineer, please implement Story 2.1 from the PRD. We are using Node, Express, and Prisma. Create the schema, run the migration, and ensure the types are generated. Provide the code for `schema.prisma` and the terminal commands to run."
