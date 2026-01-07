# OpenCoupon - Backend API (Server)

This directory contains the Node.js + Express backend API for OpenCoupon - a RESTful API that manages coupon data, tracks success rates, and provides feedback analytics.

**Part of the OpenCoupon monorepo** - This package is managed using npm workspaces alongside the Chrome Extension client. See the [main README](../README.md) for monorepo setup instructions.

## Architecture

The backend follows a **layered architecture** pattern for separation of concerns:

```mermaid
graph TD
    A[HTTP Request] --> B[Express Router]
    B --> C[Controller Layer]
    C --> D{Validation}
    D -->|Valid| E[Service Layer]
    D -->|Invalid| F[Error Response]
    E --> G[Prisma ORM]
    G --> H[(PostgreSQL Database)]
    H --> G
    G --> E
    E --> C
    C --> I[JSON Response]

    style B fill:#4CAF50
    style C fill:#2196F3
    style E fill:#FF9800
    style G fill:#9C27B0
    style H fill:#F44336
```

### Component Breakdown

#### 1. **Routes** (`src/routes/`)

HTTP endpoint definitions using Express Router.

- **`coupon.routes.ts`**: All API endpoints
  - `GET /api/v1/coupons?domain=example.com` - Get coupons for a domain
  - `POST /api/v1/coupons/:id/feedback` - Submit coupon feedback
  - `POST /api/v1/coupons/feedback/batch` - Submit batch feedback

#### 2. **Controllers** (`src/controllers/`)

Request validation and response formatting.

- **`coupon.controller.ts`**:
  - `getCoupons()` - Validates domain query parameter and fetches coupons
  - `submitCouponFeedback()` - Validates feedback payload with Zod schemas
  - `submitBatchCouponFeedback()` - Validates batch feedback payload

#### 3. **Services** (`src/services/`)

Business logic and data processing.

- **`coupon.service.ts`**:
  - `getCouponsByDomain()` - Fetches coupons for a retailer domain
  - `extractHostname()` - Normalizes domain strings (removes www, protocols)
  - Sorts coupons by success count (descending)

- **`feedback.service.ts`**:
  - `recordCouponFeedback()` - Updates coupon success/failure counts atomically
  - `recordBatchCouponFeedback()` - Processes multiple feedback items
  - `calculateSuccessRate()` - Calculates percentage success rate

#### 4. **Validators** (`src/validators/`)

Zod schemas for request validation.

- **`feedback.validator.ts`**:

  ```typescript
  const feedbackRequestSchema = z.object({
    success: z.boolean(),
    metadata: z.object({
      discountAmount: z.number().nonnegative().optional(),
      discountPercentage: z.number().min(0).max(100).optional(),
      failureReason: z.enum([...]).optional(),
      domain: z.string().min(1),
      testDurationMs: z.number().nonnegative(),
      detectionMethod: z.enum([...]),
      testedAt: z.string().datetime(),
    }).optional(),
  });

  const batchFeedbackRequestSchema = z.object({
    feedback: z.array(batchFeedbackItemSchema).min(1).max(100),
  });
  ```

#### 5. **Middleware** (`src/middleware/`)

Express middleware for cross-cutting concerns.

- **`error.middleware.ts`**: Global error handling
  - `errorHandler()` - Catches all errors and formats responses
  - `notFoundHandler()` - Handles 404 errors for undefined routes
  - Logs errors with stack traces in development
  - Returns generic errors in production

- **`rateLimiter.ts`**: API rate limiting
  - `feedbackRateLimiter` - 100 requests per hour per IP
  - `batchFeedbackRateLimiter` - 50 requests per hour per IP
  - Returns 429 Too Many Requests with Retry-After header

#### 6. **Library** (`src/lib/`)

Core utilities and database client.

- **`errors.ts`**: Custom error classes
  - `AppError` - Base error class
  - `NotFoundError` - 404 errors
  - `BadRequestError` - 400 errors
  - `TooManyRequestsError` - 429 errors
  - `InternalServerError` - 500 errors

