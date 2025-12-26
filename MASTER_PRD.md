This Master Product Requirement Document (PRD) is designed to guide an AI coding agent (like Claude Code or Gemini CLI) through the creation of an open-source coupon extension framework.

The project is architected as a **Monorepo** containing two main services: `extension-client` and `backend-api`.

---

# 📂 Master PRD: Open Source Coupon Extension Framework

**Project Name:** OpenCoupon (Placeholder)
**Vision:** A modular, open-source framework for building browser extensions that automatically find and apply coupon codes.
**Tech Stack:**
* **Frontend:** React (Vite) + TypeScript + Tailwind CSS
* **Backend:** Node.js + Express.js + TypeScript
* **Database:** PostgreSQL (managed via Prisma ORM)
* **Infrastructure:** Docker Compose (for local dev of DB + API)

## 🛠️ Global Development Standards (System Prompt for AI)
*Before starting any task, ingest these standards:*
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
* **Description:** Initialize a root directory with two distinct packages: `client` (Vite+React+TS) and `server` (Node+Express+TS). Setup ESLint and Prettier at the root.
* **AI Instructions:**
    * Create root folder `opencoupon`.
    * Initialize `client` using `npm create vite@latest client -- --template react-ts`.
    * Initialize `server` with `npm init -y` and install `typescript`, `ts-node`, `nodemon`, `express`. Generate `tsconfig.json` for server with `outDir: ./dist` and `rootDir: ./src`.
    * Create a `docker-compose.yml` at root.
* **Acceptance Criteria:**
    * `npm run dev` in client starts Vite server.
    * `npm run dev` in server starts Express server.
* **Testing:** Verify directory structure.

### Story 1.2: Docker Database Setup
* **Description:** Configure Docker Compose to spin up a PostgreSQL container and a pgAdmin container for management.
* **AI Instructions:**
    * Edit `docker-compose.yml`.
    * Service 1: `postgres` (Image: `postgres:15-alpine`). Map port `5432:5432`. Set env vars for user/pass.
    * Service 2: `pgadmin` (Image: `dpage/pgadmin4`). Map port `5050:80`.
    * Define a named volume `postgres_data` for persistence.
* **Acceptance Criteria:**
    * `docker compose up -d` successfully starts DB.
    * Connection to `localhost:5432` is successful using defined credentials.

---

# 📑 Feature PRD 2: Backend Core (Coupons & API)

**Goal:** Create the REST API to serve coupon data to the extension.

### Story 2.1: Database Schema (Prisma)
* **Description:** Define data models for `Retailer` and `Coupon` with enhanced fields for smart coupon management.
* **AI Instructions:**
    * Install `prisma` and `@prisma/client` in `server`. Initialize with `npx prisma init`.
    * Define Model `Retailer`:
        * `id` (UUID, primary key)
        * `domain` (String, unique, indexed)
        * `name` (String)
        * `logoUrl` (String?, optional) - For displaying in Extension Popup
        * `homeUrl` (String?, optional) - Direct link to the store
        * `isActive` (Boolean, default: true) - Active status flag
        * `selectorConfig` (Json?, optional) - Smart DOM metadata for CSS selectors (e.g., `{ "input": "#promo-code", "submit": ".btn-apply" }`)
        * `createdAt` (DateTime, default: now())
        * `updatedAt` (DateTime, auto-updated)
        * Relation: One-to-many with `Coupon`
    * Define Model `Coupon`:
        * `id` (UUID, primary key)
        * `code` (String)
        * `description` (String)
        * `successCount` (Int, default: 0)
        * `failureCount` (Int, default: 0)
        * `lastSuccessAt` (DateTime?, optional) - Helps prioritize "fresh" coupons
        * `lastTestedAt` (DateTime?, optional) - Helps prune "stale" coupons
        * `expiryDate` (DateTime?, optional) - If the source provided an expiry
        * `source` (String?, optional) - e.g., "user-submission", "scraper-v1", "admin"
        * `createdAt` (DateTime, default: now())
        * `updatedAt` (DateTime, auto-updated)
        * `retailerId` (UUID, foreign key to Retailer with CASCADE delete)
        * Unique constraint: `@@unique([retailerId, code])` - Prevents duplicate coupons per retailer
        * Index: `@@index([retailerId])`
    * Run migrations: `npx prisma migrate dev --name init` and `npx prisma migrate dev --name add_enhanced_fields`.
    * Generate Prisma Client: `npx prisma generate`.
