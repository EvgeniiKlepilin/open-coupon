# CLAUDE.md - Project Context & Rules for AI Agents

## 1. Project Overview
**Name:** OpenCoupon
**Description:** An open-source, full-stack browser extension framework (Honey clone) that automatically applies coupon codes at checkout.
**Architecture:** Monorepo with separate client and server packages.
- `client/`: React + Vite (Chrome Extension Manifest V3)
- `server/`: Node.js + Express (REST API)

## 2. Tech Stack & Versions

### Frontend (Client)
- **React:** 19.1.0
- **TypeScript:** 5.8.3
- **Vite:** 7.0.5
- **Tailwind CSS:** 3.4.19
- **Chrome Extension:** Manifest V3 with @crxjs/vite-plugin 2.0.3
- **Testing:** Vitest 4.0.16, @testing-library/react 16.3.1
- **Linting:** ESLint 9.39.2, Prettier 3.7.4
- **Hooks:** Husky 9.1.7 (pre-commit)

### Backend (Server)
- **Node.js:** 20+
- **Express:** 5.2.1
- **TypeScript:** 5.9.3
- **Prisma ORM:** 7.1.0
- **PostgreSQL:** 15 (Dockerized)
- **Validation:** Zod 4.2.1
- **Testing:** Jest 30.2.0, ts-jest, Supertest 7.1.4
- **Rate Limiting:** express-rate-limit 8.2.1
- **Linting:** ESLint 9.39.2, Prettier 3.7.4
- **Hooks:** Husky 9.1.7

### Infrastructure
- **Database:** PostgreSQL 15-alpine (Docker)
- **Admin UI:** pgAdmin 4 (Docker, port 5050)
- **Package Manager:** npm (separate package.json files, NOT workspaces)

## 3. Common Commands

### Root Level
| Action | Command |
| :--- | :--- |
| **Start DB** | `docker compose up -d` |
| **Stop DB** | `docker compose down` |
| **View Logs** | `docker compose logs -f` |

### Client (`cd client`)
| Action | Command |
| :--- | :--- |
| **Dev Mode** | `npm run dev` |
| **Build Extension** | `npm run build` |
| **Run Tests** | `npm run test` |
| **Test UI** | `npm run test:ui` |
| **Test Coverage** | `npm run test:coverage` |
| **Lint** | `npm run lint` |
| **Preview Build** | `npm run preview` |

### Server (`cd server`)
| Action | Command |
| :--- | :--- |
| **Dev Mode** | `npm run dev` |
| **Build** | `npm run build` |
| **Run Tests** | `npm run test` |
| **Test Watch** | `npm run test:watch` |
| **Unit Tests Only** | `npm run test:unit` |
| **Integration Tests** | `npm run test:integration` |
| **Test Coverage** | `npm run test:coverage` |
| **Lint** | `npm run lint` |
| **Lint Fix** | `npm run lint:fix` |
| **Seed DB** | `npm run seed` |
| **Prisma Migrate** | `npx prisma migrate dev --name <name>` |
| **Prisma Studio** | `npx prisma studio` |

## 4. Coding Standards

### TypeScript Rules
- **Strict Mode:** Enabled in both client and server
- **noImplicitAny:** true
- **Interfaces:** Prefer `interface` over `type` for object definitions
- **Shared Types:** Define in `client/src/types/index.ts` or ensure Frontend imports from API response definitions
- **Explicit Returns:** All functions must have explicit return types
- **Path Aliases:** Client uses `@/*` → `src/*`
- **Additional Strictness (Server):** `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`

### Extension Specifics (Frontend)
- **Manifest V3:** Strictly adhere to MV3 limitations (no remote code execution)
- **Minimal Permissions:** Only `sidePanel`, `activeTab`, `storage`, `alarms`
- **DOM Safety:** When writing content scripts, verify elements exist before manipulating. Use optional chaining `?.` and `isValidDOMElement()` utility
- **Message Validation:** Use `isValidMessageSender()` for Chrome runtime message validation
- **State:** Use `chrome.storage.local` for persisting user preferences, NOT `localStorage`
- **Environment Config:** Use `config/index.ts` for environment-based API URLs (dev/prod)
- **Security:** Input sanitization via `utils/security.ts`, client-side rate limiting (20 req/min)

### Backend Specifics
- **Controller/Service Pattern:** Keep logic out of routes. Routes → Controllers → Services → Prisma
- **Error Handling:** Use `AppError` class from `lib/errors.ts` and error middleware. Never send raw stack traces to client in production
- **Validation:** Use Zod for all request body validation (see `validators/feedback.validator.ts`)
- **Rate Limiting:** express-rate-limit middleware (100/hour for feedback, 50/hour for batch)
- **Database:** Prisma Client singleton from `lib/db.ts`
- **Testing:** Mock database in tests using `__tests__/__mocks__/db.ts`