- **`db.ts`**: Prisma client singleton
  - Exports configured database client
  - Manages connection pooling

## Project Structure

```
server/
├── src/
│   ├── controllers/          # Request handlers
│   │   └── coupon.controller.ts
│   ├── routes/               # API routes
│   │   └── coupon.routes.ts
│   ├── services/             # Business logic
│   │   ├── coupon.service.ts
│   │   └── feedback.service.ts
│   ├── validators/           # Zod schemas
│   │   └── feedback.validator.ts
│   ├── middleware/           # Express middleware
│   │   ├── error.middleware.ts
│   │   └── rateLimiter.ts
│   ├── lib/                  # Core utilities
│   │   ├── db.ts             # Prisma client
│   │   └── errors.ts         # Custom error classes
│   ├── __tests__/            # Tests
│   │   ├── integration/      # API endpoint tests
│   │   ├── services/         # Service unit tests
│   │   └── lib/              # Utility tests
│   └── index.ts              # App entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Database migrations
│   └── seed.ts               # Seed data script
├── .env                      # Environment variables
├── .env.example              # Environment template
├── tsconfig.json             # TypeScript config
├── jest.config.js            # Jest test config
└── package.json              # Dependencies and scripts
```

## Database Schema

The database uses two models with a one-to-many relationship:

### Retailer Model

```prisma
model Retailer {
  id             String   @id @default(uuid())
  domain         String   @unique           // e.g., "nike.com"
  name           String                     // e.g., "Nike"
  logoUrl        String?                    // Brand logo URL
  homeUrl        String?                    // Homepage URL
  isActive       Boolean  @default(true)    // Whether retailer is active
  selectorConfig Json?                      // DOM selectors for coupon fields
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  coupons        Coupon[]                   // One-to-many relationship

  @@index([domain])
}
```

**Key Features:**

- `selectorConfig`: Stores retailer-specific DOM selectors (e.g., `{"input": "#promo-code", "submit": ".btn-apply"}`)
- `isActive`: Allows disabling retailers without deletion
- Indexed by `domain` for fast lookups

### Coupon Model

```prisma
model Coupon {
  id            String    @id @default(uuid())
  code          String                      // Coupon code (e.g., "SAVE20")
  description   String                      // Human-readable description
  successCount  Int       @default(0)       // Number of successful applications
  failureCount  Int       @default(0)       // Number of failed applications
  lastSuccessAt DateTime?                   // Last successful application
  lastTestedAt  DateTime?                   // Last time coupon was tested
  expiryDate    DateTime?                   // Optional expiration date
  source        String?                     // Origin (e.g., "user-submission", "scraper-v1")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  retailerId    String                      // Foreign key to Retailer
  retailer      Retailer  @relation(fields: [retailerId], references: [id], onDelete: Cascade)

  @@unique([retailerId, code])              // Prevent duplicate codes per retailer
  @@index([retailerId])                     // Fast lookups by retailer
}
```

**Key Features:**

- Atomic updates prevent race conditions on counts
- `lastSuccessAt` helps sort "fresh" coupons
- `lastTestedAt` helps identify stale coupons
- Cascade delete: deleting a retailer removes all its coupons
- Unique constraint ensures no duplicate codes per retailer

## API Endpoints

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok"
}
```

### GET /api/v1/coupons

Fetch coupons for a specific domain.

**Query Parameters:**

- `domain` (required): Website domain (e.g., "nike.com", "https://www.nike.com", "www.nike.com")

**Response:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "SAVE20",
      "description": "20% off sitewide",
      "successCount": 45,
      "failureCount": 3,
      "lastSuccessAt": "2024-01-15T10:30:00Z",
      "lastTestedAt": "2024-01-16T12:00:00Z",
      "expiryDate": null,
      "source": "user-submission",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "retailerId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
    }
  ]
}
```

**Sorting**: Coupons are sorted by `successCount` (descending) - most successful first.

