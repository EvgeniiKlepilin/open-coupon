# Contributing to OpenCoupon

Thank you for your interest in contributing to OpenCoupon! We're building an ethical, transparent alternative to commercial coupon extensions, and we welcome contributions that align with this mission.

## 📦 Monorepo Project

OpenCoupon uses **npm workspaces** to manage the client (Chrome Extension) and server (API) as a unified monorepo. This means:

- Install dependencies once from the root: `npm install`
- Run commands across all packages: `npm test`, `npm run lint`, `npm run build`
- Target specific workspaces: `npm test -w client` or `npm run dev:server`

This guide will show you how to leverage the monorepo structure for efficient development.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Ethical Guidelines](#ethical-guidelines)
- [Community](#community)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Docker** & Docker Compose ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))
- **Chrome Browser** (for testing the extension)

### Development Setup

OpenCoupon uses **npm workspaces** (monorepo architecture), which means you can run commands from the root to manage both client and server packages simultaneously.

1. **Fork the repository**

   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/open-coupon.git
   cd open-coupon
   ```

2. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/EvgeniiKlepilin/open-coupon.git
   ```

3. **Install all dependencies** (from root)

   ```bash
   npm install  # Installs dependencies for both client and server
   ```

4. **Start the database**

   ```bash
   docker compose up -d
   ```

5. **Run database migrations and seed**

   ```bash
   npm run db:migrate  # Run Prisma migrations
   npm run db:seed     # Seed database with sample data
   ```

6. **Start development servers** (both client and server)

   ```bash
   npm run dev  # Starts both client and server in watch mode
   ```

   Alternatively, start them separately:

   ```bash
   # Terminal 1 - Backend
   npm run dev:server

   # Terminal 2 - Frontend
   npm run dev:client
   ```

7. **Load the extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `client/dist` folder
   - The extension icon should appear in your toolbar!

### Recommended Development Workflow

Once set up, use these commands during development:

```bash
# Terminal 1: Run both client and server in watch mode
npm run dev

# Terminal 2: Run tests as you code
npm test -- --watch  # or npm run test:watch in specific workspace

# Before committing
npm run format       # Format all code
npm run lint         # Check for linting issues
npm test             # Run all 190 tests
npm run build        # Verify build succeeds
```

**Pro Tip:** Husky pre-commit hooks will automatically run linting and formatting checks before each commit, catching issues early!

## How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes**
- ✨ **New features**
- 📝 **Documentation improvements**
- 🧪 **Test coverage improvements**
- 🎨 **UI/UX enhancements**
- ♿ **Accessibility improvements**
- 🌐 **Translations** (future)
- 🔒 **Security enhancements**

### Finding Issues to Work On

- Check [Issues](https://github.com/EvgeniiKlepilin/open-coupon/issues) labeled `good first issue`
- Look for `help wanted` tags
- Review [Discussions](https://github.com/EvgeniiKlepilin/open-coupon/discussions) for feature ideas

### Reporting Bugs

Before submitting a bug report:

1. **Search existing issues** to avoid duplicates
2. **Verify the bug** in the latest version
3. **Collect information**:
   - Operating system and version
   - Node.js and npm versions
   - Browser version
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots (if applicable)

Submit bugs via [GitHub Issues](https://github.com/EvgeniiKlepilin/open-coupon/issues/new) using the bug report template.

### Suggesting Features

Before suggesting a feature:

1. **Check existing discussions** and issues
2. **Ensure it aligns** with our [ethical guidelines](#ethical-guidelines)
3. **Describe the problem** it solves
4. **Outline the solution** you envision

Submit feature requests via [GitHub Discussions](https://github.com/EvgeniiKlepilin/open-coupon/discussions/new).

## Coding Standards

### TypeScript Guidelines

- **Strict Mode**: Enabled. All code must pass strict type checking
- **No `any`**: Use proper types or `unknown` with type guards
- **Interfaces over types**: Prefer `interface` for object shapes
- **Explicit return types**: All functions must declare return types
- **Path aliases**: Use `@/*` imports in client code

### Code Style

We use **ESLint 9** (flat config) and **Prettier 3.7** to maintain consistent code style. Husky pre-commit hooks automatically enforce linting and formatting before commits.

```bash
# Run from root (recommended)
npm run lint          # Lint all code (zero warnings required)
npm run format        # Format all code with Prettier
npm run format:check  # Check formatting without modifying files

# Or run per workspace
cd server
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues

cd client
npm run lint          # Check for issues
```

**Key conventions:**

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Line length**: 120 characters (Prettier configured)
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for classes and React components
  - `SCREAMING_SNAKE_CASE` for constants
  - Prefix private methods with `_`

### Project-Specific Guidelines

**Frontend (Chrome Extension)**

- Use Manifest V3 APIs only
- Verify DOM elements exist before manipulation
- Use `chrome.storage.local` (not `localStorage`)
- Validate all message senders
- Follow React Hooks best practices

**Backend (API)**

- Follow Routes → Controllers → Services → Prisma pattern
- Use Zod for request validation
- Always use error middleware
- Never expose stack traces in production
- Use Prisma Client singleton from `lib/db.ts`

## Testing Requirements

All contributions must include appropriate tests. The project currently has **190 tests passing** (132 client + 58 server).

### Running All Tests

```bash
# Run all tests from root (recommended)
npm test  # Runs both client (132 tests) and server (58 tests)
```

### Backend Testing

```bash
cd server

# Run all backend tests (58 tests)
npm test

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only

# Run with coverage
npm run test:coverage
```

**Requirements:**

- New features must have unit tests
- API endpoints must have integration tests
- Maintain coverage thresholds:
  - Branches: 75%
  - Functions: 100%
  - Lines: 90%
  - Statements: 90%

### Frontend Testing

```bash
cd client

# Run all frontend tests (132 tests)
npm test

# Run with interactive UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

**Requirements:**

- UI components must have component tests
- Complex logic (content scripts, services) must have unit tests
- Use test utilities from `client/src/test/testUtils.tsx`
- Follow React Testing Library best practices

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Examples

```bash
feat(client): add dark mode toggle to settings

Implement dark mode with system preference detection and
manual override. Preferences are persisted to chrome.storage.

Closes #123

---

fix(server): prevent SQL injection in coupon search

Replace string concatenation with parameterized queries
to prevent SQL injection vulnerabilities.

BREAKING CHANGE: API now requires domain parameter to be URL-encoded

---

docs(readme): add installation troubleshooting section
```

### Commit Best Practices

- Use imperative mood ("add feature" not "added feature")
- Keep subject line under 72 characters
- Capitalize subject line
- No period at end of subject line
- Separate subject from body with blank line
- Wrap body at 72 characters
- Explain what and why, not how

## Pull Request Process

### Before Submitting

1. **Sync with upstream**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   # or
   git checkout -b fix/critical-bug
   ```

3. **Make your changes**
   - Follow coding standards
   - Add tests
   - Update documentation

4. **Test thoroughly**

   ```bash
   # Run from root (recommended)
   npm test             # Run all tests (190 tests)
   npm run lint         # Lint all code
   npm run format:check # Check formatting
   npm run build        # Verify build succeeds

   # Or test individually
   cd server && npm test && npm run lint
   cd client && npm test && npm run lint
   ```

5. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

### Submitting the PR

1. Go to the [original repository](https://github.com/EvgeniiKlepilin/open-coupon)
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template completely
5. Link related issues (e.g., "Closes #123")

### PR Requirements

✅ **Required for merge:**

- All tests passing (190 tests)
- No linting errors (zero warnings required)
- No formatting issues (Prettier check passes)
- Code coverage maintained or improved
- Documentation updated (if applicable)
- Commit messages follow guidelines
- PR description is complete
- Aligns with [ethical guidelines](#ethical-guidelines)
- **CI/CD pipeline passes** (GitHub Actions)

### CI/CD Pipeline

All pull requests automatically trigger the GitHub Actions CI workflow (`.github/workflows/ci.yml`):

**Automated Checks:**

1. ✅ Dependency installation with npm cache
2. ✅ Prisma client generation
3. ✅ Build verification (client + server)
4. ✅ Test suite execution (unit tests)
5. ✅ Code linting (zero warnings enforced)
6. ✅ Code formatting validation (Prettier)

**All checks must pass before your PR can be merged.**

### Review Process

1. **Automated checks** run via GitHub Actions CI
2. **Maintainer review** within 3-5 business days
3. **Address feedback** if requested
4. **Approval & merge** once all checks pass and code is approved

## Ethical Guidelines

**Critical Requirement**: All contributions must align with our [ethical guidelines](README.md#️-ethical-considerations).

### ❌ We Will NOT Accept

- Features that enable cookie stuffing or affiliate hijacking
- Hidden affiliate tracking without user consent
- Code that prioritizes commission over user benefit
- Features that scrape private or targeted discount codes
- Any form of deceptive user tracking
- Code that targets or collects data from minors

### ✅ We Encourage

- Privacy-enhancing features
- Transparent user controls
- Accessibility improvements
- User-first discount optimization
- Merchant-respectful code handling
- GDPR/CCPA compliance improvements

### Questions About Ethics?

If you're unsure whether a contribution aligns with our guidelines, please open a discussion **before** implementing it. We're happy to provide guidance!

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: Questions, ideas, and general discussion
- **Pull Requests**: Code contributions

### Getting Help

If you need help:

1. Check the [README](README.md) and component READMEs
2. Search [existing issues](https://github.com/EvgeniiKlepilin/open-coupon/issues)
3. Ask in [Discussions](https://github.com/EvgeniiKlepilin/open-coupon/discussions)
4. Reach out to maintainers via GitHub

### Recognition

Contributors are recognized in several ways:

- Listed in GitHub's contributors graph
- Mentioned in release notes (for significant contributions)
- Community appreciation and acknowledgment

## Questions?

Don't hesitate to ask! We're here to help you contribute successfully.

- Open a [Discussion](https://github.com/EvgeniiKlepilin/open-coupon/discussions)
- Comment on an [Issue](https://github.com/EvgeniiKlepilin/open-coupon/issues)

---

**Thank you for contributing to OpenCoupon! Together, we're building a transparent, ethical alternative to commercial coupon extensions.** 🎉
