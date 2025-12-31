<div align="center">
  <img src="client/src/assets/logo.png" alt="OpenCoupon Logo" width="200"/>

  # OpenCoupon

  ### Open-Source Framework for Building Coupon Browser Extensions

  <p>
    <strong>Build your own Honey-like coupon extension with ease!</strong><br/>
    A full-stack, production-ready framework for automatic coupon application at checkout.
  </p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19.1-61dafb.svg)](https://reactjs.org/)
  [![Node](https://img.shields.io/badge/Node-20+-green.svg)](https://nodejs.org/)
  [![Tests](https://img.shields.io/badge/Tests-58%20Passing-success.svg)](https://github.com/EvgeniiKlepilin/open-coupon)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/EvgeniiKlepilin/open-coupon/pulls)

  [Features](#-features) •
  [Quick Start](#-quick-start) •
  [Documentation](#-documentation) •
  [Architecture](#-architecture) •
  [Contributing](#-contributing)

</div>

---

## 🎯 What is OpenCoupon?

OpenCoupon is an **open-source framework** that lets you build your own browser extension for automatic coupon application - similar to Honey, but fully customizable and under your control. Perfect for developers who want to:

- 🛍️ **Create a coupon extension** for specific retailers or niches
- 🔧 **Customize** the user experience and branding
- 📊 **Own your data** and control the backend
- 🌟 **Learn** modern full-stack development with real-world applications
- 🚀 **Deploy** a production-ready Chrome extension

### Why OpenCoupon?

- ✅ **Production-Ready**: Security-hardened, tested, and optimized
- ✅ **Modern Stack**: React 19, TypeScript 5, Manifest V3, Prisma
- ✅ **Full-Stack**: Complete backend API + Chrome Extension
- ✅ **Well-Documented**: Comprehensive guides and inline documentation
- ✅ **Extensible**: Clean architecture for easy customization
- ✅ **Privacy-First**: No tracking, no telemetry, full transparency

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
- **Comprehensive Tests**: 58 unit and integration tests
- **Security Hardened**: Input validation, sanitization, minimal permissions

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Docker** & Docker Compose ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))
- **Chrome Browser** (for testing the extension)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/EvgeniiKlepilin/open-coupon.git
   cd open-coupon
   ```

2. **Start the database** (PostgreSQL in Docker)
   ```bash
   docker compose up -d
   ```

3. **Set up the backend**
   ```bash
   cd server
   npm install
   npm run seed    # Seed database with sample data
   npm run dev     # Start development server
   ```

4. **Set up the frontend** (in a new terminal)
   ```bash
   cd client
   npm install
   cp .env.example .env    # Create environment config
   npm run dev             # Start development build
   ```

5. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `client/dist` folder
   - The extension icon should appear in your toolbar!

6. **Test it out**
   - Seed the database with coupons for specific domains
   - Visit any e-commerce sites for which you have created coupons
   - Navigate to checkout
   - Click the OpenCoupon extension icon and Auto-Apply button
   - Watch it find and test coupons automatically! 🎉

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

**DevOps**
- Docker & Docker Compose
- ESLint + Prettier
- Husky for pre-commit hooks
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

## 🛠️ Development

### Project Structure

```
open-coupon/
├── client/              # Chrome Extension (Frontend)
│   ├── src/
│   │   ├── background/  # Service worker
│   │   ├── content/     # Content scripts (auto-apply logic)
│   │   ├── popup/       # Extension popup UI
│   │   ├── services/    # API clients
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
│   │   └── validators/  # Zod schemas
│   └── prisma/          # Database schema & migrations
│
├── docker-compose.yml   # PostgreSQL database
└── MASTER_PRD.md       # Product requirements document
```

### Common Commands

```bash
# Backend
cd server
npm run dev              # Start development server
npm test                 # Run all tests (58 tests)
npm run seed             # Populate database with sample data
npm run lint             # Check code style

# Frontend
cd client
npm run dev              # Start development build (watch mode)
npm run build            # Production build
npm test                 # Run tests
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

# Frontend tests
cd client
npm test                  # Run Vitest tests
npm run test:ui          # Interactive test UI
npm run test:coverage    # Generate coverage report
```

**Current Test Coverage:**
- ✅ 58/58 Backend tests passing
- ✅ API endpoint integration tests
- ✅ Service layer unit tests
- ✅ Validation schema tests
- ✅ Error handling tests

---

## 🤝 Contributing

Contributions are welcome! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/open-coupon.git
   cd open-coupon
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed
   - Run `npm run lint` to check code style
   - Run `npm test` to ensure tests pass

4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Describe your changes in detail

### Contribution Guidelines

- **Code Style**: Follow TypeScript best practices, use ESLint/Prettier
- **Tests**: Add tests for new features, maintain >80% coverage
- **Documentation**: Where applicable, update READMEs and inline comments
- **Commits**: Use clear, descriptive commit messages
- **PRs**: One feature per PR, include screenshots for UI changes
- **Issues**: Check existing issues before creating new ones

### Development Setup

See [Quick Start](#-quick-start) for detailed setup instructions.

### Areas for Contribution

🌟 **High Priority:**
- UI/UX improvements
- Mobile browser support
- Firefox extension port

💡 **Feature Ideas:**
- Multi-language support
- Coupon expiry tracking
- Browser sync across devices
- Analytics dashboard
- Coupon and Retailer Management platform

📝 **Documentation:**
- Architecture diagrams
- API documentation
- Deployment guides

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**TL;DR**: You can use this code for personal or commercial projects, modify it, and distribute it. Just keep the copyright notice.

---

## 🙏 Acknowledgments

- Inspired by [Honey](https://www.joinhoney.com/) and other coupon extensions
- Built with modern web technologies and best practices

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/EvgeniiKlepilin/open-coupon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/EvgeniiKlepilin/open-coupon/discussions)

---

<div align="center">
  <p>
    <strong>Star ⭐ this repository if you find it useful!</strong><br/>
    Built with curiosity and ❤️
  </p>

  <p>
    <a href="#-quick-start">Get Started</a> •
    <a href="./client/README.md">Frontend Docs</a> •
    <a href="./server/README.md">Backend Docs</a> •
    <a href="https://github.com/EvgeniiKlepilin/open-coupon/issues">Report Bug</a> •
    <a href="https://github.com/EvgeniiKlepilin/open-coupon/issues">Request Feature</a>
  </p>
</div>