**Error Responses:**

- `400 Bad Request` - Missing or invalid domain parameter
- `404 Not Found` - No retailer found for domain or retailer is inactive

### POST /api/v1/coupons/:id/feedback

Submit feedback for a single coupon test.

**URL Parameters:**

- `id` (required): UUID of the coupon

**Request Body:**

```json
{
  "success": true,
  "metadata": {
    "discountAmount": 15.5,
    "discountPercentage": 20,
    "domain": "nike.com",
    "testDurationMs": 1250,
    "detectionMethod": "price-change",
    "testedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Metadata Fields (all optional except domain, testDurationMs, detectionMethod, testedAt):**

- `discountAmount`: Dollar amount saved (e.g., 15.50)
- `discountPercentage`: Percentage discount (0-100)
- `failureReason`: Enum - "expired" | "invalid" | "minimum-not-met" | "out-of-stock" | "other"
- `domain`: Website domain where coupon was tested (required)
- `testDurationMs`: How long the test took in milliseconds (required)
- `detectionMethod`: How success/failure was detected (required)
  - "price-change" | "success-message" | "failure-message" | "timeout"
- `testedAt`: ISO 8601 timestamp when coupon was tested (required)

**Response:**

```json
{
  "success": true,
  "message": "Feedback recorded successfully",
  "updatedCoupon": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "successCount": 46,
    "failureCount": 3,
    "successRate": 94,
    "lastSuccessAt": "2024-01-15T10:30:00Z",
    "lastTestedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Rate Limit:** 100 requests per hour per IP

**Error Responses:**

- `400 Bad Request` - Invalid request body or coupon ID format
- `404 Not Found` - Coupon not found
- `429 Too Many Requests` - Rate limit exceeded (includes Retry-After header)

### POST /api/v1/coupons/feedback/batch

Submit feedback for multiple coupons in a single request (efficient for auto-apply loops).

**Request Body:**

```json
{
  "feedback": [
    {
      "couponId": "550e8400-e29b-41d4-a716-446655440000",
      "success": true,
      "metadata": {
        "discountAmount": 15.5,
        "domain": "nike.com",
        "testDurationMs": 1250,
        "detectionMethod": "price-change",
        "testedAt": "2024-01-15T10:30:00Z"
      }
    },
    {
      "couponId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "success": false,
      "metadata": {
        "failureReason": "expired",
        "domain": "nike.com",
        "testDurationMs": 800,
        "detectionMethod": "failure-message",
        "testedAt": "2024-01-15T10:31:00Z"
      }
    }
  ]
}
```

**Constraints:**

- Minimum 1 feedback item
- Maximum 100 feedback items per batch

**Response:**

```json
{
  "success": true,
  "message": "Processed 2 feedback items, 0 failed",
  "processed": 2,
  "failed": 0,
  "results": [
    {
      "couponId": "550e8400-e29b-41d4-a716-446655440000",
      "success": true
    },
    {
      "couponId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "success": true
    }
  ]
}
```

**If some items fail:**

```json
{
  "success": true,
  "message": "Processed 1 feedback items, 1 failed",
  "processed": 1,
  "failed": 1,
  "results": [
    {
      "couponId": "550e8400-e29b-41d4-a716-446655440000",
      "success": true
    },
    {
      "couponId": "invalid-uuid",
      "success": false,
      "error": "Invalid coupon ID format. Must be a valid UUID."
    }
  ]
}
```

**Rate Limit:** 50 requests per hour per IP (stricter due to batch size)

**Error Responses:**

- `400 Bad Request` - Invalid request body (validation error details included)
- `429 Too Many Requests` - Rate limit exceeded

## Setup and Development

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 (via Docker)

### Installation

**Recommended: Install from root** (installs both client and server):

```bash
# From project root
npm install
```

**Or install server only**:

```bash
cd server
npm install
```

**Start PostgreSQL database**:

```bash
# From project root
docker compose up -d
```

**Configure environment**:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/opencoupon?schema=public"
PORT=3030
NODE_ENV=development
```

**Run database migrations**:

```bash
# From root
npm run db:migrate

# Or from server directory
npx prisma migrate dev
```

**Seed database** (optional - adds sample retailers and coupons):

```bash
# From root
npm run db:seed

# Or from server directory
npm run seed
```

**Start development server**:

```bash
# From server directory
npm run dev

# Or from root (starts both client and server)
npm run dev
```

Server runs at `http://localhost:3030`

### Development Commands

**From server directory**:

```bash
# Start development server (with hot reload via tsx watch)
npm run dev

# Run database migrations
npx prisma migrate dev --name <migration-name>

# Generate Prisma Client (after schema changes)
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database with sample data
npm run seed

# Run all tests (58 tests)
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Test coverage report
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npx tsc --noEmit
```

**From root** (affects both client and server):

```bash
npm run dev              # Start both client and server
npm test                 # Run all tests (190 tests)
npm run lint             # Lint all code
npm run format           # Format all code with Prettier
npm run build            # Build both packages
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
```

## Testing

The server has **58 passing tests** covering services, utilities, and API endpoints.

### Unit Tests

Test individual services and utilities in isolation using **Jest 30.2** with ts-jest.

**Example** (`coupon.service.test.ts`):

```typescript
describe('CouponService', () => {
  describe('getCouponsByDomain', () => {
    it('should return coupons for valid domain', async () => {
      const coupons = await getCouponsByDomain('nike.com');
      expect(coupons).toBeInstanceOf(Array);
    });

    it('should throw NotFoundError for invalid domain', async () => {
      await expect(getCouponsByDomain('invalid.com')).rejects.toThrow(NotFoundError);
    });
  });
});
```

**Example** (`feedback.service.test.ts`):

```typescript
describe('FeedbackService', () => {
  describe('recordCouponFeedback', () => {
    it('should increment successCount for successful feedback', async () => {
      const result = await recordCouponFeedback(couponId, true);
      expect(result.successCount).toBe(initialSuccessCount + 1);
    });
  });
});
```

### Integration Tests

Test full API endpoints with database.

**Example** (`api.test.ts`):

```typescript
describe('GET /api/v1/coupons', () => {
  it('should return 200 with coupons for valid domain', async () => {
    const response = await request(app).get('/api/v1/coupons?domain=nike.com').expect(200);

    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('should return 400 for missing domain', async () => {
    await request(app).get('/api/v1/coupons').expect(400);
  });
});
```

### Running Tests

```bash
# Run all tests (58 tests)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test file
npm test -- coupon.service.test.ts
```

### Test Coverage

Current coverage: **>85%** with strict thresholds enforced:

- Branches: 75%
- Functions: 100%
- Lines: 90%
- Statements: 90%

**By Component:**

- Controllers: >90%
- Services: >85%
- Validators: 100%
- Error handling: >80%

## CI/CD Pipeline

The server is part of the automated CI/CD pipeline using **GitHub Actions**:

**Automated Checks on Every Push/PR:**

- ✅ Dependency installation with npm cache
- ✅ Prisma client generation
- ✅ Build verification
- ✅ Unit test suite execution (58 tests)
- ✅ Code linting (ESLint 9, zero warnings enforced)
- ✅ Code formatting validation (Prettier 3.7)

**Workflow File:** `.github/workflows/ci.yml`

**Note:** CI runs unit tests only (not integration tests) to keep build time short while maintaining core coverage.

All checks must pass before PRs can be merged. See [main README](../README.md) for full CI/CD details.

## Database Management

### Migrations

Create a new migration when schema changes:

```bash
npx prisma migrate dev --name add_coupon_source_field
```

Apply migrations to production:

```bash
npx prisma migrate deploy
```

### Prisma Studio

Visual database editor (opens at `http://localhost:5555`):

```bash
npx prisma studio
```

### Seeding

Populate database with sample retailers and coupons:

```bash
npm run seed
```

Seeds:

- 10 popular retailers (Nike, Amazon, Target, etc.)
- 50+ coupons across all retailers
- Realistic success/failure counts
- Sample descriptions and metadata

## Deployment

### Production Build

1. **Set environment variables**

   ```bash
   export NODE_ENV=production
   export DATABASE_URL="postgresql://user:pass@host:5432/db"
   export PORT=3030
   ```

2. **Install dependencies**

   ```bash
   npm ci --only=production
   ```

3. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

4. **Run migrations**

   ```bash
   npx prisma migrate deploy
   ```

5. **Build TypeScript**

   ```bash
   npm run build
   ```

6. **Start server**
   ```bash
   npm start
   ```

### Docker Deployment

**Dockerfile**:

```dockerfile
FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 3030
CMD ["npm", "start"]
```

**Build and run**:

```bash
docker build -t opencoupon-api .
docker run -p 3030:3030 --env-file .env opencoupon-api
```

### Environment Variables

Required in production:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
PORT=3030
```

## Security

### Input Validation

All inputs validated with Zod schemas:

- Type checking (boolean, number, string, UUID)
- Length limits (max 100 items per batch)
- Format validation (UUID, datetime, enum values)
- SQL injection prevention via Prisma prepared statements

### Rate Limiting

API endpoints are rate-limited per IP address:

- Feedback endpoint: 100 requests per hour
- Batch feedback endpoint: 50 requests per hour
- Returns 429 with `Retry-After: 3600` header when exceeded

### Error Handling

- No stack traces exposed in production
- Generic error messages prevent information disclosure
- All errors logged server-side with full details
- Operational errors (4xx) vs programming errors (5xx)

### Database Security

- Prepared statements (Prisma prevents SQL injection)
- Connection pooling for efficiency
- UUID primary keys (prevents enumeration attacks)
- Foreign key constraints ensure referential integrity
- Cascade deletes maintain data consistency

## Monitoring and Logging

### Logging

Console logging with structured output:

```typescript
console.log('Server is running on http://localhost:3030');
console.error('Error:', {
  message: err.message,
  statusCode,
  stack: err.stack,
  path: req.path,
  method: req.method,
});
```

**Production Recommendation:** Replace console.log with structured logger (Winston, Pino, etc.)

### Health Check

```bash
GET /health
```

Returns:

```json
{
  "status": "ok"
}
```

**Production Recommendation:** Enhance health check to include database connectivity test.

## Contributing

We welcome backend contributions!

**Before contributing, please read the [Contributing Guidelines](../CONTRIBUTING.md)** for detailed information on:

- Development setup and workflow
- Coding standards (TypeScript strict mode, ESLint 9 + Prettier 3.7)
- Testing requirements (maintain 58 tests, >85% coverage)
- Commit message conventions
- Pull request process
- CI/CD pipeline requirements

### Quick Contribution Checklist

✅ Follow TypeScript strict mode and async/await patterns
✅ Add tests for new features (Jest + Supertest)
✅ Maintain coverage thresholds (75% branches, 100% functions, 90% lines)
✅ Run `npm run format` before committing
✅ Ensure all tests pass (`npm test` - 58 tests)
✅ Verify linting passes with zero warnings (`npm run lint`)
✅ Use Conventional Commits format
✅ Ensure CI pipeline passes

### Priority Areas

- **API Endpoints**: Add endpoints for creating/deleting coupons, managing retailers
- **Database Schema**: Add fields for coupon categories, user submissions
- **Performance**: Optimize database queries, add caching layer (Redis)
- **Testing**: Increase test coverage, add E2E tests
- **Documentation**: API documentation with OpenAPI/Swagger

**See [CONTRIBUTING.md](../CONTRIBUTING.md) for complete guidelines.**

## License

MIT License - see [../LICENSE](../LICENSE) for details.

---

**Need Help?** Check the [main README](../README.md) or open an issue on GitHub.