* **Acceptance Criteria:**
    * `schema.prisma` file exists and is valid.
    * Tables created in Docker Postgres instance with all enhanced fields.
    * Unique constraint ensures no duplicate coupon codes per retailer.
    * Prisma Client generated with updated types.

### Story 2.2: Coupon Lookup Endpoint
* **Description:** Create a GET endpoint that accepts a domain URL and returns valid coupons.
* **AI Instructions:**
    * Create route `GET /api/v1/coupons`.
    * Input: Query param `?domain=example.com`.
    * Logic: Extract hostname. Query `Retailer` table by domain. Return associated `Coupon` list ordered by `successCount` DESC. Use `lastSuccessAt` to prioritize fresh coupons.
    * Response Type: `JSON { data: Coupon[] }`.
    * Error Handling: Return 404 if retailer not found.
* **Testing:**
    * Unit Test: Mock Prisma response, verify controller logic.
    * Integration Test: Seed DB with 3 random non-existent retailer data and 10 coupons each, hit endpoint, verify JSON response.

---

# 📑 Feature PRD 3: Extension Client - UI (The Popup)

**Goal:** The user interface users see when clicking the extension icon.

### Story 3.1: Manifest V3 Configuration
* **Description:** Initialize the extension client using CRXJS framework.
* **Implementation:**
    * Extension initialized with `npx create-crxjs` command.
    * Uses `@crxjs/vite-plugin` for building Manifest V3 extensions with Vite.
    * Project structure created:
        * `manifest.config.ts` - Dynamic manifest configuration using `defineManifest`.
        * `src/popup/` - Popup UI entry point (index.html + main.tsx + App.tsx).
        * `src/sidepanel/` - Side panel UI entry point (index.html + main.tsx + App.tsx).
        * `src/content/` - Content scripts entry point (main.tsx).
        * `src/components/` - Shared React components.
        * `public/` - Static assets (logo.png).
    * Build configuration:
        * `vite.config.ts` includes crx plugin and zip packaging plugin.
        * TypeScript with strict mode and Chrome types (`@types/chrome`).
        * Path aliases configured (`@/*` -> `src/*`).
        * React 19 with TypeScript 5.8.
    * Current manifest configuration:
        * `manifest_version: 3`
        * Permissions: `sidePanel`, `contentSettings`
        * Content scripts: Matches `https://*/*`
        * Action: default_popup at `src/popup/index.html`
        * Side panel: default_path at `src/sidepanel/index.html`
* **Next Steps:**
    * Update manifest permissions to include `activeTab`, `storage`, `scripting` for coupon functionality.
    * Add host permissions for API endpoint access.
* **Acceptance Criteria:**
    * ✅ `npm run dev` starts development server.
    * ✅ `npm run build` generates dist folder loadable in Chrome `chrome://extensions`.
    * ✅ Extension includes popup, sidepanel, and content script entry points.