### Testing Standards
- **Backend Coverage Thresholds:**
  - Branches: 75%
  - Functions: 100%
  - Lines: 90%
  - Statements: 90%
- **Test Structure:** Separate unit tests (`services/`, `lib/`) from integration tests (`integration/`)
- **Frontend:** Use Vitest with React Testing Library, test utilities in `test/` directory
- **Backend:** 58 tests currently passing

## 5. Directory Structure Map

```text
/open-coupon
├── .claude/                    # Claude CLI configuration
├── client/                     # Frontend (Chrome Extension)
│   ├── public/                 # Static assets (logo.png)
│   ├── release/                # Production build archives
│   ├── dist/                   # Built extension (load in Chrome)
│   └── src/
│       ├── assets/             # Images and static resources
│       ├── background/         # Service worker
│       │   └── service-worker.ts
│       ├── components/         # Shared React components
│       │   └── HelloWorld.tsx
│       ├── config/             # Environment configuration
│       │   └── index.ts        # API URL management (dev/prod)
│       ├── content/            # Content scripts (auto-apply engine)
│       │   ├── components/     # UI components for content script
│       │   │   ├── AutoApplyOverlay.tsx
│       │   │   └── AutoApplyResult.tsx
│       │   ├── views/          # Content script views
│       │   │   └── App.tsx
│       │   ├── test-pages/     # Test HTML pages for development
│       │   ├── applier.ts      # Coupon auto-apply logic
│       │   ├── detector.ts     # Coupon field detection
│       │   ├── AutoApplyManager.tsx
│       │   ├── feedbackIntegration.ts
│       │   ├── main.tsx
│       │   ├── applier.test.ts
│       │   └── detector.test.ts
│       ├── popup/              # Extension popup UI
│       │   ├── components/     # Popup UI components
│       │   │   ├── CouponCard.tsx (+ .test.tsx)
│       │   │   ├── CouponList.tsx (+ .test.tsx)
│       │   │   ├── EmptyState.tsx (+ .test.tsx)
│       │   │   ├── ErrorState.tsx (+ .test.tsx)
│       │   │   └── LoadingState.tsx (+ .test.tsx)
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── services/           # API clients
│       │   ├── api.ts (+ .test.ts)
│       │   └── feedback.ts
│       ├── sidepanel/          # Chrome side panel UI
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── test/               # Test utilities
│       │   ├── setup.ts
│       │   ├── testUtils.tsx
│       │   └── mockData.ts
│       ├── types/              # TypeScript definitions
│       │   └── index.ts
│       └── utils/              # Utilities and helpers
│           ├── feedbackQueue.ts
│           ├── rateLimiter.ts
│           └── security.ts
├── server/                     # Backend (API)
│   ├── prisma/                 # Database schema and migrations
│   │   ├── migrations/         # Database migration files
│   │   ├── schema.prisma       # Database schema definition
│   │   └── seed.ts             # Database seeding script
│   └── src/
│       ├── __tests__/          # Test suite (58 tests)
│       │   ├── __mocks__/      # Mock implementations
│       │   │   └── db.ts
│       │   ├── integration/    # API endpoint tests
│       │   │   ├── api.test.ts
│       │   │   └── feedback.test.ts
│       │   ├── lib/            # Utility tests
│       │   │   └── errors.test.ts
│       │   ├── services/       # Service unit tests
│       │   │   ├── coupon.service.test.ts
│       │   │   └── feedback.service.test.ts
│       │   └── setup.ts
│       ├── controllers/        # Request handlers
│       │   └── coupon.controller.ts
│       ├── generated/          # Prisma generated client
│       ├── lib/                # Core utilities
│       │   ├── db.ts           # Prisma client singleton
│       │   └── errors.ts       # Custom error classes
│       ├── middleware/         # Express middleware
│       │   ├── error.middleware.ts
│       │   └── rateLimiter.ts
│       ├── routes/             # API routes
│       │   └── coupon.routes.ts
│       ├── services/           # Business logic
│       │   ├── coupon.service.ts
│       │   └── feedback.service.ts
│       ├── validators/         # Zod schemas
│       │   └── feedback.validator.ts
│       └── index.ts            # App entry point
├── .env                        # Root environment config
├── .env.example                # Environment template
├── docker-compose.yml          # PostgreSQL + pgAdmin
├── AGENTS.md                   # AI assistant instructions
├── CLAUDE.md                   # This file
├── GEMINI.md                   # Gemini-specific instructions
├── MASTER_PRD.md              # Product Requirements Document
└── README.md                   # Main documentation
```

## 6. Database Schema

### Retailer Model
```prisma
model Retailer {
  id             String   @id @default(uuid()) @db.Uuid
  domain         String   @unique
  name           String
  logoUrl        String?
  homeUrl        String?
  isActive       Boolean  @default(true)
  selectorConfig Json?    // Smart DOM selectors
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  coupons        Coupon[]

  @@index([domain])
  @@map("retailers")
}
```

