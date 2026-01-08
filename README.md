<div align="center">
  <img src="client/src/assets/logo.png" alt="OpenCoupon Logo" width="200"/>

# OpenCoupon

### Open-Source Framework for Building Transparent Coupon Browser Extensions

  <p>
    <strong>Build transparent, user-first coupon extensions without predatory practices!</strong><br/>
    A full-stack, production-ready framework for automatic coupon application at checkout,<br/>
    designed with ethics, privacy, and transparency at its core.
  </p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/EvgeniiKlepilin/open-coupon/actions/workflows/ci.yml/badge.svg)](https://github.com/EvgeniiKlepilin/open-coupon/actions/workflows/ci.yml)
[![Ethics First](https://img.shields.io/badge/Ethics-First-purple.svg)](#️-ethical-considerations)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-61dafb.svg)](https://reactjs.org/)
[![Node](https://img.shields.io/badge/Node-20+-green.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/EvgeniiKlepilin/open-coupon/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/EvgeniiKlepilin/open-coupon)](https://github.com/EvgeniiKlepilin/open-coupon/commits/main)
[![Issues](https://img.shields.io/github/issues/EvgeniiKlepilin/open-coupon)](https://github.com/EvgeniiKlepilin/open-coupon/issues)

[Features](#-features) •
[Quick Start](#-quick-start) •
[Documentation](#-documentation) •
[Architecture](#-architecture) •
[Ethical Guidelines](#-ethical-considerations) •
[Contributing](#-contributing)

</div>

---

## 🎯 What is OpenCoupon?

OpenCoupon is an **open-source, ethical framework** for building browser extensions that automatically apply coupon codes at checkout. Unlike commercial alternatives that have faced criticism for predatory practices, OpenCoupon is built on transparency, user privacy, and fair attribution. Perfect for developers who want to:

- 🛍️ **Create a coupon extension** for specific retailers or niches
- ⚖️ **Build ethically** without cookie stuffing or hidden affiliate tracking
- 🔧 **Customize** the user experience and branding
- 📊 **Own your data** and respect user privacy
- 🌟 **Learn** modern full-stack development with real-world applications
- 🚀 **Deploy** a production-ready, transparent Chrome extension

### Why OpenCoupon?

- ✅ **Ethical by Design**: Built to avoid predatory practices like cookie stuffing and hidden tracking
- ✅ **Transparent & Open**: Full source code visibility, no hidden agendas
- ✅ **Privacy-First**: No cross-site tracking, minimal data collection, GDPR-ready
- ✅ **Production-Ready**: Security-hardened, tested, and optimized
- ✅ **Modern Stack**: React 19, TypeScript 5, Manifest V3, Prisma
- ✅ **Full-Stack**: Complete backend API + Chrome Extension
- ✅ **Well-Documented**: Comprehensive guides and inline documentation
- ✅ **Extensible**: Clean architecture for easy customization

---

## ✨ Features

### 🎨 User Features

- **Automatic Coupon Detection**: Intelligently finds coupon input fields on checkout pages
- **Auto-Apply Loop**: Tests all available coupons to find the best discount
- **Real-Time Progress**: Beautiful UI showing coupon testing progress
- **Smart Sorting**: Prioritizes coupons by success rate and recency
- **Feedback System**: Crowdsourced intelligence improves recommendations
- **Privacy-Focused**: No personal data collection, anonymous usage stats only

### 🔧 Developer Features

- **Chrome Extension Manifest V3**: Latest extension standards
- **Content Scripts**: DOM manipulation with safety checks
- **Background Service Workers**: Reliable background processing
- **Popup UI**: Clean React-based user interface
- **RESTful API**: Node.js + Express backend
- **PostgreSQL Database**: Scalable data storage with Prisma ORM
- **Rate Limiting**: Client and server-side protection
- **Comprehensive Tests**: 190 total tests (132 client + 58 server)
- **Security Hardened**: Input validation, sanitization, minimal permissions
- **CI/CD Pipeline**: Automated testing, linting, and build verification via GitHub Actions

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Docker** & Docker Compose ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))
- **Chrome Browser** (for testing the extension)

### Installation

Get up and running in 5 simple steps using our monorepo setup:

1. **Clone and install**

   ```bash
   git clone https://github.com/EvgeniiKlepilin/open-coupon.git
   cd open-coupon
   npm install    # Installs all dependencies for client + server
   ```

2. **Set up the database**

   ```bash
   npm run db:up       # Start PostgreSQL in Docker
   npm run db:migrate  # Run database migrations
   npm run db:seed     # Populate with sample coupon data
   ```

3. **Configure environment** (optional - defaults work for development)

   ```bash
   # Client config (optional)
   cp client/.env.example client/.env

   # Server config (optional)
   cp server/.env.example server/.env
   ```

4. **Start development servers**

   ```bash
   npm run dev    # Starts both client and server simultaneously
   ```

   The backend API will run on `http://localhost:3030` and the extension will build to `client/dist/`

5. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `client/dist` folder
   - The extension icon should appear in your toolbar!

6. **Test it out**
   - Visit any e-commerce site included in the seed data (e.g., amazon.com, ebay.com)
   - Navigate to a checkout page
   - Click the OpenCoupon extension icon and hit the "Auto-Apply" button
   - Watch it automatically find and test coupons! 🎉

### Quick Commands Reference

```bash
npm run dev          # Start both client & server
npm run db:up        # Start database
npm run db:down      # Stop database
npm run db:seed      # Reseed database
npm test             # Run all tests (190 tests)
npm run lint         # Lint all code
npm run format       # Format all code
```

See [Common Commands](#common-commands) for the full list.

---

## 📚 Documentation

### Component READMEs

- **[Frontend Documentation](./client/README.md)** - Chrome Extension setup, architecture, and development
- **[Backend Documentation](./server/README.md)** - API endpoints, database schema, and deployment

### Key Concepts

<details>
<summary><b>How Auto-Apply Works</b></summary>

1. **Detection Phase**: Content script scans the page for coupon input fields using multiple strategies:
   - Retailer-specific CSS selectors
   - Keyword-based heuristics
   - Label association
   - Attribute scanning

2. **Testing Phase**: For each coupon:
   - Apply the coupon code
   - Monitor price changes via MutationObserver
   - Detect success/failure messages
   - Track discount amount

3. **Selection Phase**:
   - Compare all successful coupons
   - Select the one with highest discount
   - Display results to user

4. **Feedback Phase**:
   - Send anonymous feedback to backend
   - Update success/failure counts
   - Improve future recommendations
   </details>

<details>
<summary><b>Security Features</b></summary>

- **Message Sender Validation**: Prevents unauthorized messages
- **DOM Element Validation**: XSS prevention via origin checks
- **Input Sanitization**: All user/API inputs validated
- **Rate Limiting**: 20 API req/min, 50 feedback req/min
- **Minimal Permissions**: Only activeTab, storage, alarms
- **Error Sanitization**: No information disclosure
- **Environment-Based Config**: Separate dev/prod URLs
</details>

<details>
<summary><b>Tech Stack</b></summary>

**Frontend (Chrome Extension)**

- React 19 with TypeScript 5
- Vite 7 for building
- Tailwind CSS for styling
- Chrome Extension Manifest V3
- Vitest for testing

**Backend (API Server)**

- Node.js 20+ with Express 5
- TypeScript 5
- Prisma ORM
- PostgreSQL 15
- Zod for validation
- Jest for testing

**DevOps & Tooling**

- Docker & Docker Compose
- GitHub Actions (CI/CD)
- ESLint 9 (flat config) + Prettier 3.7
- Husky 9.1 for pre-commit hooks
- npm workspaces (monorepo)
</details>

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph Extension["Chrome Extension"]
        Popup["Popup UI<br/>(React)"]
        Content["Content Scripts<br/>(Auto-Apply Engine)"]
        Background["Background Worker<br/>(Service Worker)"]

        Popup <-->|chrome.runtime| Background
        Popup -->|chrome.runtime| Content
        Background -->|chrome.runtime| Content
    end

    subgraph Backend["Backend Server"]
        Routes["Routes<br/>(Express)"]
        Controllers["Controllers<br/>(Validation)"]
        Services["Services<br/>(Business Logic)"]
        Prisma["Prisma ORM"]

        Routes --> Controllers
        Controllers --> Services
        Services --> Prisma
    end

    Database[("PostgreSQL<br/>Database")]

    Extension -->|REST API<br/>HTTP/JSON| Backend
    Prisma <--> Database

    style Extension fill:#e3f2fd
    style Backend fill:#fff3e0
    style Database fill:#ffebee
    style Popup fill:#bbdefb
    style Content fill:#bbdefb
    style Background fill:#bbdefb
    style Routes fill:#ffe0b2
    style Controllers fill:#ffe0b2
    style Services fill:#ffe0b2
    style Prisma fill:#ffe0b2
```

### Data Flow

1. **Extension** → User clicks "Find Coupons"
2. **Content Script** → Detects coupon field, fetches coupons from API
3. **Backend API** → Returns coupons sorted by success rate
4. **Content Script** → Auto-applies coupons, monitors results
5. **Feedback Service** → Sends success/failure data back to API
6. **Database** → Updates coupon statistics for future users

---

## ⚖️ Ethical Considerations

This project is built to provide a **transparent, user-first alternative** to commercial coupon extensions. Following the [MegaLag investigation series](https://www.youtube.com/@MegaLag) that exposed predatory practices in popular coupon extensions, OpenCoupon is designed to empower developers to build **ethical, honest tools** that serve users—not exploit them.

Developers using this framework should adhere to the following ethical guidelines:

### 1. Fair Attribution & "Stand Down" Policy

**Respect Content Creators**

- ❌ **No Cookie Stuffing**: If a user has already clicked an influencer's affiliate link, your extension **must stand down** and not overwrite that cookie with its own
- ✅ **Transparent Rewards**: If the extension provides cashback/points, clearly disclose if that reward is funded by a commission that might otherwise have gone to a content creator
- ❌ **No Hidden Tabs**: Never open background or hidden tabs to refresh affiliate cookies without the user's explicit knowledge and consent

### 2. Merchant & Small Business Integrity

**Respect Private Codes**

- ❌ Don't scrape or share discount codes clearly intended for specific audiences (e.g., one-time welcome codes, employee-only codes, influencer-specific codes)
- ✅ Provide a clear opt-out path for merchants to request their store be excluded from your database
- ❌ **No Extortion**: Don't gate "code control" behind paid partnerships. If a merchant reports an invalid code, remove it regardless of their affiliate status

### 3. Data Privacy & Transparency

**Zero-Knowledge by Default**

- ✅ Only collect data necessary to find coupons
- ❌ Don't track cross-site browsing history or purchase habits to sell to third-party ad networks
- ✅ **Explicit Consent**: Ask permission before activating "Rewards" or "Cashback" features that track purchases
- ✅ **GDPR/CCPA Compliance**: Ensure users can easily view, export, or delete their data

### 4. Protection of Minors

**Age-Appropriate Practices**

- ❌ Don't market the extension to minors or encourage children to install tracking software
- ✅ Ensure COPPA compliance—don't collect data from users under 13

### 5. The "Best Deal" Promise

**Honest Sorting**

- ✅ If you claim to find the "best deal," prioritize codes that provide the highest discount to the user
- ❌ Don't prioritize codes that pay higher commissions over better user discounts
- ✅ **Disclosure of Partnerships**: Clearly label "Partner" or "Sponsored" codes if promoted over others

### Why This Matters

The MegaLag investigation series ([Part 1](https://www.youtube.com/watch?v=vc4yL3YTwWk) • [Part 2](https://www.youtube.com/watch?v=wwB3FmbcC88) • [Part 3](https://www.youtube.com/watch?v=qCGT_CKGgFE)) exposed how browser extensions can move from being "helpful tools" to "predatory middlemen" engaging in:

- **Cookie stuffing** that steals attribution from content creators
- **Hidden affiliate tracking** without user knowledge
- **Prioritizing profit over user benefit**
- **Manipulation of merchant relationships**

**By following these guidelines, you ensure that your implementation of OpenCoupon remains a tool for consumer empowerment rather than a mechanism for attribution theft.**

> 💡 **OpenCoupon's Commitment**: OpenCoupon is built with ethical defaults. The codebase intentionally excludes affiliate tracking mechanisms and cookie manipulation features. If you choose to add such features to your fork, we urge you to do so transparently and ethically.

---

## 🛠️ Development

### Monorepo Architecture

OpenCoupon uses **npm workspaces** to manage the client and server packages in a single repository. This approach:

- 📦 Shares dependencies (TypeScript, ESLint, Prettier, Husky) at the root level
- 🔄 Enables running commands across all packages simultaneously
- 🚀 Simplifies development with unified build, test, and lint commands
- 📝 Maintains a single `package-lock.json` for consistent dependencies

**Run commands from root:** `npm run <command>` affects all workspaces
**Target specific workspace:** `npm run <command> --workspace=client` or `npm run <command> -w server`

### Project Structure

```
open-coupon/
├── .github/             # GitHub Actions workflows
│   └── workflows/
│       └── ci.yml       # CI/CD pipeline
├── .husky/              # Git hooks configuration
│   └── pre-commit       # Pre-commit checks
├── client/              # Chrome Extension (Frontend)
│   ├── src/
│   │   ├── background/  # Service worker
│   │   ├── content/     # Content scripts (auto-apply logic)
│   │   ├── popup/       # Extension popup UI
│   │   ├── sidepanel/   # Chrome side panel UI
│   │   ├── services/    # API clients
│   │   ├── test/        # Test utilities and setup
│   │   ├── types/       # TypeScript definitions
│   │   └── utils/       # Helpers, validation, security
│   ├── public/          # Static assets
│   └── dist/            # Built extension (load this in Chrome)
│
├── server/              # Backend API
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Rate limiting, error handling
│   │   ├── validators/  # Zod schemas
│   │   ├── lib/         # Core utilities (db, errors)
│   │   └── __tests__/   # Test suite (58 tests)
│   └── prisma/          # Database schema & migrations
│
├── docker-compose.yml   # PostgreSQL + pgAdmin
├── .prettierrc          # Code formatting config
├── .prettierignore      # Files excluded from formatting
├── eslint.config.js     # Linting configuration
├── MASTER_PRD.md        # Product requirements document
├── CONTRIBUTING.md      # Contribution guidelines
└── CODE_OF_CONDUCT.md   # Community guidelines
```

### Common Commands

```bash
# Run from root (recommended)
npm run dev              # Start both client and server
npm test                 # Run all tests (190 tests)
npm run build            # Build both packages
npm run lint             # Lint all code
npm run format           # Format all code with Prettier
npm run format:check     # Check code formatting

# Backend
cd server
npm run dev              # Start development server
npm test                 # Run all tests (58 tests)
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests
npm run seed             # Populate database with sample data
npm run lint             # Check code style

# Frontend
cd client
npm run dev              # Start development build (watch mode)
npm run build            # Production build
npm test                 # Run tests (132 tests)
npm run test:ui          # Interactive test UI
npm run lint             # Check code style

# Database
docker compose up -d     # Start PostgreSQL
docker compose down      # Stop database
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Run migrations
```

### Environment Configuration

**Client** (`client/.env`):

```bash
VITE_API_BASE_URL=http://localhost:3030/api/v1
VITE_ENV=development
```

**Server** (`server/.env`):

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/opencoupon?schema=public"
PORT=3030
NODE_ENV=development
```

---

## 🧪 Testing

The project includes comprehensive test coverage:

```bash
# Backend tests (58 tests)
cd server
npm run test:unit         # Unit tests (services, utilities)
npm run test:integration  # Integration tests (API endpoints)
npm run test:coverage     # Generate coverage report

# Frontend tests (132 tests)
cd client
npm test                  # Run Vitest tests
npm run test:ui          # Interactive test UI
npm run test:coverage    # Generate coverage report

# Run all tests from root
npm test                  # Runs both client and server tests
```

**Current Test Coverage:**

- ✅ 190/190 Total tests passing (132 client + 58 server)
- ✅ Client: Content script tests, API client tests, UI component tests
- ✅ Server: API endpoint integration tests, service layer unit tests
- ✅ Validation schema tests and error handling tests
- ✅ Coverage thresholds: 75% branches, 100% functions, 90% lines/statements (server)

---

## 🔄 Continuous Integration

The project uses **GitHub Actions** for automated quality checks on every push and pull request:

**CI Pipeline Steps:**

1. ✅ Dependency installation with npm cache
2. ✅ Prisma client generation
3. ✅ Build verification (client + server)
4. ✅ Unit test suite execution
5. ✅ Code linting
6. ✅ Code formatting validation (Prettier)

**Workflow File:** `.github/workflows/ci.yml`

The CI pipeline ensures code quality and prevents regressions by running the complete test suite and enforcing code style standards before merging.

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or enhancing tests, your help makes OpenCoupon better for everyone.

**Before contributing, please read our [Contributing Guidelines](CONTRIBUTING.md)** for detailed information on:

- 🛠️ Development setup and workflow
- 📋 Coding standards and style guide
- 🧪 Testing requirements (190 tests)
- 💬 Commit message conventions
- 🔄 Pull request process
- ⚖️ Ethical guidelines for contributions
- 🤖 CI/CD pipeline requirements

### Quick Contribution Checklist

✅ Fork and clone the repository
✅ Create a feature branch
✅ Follow TypeScript and code style guidelines (ESLint 9 + Prettier 3.7)
✅ Add tests for new features (maintain >75% coverage)
✅ Ensure all 190 tests pass (`npm test`)
✅ Verify linting passes with zero warnings (`npm run lint`)
✅ Check formatting (`npm run format:check`)
✅ Write clear commit messages (Conventional Commits)
✅ Ensure CI/CD pipeline passes
✅ Align with our [ethical guidelines](#️-ethical-considerations)

### Areas We'd Love Help With

🌟 **High Priority:** UI/UX improvements, Mobile browser support, Firefox extension port

💡 **Feature Ideas:** Multi-language support, Coupon expiry tracking, Analytics dashboard

📝 **Documentation:** Architecture diagrams, API documentation, Deployment guides

**👉 See the full [Contributing Guide](CONTRIBUTING.md) to get started!**

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**TL;DR**: You can use this code for personal or commercial projects, modify it, and distribute it. Just keep the copyright notice.

---

## 🙏 Acknowledgments

**Special Thanks**

A huge thank you to [MegaLag](https://www.youtube.com/@MegaLag) for his groundbreaking investigative journalism exposing predatory practices in the browser extension industry. His three-part series on Honey was instrumental in inspiring this project's ethical foundation:

- [Part 1: The Dark Side of Browser Extensions](https://www.youtube.com/watch?v=vc4yL3YTwWk)
- [Part 2: How Honey Steals Commissions](https://www.youtube.com/watch?v=wwB3FmbcC88)
- [Part 3: The Bigger Picture](https://www.youtube.com/watch?v=qCGT_CKGgFE)

This investigation revealed how extensions meant to help users can transform into tools that exploit both consumers and content creators. OpenCoupon exists to provide a transparent alternative.

**Additional Credits**

- Inspired by the concept of browser coupon extensions, but built with transparency and ethics first
- Built with modern web technologies and industry best practices
- Community contributors who help maintain ethical standards

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/EvgeniiKlepilin/open-coupon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/EvgeniiKlepilin/open-coupon/discussions)

---

<div align="center">
  <p>
    <strong>Star ⭐ this repository if you find it useful!</strong><br/>
    Built with curiosity, transparency, and ❤️
  </p>

  <p>
    <a href="#-quick-start">Get Started</a> •
    <a href="#️-ethical-considerations">Ethical Guidelines</a> •
    <a href="./client/README.md">Frontend Docs</a> •
    <a href="./server/README.md">Backend Docs</a> •
    <a href="https://github.com/EvgeniiKlepilin/open-coupon/issues">Report Bug</a> •
    <a href="https://github.com/EvgeniiKlepilin/open-coupon/issues">Request Feature</a>
  </p>
</div>