### Story 3.2: Popup UI - Coupon List
* **Description:** Build a React-based popup interface that fetches and displays available coupons for the current tab's domain.
* **Implementation Requirements:**
    * **Active Tab Detection:**
        * Use `chrome.tabs.query({ active: true, currentWindow: true })` to get current tab URL.
        * Extract hostname from the URL for API queries.
        * Handle edge cases: new tab, chrome:// URLs, local files.
    * **API Integration:**
        * Endpoint: `http://localhost:3030/api/v1/coupons?domain={hostname}`
        * Use `fetch` with proper error handling and timeout.
        * Implement retry logic for failed requests (max 3 attempts).
    * **TypeScript Interfaces:**
        * Define `Coupon` interface matching backend schema:
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
        * Define `Retailer` interface for retailer information.
    * **Component Architecture:**
        * `CouponList` - Main container component in `src/popup/components/CouponList.tsx`.
        * `CouponCard` - Individual coupon card component:
            * Display: Coupon code (prominent), description, success rate percentage.
            * Actions: "Copy Code" button (copies to clipboard with visual feedback).
            * Visual indicators: Success rate badge (green for >50%, yellow for 25-50%, red for <25%).
            * Expiry warning: Show warning icon if expiry date is within 7 days.
        * `EmptyState` - Display when no coupons are available for the domain.
        * `ErrorState` - Display when API request fails.
    * **State Management:**
        * Loading state: Show skeleton loaders while fetching.
        * Error state: Display user-friendly error messages with retry button.
        * Empty state: Show message "No coupons available for this site" with option to contribute.
        * Success state: Display sorted coupon list (by successCount DESC, then lastSuccessAt).
    * **Styling:**
        * Install and configure Tailwind CSS if not already present.
        * Responsive design: Min-width 320px, max-width 400px for popup.
        * Clean card layout with proper spacing and hover effects.
        * Accessible color contrast (WCAG AA compliant).
    * **User Experience:**
        * Copy to clipboard: Use `navigator.clipboard.writeText()` with fallback.
        * Show toast notification: "Code copied!" with auto-dismiss after 2s.
        * Keyboard navigation: Ensure all interactive elements are keyboard accessible.
        * Loading animation: Smooth skeleton loaders, avoid jarring transitions.
    * **Performance:**
        * Cache coupon data in `chrome.storage.local` for 5 minutes to reduce API calls.
        * Debounce tab change events to avoid excessive API requests.
* **Acceptance Criteria:**
    * ✅ Popup opens and displays loading state immediately.
    * ✅ Fetches coupons for the current tab's domain.
    * ✅ Displays coupons sorted by success rate (highest first).
    * ✅ "Copy Code" button successfully copies coupon code to clipboard.
    * ✅ Shows appropriate messages for empty states and errors.
    * ✅ Handles network failures gracefully with retry option.
    * ✅ Caches results for 5 minutes to improve performance.
    * ✅ All interactive elements are keyboard accessible.
* **Testing:**
    * **Unit Tests (Jest + React Testing Library):**
        * Mock `chrome.tabs.query` to return test tab data.
        * Mock `fetch` to return test coupon data.
        * Test loading state renders skeleton loaders.
        * Test successful data fetch renders correct number of CouponCard components.
        * Test empty state renders EmptyState component.
        * Test error state renders ErrorState with retry button.
        * Test copy button calls `navigator.clipboard.writeText` with correct code.
        * Test success rate badge colors based on success percentage.
    * **Integration Tests:**
        * Test full flow: popup open → fetch → render → copy.
        * Test cache mechanism: second fetch within 5 minutes uses cached data.
        * Test retry logic on failed API calls.

---

# 📑 Feature PRD 4: The Injection Engine (The "Honey" Logic)

**Goal:** Inject code into the retailer's checkout page to detect input fields and apply coupons.