### Coupon Model
```prisma
model Coupon {
  id            String    @id @default(uuid()) @db.Uuid
  code          String
  description   String
  successCount  Int       @default(0)
  failureCount  Int       @default(0)
  lastSuccessAt DateTime?
  lastTestedAt  DateTime?
  expiryDate    DateTime?
  source        String?   // "user-submission", "scraper-v1", "admin"
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  retailerId    String    @db.Uuid
  retailer      Retailer  @relation(fields: [retailerId], references: [id], onDelete: Cascade)

  @@unique([retailerId, code])
  @@index([retailerId])
  @@map("coupons")
}
```

## 7. API Endpoints

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| GET | `/health` | Health check | None |
| GET | `/api/v1/coupons?domain=<domain>` | Get coupons for domain | None |
| POST | `/api/v1/coupons/:id/feedback` | Submit single feedback | 100/hour |
| POST | `/api/v1/coupons/feedback/batch` | Submit batch feedback | 50/hour |

## 8. Environment Variables

### Root `.env`
```bash
POSTGRES_USER=admin
POSTGRES_PASSWORD=root
POSTGRES_DB=opencoupon_db
PGADMIN_DEFAULT_EMAIL=admin@opencoupon.com
PGADMIN_DEFAULT_PASSWORD=admin
```

### Client `.env` (`client/.env`)
```bash
VITE_API_BASE_URL=http://localhost:3030/api/v1
VITE_ENV=development
```

### Server `.env` (`server/.env`)
```bash
DATABASE_URL="postgresql://admin:root@localhost:5432/opencoupon_db"
PORT=3030
NODE_ENV=development
```

## 9. Key Implementation Files

### Content Script Engine (Auto-Apply Logic)
- `client/src/content/detector.ts` (14,950 bytes) - Multi-strategy coupon field detection
- `client/src/content/applier.ts` (23,520 bytes) - Auto-apply loop with price monitoring
- `client/src/content/AutoApplyManager.tsx` (8,297 bytes) - Orchestration layer
- `client/src/content/feedbackIntegration.ts` (4,270 bytes) - Feedback submission
- `client/src/content/components/AutoApplyOverlay.tsx` (6,343 bytes) - Progress UI
- `client/src/content/components/AutoApplyResult.tsx` (7,652 bytes) - Results modal

### Security & Utilities
- `client/src/utils/security.ts` - DOM validation, message sender validation, input sanitization
- `client/src/utils/rateLimiter.ts` - Client-side rate limiting (20 req/min)
- `client/src/utils/feedbackQueue.ts` - Feedback batching and queueing
- `server/src/middleware/rateLimiter.ts` - Server-side rate limiting

## 10. Development Workflow

1. **Start Database:** `docker compose up -d` (from root)
2. **Run Migrations:** `cd server && npx prisma migrate dev`
3. **Seed Database:** `cd server && npm run seed`
4. **Start Backend:** `cd server && npm run dev` (runs on port 3030)
5. **Start Frontend:** `cd client && npm run dev` (builds to `dist/`)
6. **Load Extension:** Chrome → Extensions → Load unpacked → select `client/dist/`
7. **Access pgAdmin:** http://localhost:5050 (for database management)

## 11. Testing Best Practices

### Frontend (Vitest)
- Place tests next to implementation files (e.g., `CouponCard.test.tsx`)
- Use test utilities from `client/src/test/testUtils.tsx`
- Mock Chrome APIs as needed
- Test UI components, API clients, and content script logic

### Backend (Jest)
- Unit tests in `__tests__/services/` and `__tests__/lib/`
- Integration tests in `__tests__/integration/`
- Mock Prisma client using `__tests__/__mocks__/db.ts`
- Maintain coverage thresholds: 75% branches, 100% functions, 90% lines/statements

## 12. Security Checklist

- Validate all user inputs with Zod schemas
- Use `isValidDOMElement()` before DOM manipulation
- Use `isValidMessageSender()` for Chrome message validation
- Implement rate limiting on both client and server
- Sanitize inputs using `utils/security.ts`
- Never expose stack traces in production
- Use minimal Chrome extension permissions
- Validate environment variables on startup

## 13. Important Notes

- **Express 5:** Note that the server uses Express 5.x, which has breaking changes from Express 4
- **React 19:** Client uses the latest React 19.1.0
- **No Workspaces:** Client and server use separate `package.json` files, not npm workspaces
- **Test Location:** Tests must be run from `client/` or `server/` directories, not root
- **Vitest vs Jest:** Frontend uses Vitest, backend uses Jest
- **Pre-commit Hooks:** Husky runs linting and formatting checks before commits
