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
* **Description:** Configure the core extension manifest.
* **AI Instructions:**
    * Create `client/manifest.json`.
    * Set `manifest_version: 3`.
    * Permissions: `activeTab`, `storage`, `scripting`.
    * Host Permissions: `*://*/*` (or specific API URL).
    * Action: Set `default_popup` to `index.html`.
    * Background: Set `service_worker` to the build output file.
* **Acceptance Criteria:**
    * Build generates a folder loadable in Chrome `chrome://extensions`.

### Story 3.2: Popup UI - Coupon List
* **Description:** A React component that fetches and displays coupons for the current tab.
* **AI Instructions:**
    * Use `chrome.tabs.query` to get current active tab URL.
    * Fetch `http://localhost:3000/api/v1/coupons?domain={currentUrl}`.
    * Render a list of coupons.
    * Component: `CouponCard` (displays Code, Success Rate, "Copy" button).
    * Styling: Use Tailwind for a clean card layout.
* **Testing:**
    * Mock `chrome.tabs` and `fetch`. Verify list renders correct number of items.

---

# 📑 Feature PRD 4: The Injection Engine (The "Honey" Logic)

**Goal:** Inject code into the retailer's checkout page to detect input fields and apply coupons.

### Story 4.1: Input Field Detection (Heuristics)
* **Description:** A content script that scans the DOM to find the "Promo Code" input box.
* **AI Instructions:**
    * Create `client/src/contentScripts/detector.ts`.
    * Implement function `findCouponInput()`:
        * Query all `input[type="text"]`.
        * Filter by attributes (id, name, placeholder, aria-label) containing keywords: `['coupon', 'promo', 'discount', 'voucher']`.
        * Return the specific DOM element reference.
* **Acceptance Criteria:**
    * Script correctly identifies the input box on a test HTML page with `<input id="promo-code">`.

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
