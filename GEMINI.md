# GEMINI.md - Project Context & Rules

## 1. Project Overview
**Name:** OpenCoupon
**Description:** An open-source, full-stack browser extension framework (Honey clone) that automatically applies coupon codes at checkout.
**Architecture:** Monorepo.
- `client/`: React + Vite (Chrome Extension Manifest V3).
- `server/`: Node.js + Express (REST API).

## 2. Tech Stack & Versions
- **Frontend:** React 18, TypeScript 5, Vite, Tailwind CSS, Chrome Extension APIs.
- **Backend:** Node.js 20+, Express, TypeScript, Prisma ORM.
- **Database:** PostgreSQL 15 (Dockerized).
- **Testing:** Jest, React Testing Library, Supertest.
- **Package Manager:** npm (Workspaces or separate package.json files).

## 3. Common Commands
| Action | Context | Command |
| :--- | :--- | :--- |
| **Start DB** | Root | `docker compose up -d` |
| **Start Backend** | Server | `cd server && npm run dev` |
| **Start Frontend** | Client | `cd client && npm run dev` |
| **Build Ext.** | Client | `cd client && npm run build` |
| **DB Migration** | Server | `npx prisma migrate dev --name <name>` |
| **DB Studio** | Server | `npx prisma studio` |
| **Test All** | Root | `npm test` (if configured) or run per folder |
| **Lint** | Root | `npm run lint` |

## 4. Coding Standards
### TypeScript Rules
- **Strict Mode:** Enabled. `noImplicitAny` is TRUE.
- **Interfaces:** Prefer `interface` over `type` for object definitions.
- **Shared Types:** If a type is used by both FE and BE (e.g., `Coupon`), define it in a shared types definition or ensure the Frontend imports the type from the API response definition.
- **Explicit Returns:** All functions must have explicit return types.

### Extension Specifics (Frontend)
- **Manifest V3:** strictly adhere to MV3 limitations (no remote code execution).
- **DOM Safety:** When writing content scripts (injectors), verify elements exist before manipulating. Use optional chaining `?.`.
- **State:** Use `chrome.storage.local` for persisting user preferences, NOT `localStorage`.

### Backend Specifics
- **Controller/Service Pattern:** Keep logic out of routes. Routes -> Controllers -> Services -> Prisma.
- **Error Handling:** Use a central `AppError` class and middleware. Never send raw stack traces to the client in production.
- **Validation:** Use Zod or Joi for request body validation.

## 5. Directory Structure Map
```text
/opencoupon
├── /client             # Frontend (Extension)
│   ├── /src
│   │   ├── /components # UI Components
│   │   ├── /content    # Content Scripts (The Injection Engine)
│   │   ├── /background # Service Workers
│   │   └── /popup      # Main UI
├── /server             # Backend (API)
│   ├── /src
│   │   ├── /controllers
│   │   ├── /routes
│   │   └── /services
├── /docker-compose.yml
└── CLAUDE.md