### Story 4.1: Input Field Detection (Heuristics)
* **Description:** A content script that intelligently scans the DOM to find coupon/promo code input fields and their associated submit buttons using multiple detection strategies.
* **Implementation Requirements:**
    * **Detection Strategies:**
        * **Attribute-based detection:**
            * Search keywords: `['coupon', 'promo', 'promotional', 'discount', 'voucher', 'code', 'gift']`
            * Check attributes: `id`, `name`, `placeholder`, `aria-label`, `data-*`, `class`
            * Case-insensitive matching with word boundary detection
        * **Label-based detection:**
            * Find `<label>` elements with relevant text, trace to associated input via `for` attribute or DOM hierarchy
            * Check label text for keywords even if input lacks descriptive attributes
        * **Input type detection:**
            * Primary: `input[type="text"]`
            * Secondary: `input[type="search"]`, `input[type="email"]` (some sites use non-standard types)
            * Fallback: `input:not([type])` (inputs without explicit type)
        * **Button/Link detection:**
            * Find "Apply", "Submit", "Use Code" buttons near detected inputs
            * Check for `<button>`, `<input type="submit">`, `<a>` with click handlers
            * Use spatial proximity (within same container/form) and visual hierarchy
        * **Retailer-specific selectors:**
            * Support for `selectorConfig` from backend (Story 2.1)
            * Prioritize retailer-specific CSS selectors when available
            * Fallback to heuristics if specific selectors fail
    * **TypeScript Interfaces:**
        ```typescript
        interface DetectionResult {
          inputElement: HTMLInputElement | null;
          submitElement: HTMLElement | null;
          confidence: number; // 0-100 score based on detection method
          detectionMethod: 'retailer-specific' | 'attribute' | 'label' | 'heuristic';
          containerElement?: HTMLElement; // Parent form or container
        }

        interface SelectorConfig {
          input?: string;  // CSS selector for input field
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
    * **Module Architecture:**
        * `client/src/content/detector.ts` - Main detection module
        * `findCouponElements(options?: DetectorOptions): Promise<DetectionResult>` - Primary detection function
        * `findByRetailerConfig(config: SelectorConfig): DetectionResult | null` - Retailer-specific detection
        * `findByAttributes(keywords: string[]): DetectionResult | null` - Attribute-based detection
        * `findByLabel(keywords: string[]): DetectionResult | null` - Label-based detection
        * `findSubmitButton(inputElement: HTMLInputElement): HTMLElement | null` - Button detection
        * `calculateConfidence(element: HTMLElement, method: string): number` - Confidence scoring
        * `waitForElement(selector: string, timeout: number): Promise<HTMLElement | null>` - Dynamic content handling
    * **Dynamic Content Handling:**
        * Implement `MutationObserver` to detect lazy-loaded coupon fields
        * Watch for changes in subtree with `{ childList: true, subtree: true }`
        * Debounce observer callbacks to avoid excessive re-detection (300ms delay)
        * Set timeout for observation (default: 10 seconds)
        * Disconnect observer once element is found
    * **Confidence Scoring System:**
        * Retailer-specific selector match: 100 points
        * Multiple keyword matches: 80-90 points
        * Single keyword match with appropriate input type: 60-70 points
        * Label-based match: 50-60 points
        * Heuristic fallback: 30-40 points
        * Return null if confidence < 30 (avoid false positives)
    * **Error Handling:**
        * Handle missing elements gracefully (return null, not error)
        * Log detection attempts and results for debugging (use `console.debug`)
        * Catch and handle DOM exceptions (SecurityError, InvalidAccessError)
        * Validate element visibility and interactivity before returning
    * **Performance:**
        * Cache detection results for current page (avoid re-scanning on every call)
        * Use `querySelectorAll` efficiently (specific selectors, not broad scans)
        * Limit MutationObserver scope to relevant DOM sections when possible
        * Set maximum retry attempts (default: 3) to prevent infinite loops
        * Implement early exit when high-confidence match is found
    * **Accessibility Considerations:**
        * Respect ARIA attributes (`aria-label`, `aria-labelledby`, `aria-describedby`)
        * Ensure detected elements are keyboard accessible (`:not([tabindex="-1"])`)
        * Check element visibility (not `display: none` or `visibility: hidden`)
* **Acceptance Criteria:**
    * ✅ Correctly identifies coupon input on test pages with various HTML structures:
        * Standard: `<input id="promo-code" type="text">`
        * Label-based: `<label for="discount">Discount Code</label><input id="discount">`
        * Class-based: `<input class="coupon-input" type="text">`
        * Data attribute: `<input data-coupon-field="true">`
    * ✅ Finds associated submit button within same form/container
    * ✅ Returns confidence score (0-100) for each detection
    * ✅ Handles retailer-specific `selectorConfig` with highest priority
    * ✅ Detects dynamically loaded elements using MutationObserver
    * ✅ Returns null for pages without coupon fields (no false positives)
    * ✅ Completes detection within 10 seconds or returns best match found
    * ✅ Caches results to avoid redundant DOM scans
* **Testing:**
    * **Unit Tests (Jest + jsdom):**
        * Mock DOM with various coupon field structures (attribute-based, label-based, class-based)
        * Test `findByRetailerConfig` with valid and invalid selectors
        * Test `findByAttributes` with keyword matching (case-insensitive, partial match)
        * Test `findByLabel` with label text containing keywords
        * Test `findSubmitButton` finds correct button in same container
        * Test `calculateConfidence` returns appropriate scores for different methods
        * Test `waitForElement` with simulated dynamic content insertion
        * Test caching mechanism: second call returns cached result
        * Test null return for pages without matching elements
    * **Integration Tests (E2E with test HTML pages):**
        * Create test HTML files simulating real retailer checkout pages:
            * `test-amazon-style.html` - Hidden promo field revealed by link
            * `test-simple-form.html` - Standard input with submit button
            * `test-dynamic-load.html` - Field loaded after 2-second delay
            * `test-no-coupon.html` - Page without any coupon field
        * Load content script in test environment
        * Verify correct detection on each test page
        * Verify confidence scores match expected values
        * Verify MutationObserver detects dynamically added elements
        * Verify no false positives on pages without coupon fields

### Story 4.2: The "Auto-Apply" Loop
* **Description:** Logic to iterate through coupons, input them, and submit.
* **AI Instructions:**
    * Create `client/src/contentScripts/applier.ts`.
    * Function `applyCoupons(coupons: string[], inputElement: HTMLElement, submitBtn: HTMLElement)`.
    * Loop Logic:
        1. Set `inputElement.value = coupons[i]`.
        2. Dispatch `new Event('input', { bubbles: true })` (React requires this).
        3. `submitBtn.click()`.
        4. Wait 2 seconds (or observe DOM mutation for price change).
        5. Record resulting price.
        6. Repeat.
* **Best Practices:**
    * Use `MutationObserver` rather than hardcoded `setTimeout` if possible to detect cart updates.
* **Documentation:**
    * Add a warning comment about rate limiting and anti-bot measures.

### Story 4.3: Feedback Loop API
* **Description:** Report which coupon worked back to the server.
* **AI Instructions:**
    * Create Backend Endpoint `POST /api/v1/coupons/:id/feedback`.
    * Body: `{ success: boolean }`.
    * Logic: Update `successCount` or `failureCount` in DB.
    * Frontend: After `applyCoupons` finishes, identify the code that gave the lowest price. Call this API endpoint.

---

# 📝 Technical Documentation & Handover

### How to use this with an AI CLI (e.g., Claude/Gemini)
1. **Context Loading:** Copy the "Tech Stack" and "Global Standards" into the chat first.
2. **Iterative Execution:** Copy **one Story at a time**. Do not ask the AI to do the whole PRD at once.
3. **Review:** Ask the AI to write the tests *before* writing the code (TDD style) to ensure adherence to requirements.

### Example Prompt for Story 2.1
> "Acting as a Senior Backend Engineer, please implement Story 2.1 from the PRD. We are using Node, Express, and Prisma. Create the schema, run the migration, and ensure the types are generated. Provide the code for `schema.prisma` and the terminal commands to run."
