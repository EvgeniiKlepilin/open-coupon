# OpenCoupon - Backend API (Server)

This directory contains the Node.js + Express backend API for OpenCoupon - a RESTful API that manages coupon data, tracks success rates, and provides feedback analytics.

## Architecture

The backend follows a **layered architecture** pattern for separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes (Express Routers)                            │   │
│  │  - Define HTTP endpoints                             │   │
│  │  - Handle request/response                           │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │  Controllers                                          │   │
│  │  - Request validation (Zod schemas)                  │   │
│  │  - Call service layer                                │   │
│  │  - Format responses                                  │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │  Services (Business Logic)                           │   │
│  │  - Coupon management                                 │   │
│  │  - Feedback processing                               │   │
│  │  - Analytics calculations                            │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │  Prisma ORM (Data Access Layer)                      │   │
│  │  - Type-safe database queries                        │   │
│  │  - Migrations                                        │   │
│  │  - Schema management                                 │   │
│  └────────────────────┬─────────────────────────────────┘   │
└────────────────────────┼──────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │   PostgreSQL     │
              │    Database      │
              └──────────────────┘
```

### Component Breakdown

#### 1. **Routes** (`src/routes/`)
HTTP endpoint definitions using Express Router.

- **`coupon.routes.ts`**: Coupon-related endpoints
  - `GET /api/v1/coupons` - Get coupons for a domain
  - `POST /api/v1/coupons` - Create new coupon
  - `DELETE /api/v1/coupons/:id` - Delete coupon

- **`feedback.routes.ts`**: Feedback endpoints
  - `POST /api/v1/feedback/:couponId` - Submit coupon feedback

#### 2. **Controllers** (`src/controllers/`)
Request validation and response formatting.

- **`coupon.controller.ts`**:
  - Validates request parameters with Zod schemas
  - Extracts domain from query params
  - Calls coupon service
  - Formats JSON responses

- **`feedback.controller.ts`**:
  - Validates feedback payloads
  - Rate limiting checks
  - Calls feedback service
  - Returns success/error responses

#### 3. **Services** (`src/services/`)
Business logic and data processing.

- **`coupon.service.ts`**:
  - `getCouponsForDomain()`: Fetches and sorts coupons by success rate
  - `createCoupon()`: Creates new coupon with validation
  - `deleteCoupon()`: Soft/hard deletes coupons
  - Smart sorting algorithm (success rate + recency)

- **`feedback.service.ts`**:
  - `processFeedback()`: Updates coupon success/failure counts
  - Increments `successCount` or `failureCount`
  - Updates `lastSuccessAt` timestamp
  - Validates coupon existence

#### 4. **Validators** (`src/validators/`)
Zod schemas for request validation.

- **`coupon.validator.ts`**:
  ```typescript
  const getCouponsSchema = z.object({
    domain: z.string().min(1).max(255),
  });

  const createCouponSchema = z.object({
    code: z.string().min(1).max(100),
    domain: z.string().min(1).max(255),
    description: z.string().optional(),
  });
  ```

- **`feedback.validator.ts`**:
  ```typescript
  const feedbackSchema = z.object({
    success: z.boolean(),
    discountAmount: z.number().min(0).optional(),
  });
  ```

#### 5. **Middleware** (`src/middleware/`)
Express middleware for cross-cutting concerns.

- **`errorHandler.ts`**: Global error handling
  - Catches all errors
  - Formats error responses
  - Logs errors (no stack traces in production)
  - Returns appropriate HTTP status codes

- **`rateLimiter.ts`**: API rate limiting
  - Express rate limiter middleware
  - 20 requests per minute for coupon endpoints
  - 50 requests per minute for feedback endpoints
  - Returns 429 Too Many Requests when exceeded

- **`cors.ts`**: CORS configuration
  - Allows requests from extension
  - Configurable allowed origins
  - Credentials support

## Project Structure

```
server/
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── coupon.controller.ts
│   │   └── feedback.controller.ts
│   ├── routes/             # API routes
│   │   ├── coupon.routes.ts
│   │   └── feedback.routes.ts
│   ├── services/           # Business logic
│   │   ├── coupon.service.ts
│   │   └── feedback.service.ts
│   ├── validators/         # Zod schemas
│   │   ├── coupon.validator.ts
│   │   └── feedback.validator.ts
│   ├── middleware/         # Express middleware
│   │   ├── errorHandler.ts
│   │   ├── rateLimiter.ts
│   │   └── cors.ts
│   ├── utils/              # Utilities
│   │   ├── logger.ts       # Logging utility
│   │   └── errors.ts       # Custom error classes
│   └── server.ts           # App entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Seed data script
├── tests/
│   ├── unit/               # Unit tests
│   │   ├── services/
│   │   └── validators/
│   └── integration/        # Integration tests
│       └── api/
├── .env                    # Environment variables
├── .env.example            # Environment template
├── tsconfig.json           # TypeScript config
├── jest.config.js          # Jest test config
└── package.json            # Dependencies and scripts
```

## Database Schema

### Coupon Model

```prisma
model Coupon {
  id            String   @id @default(uuid())
  code          String   @db.VarChar(100)
  domain        String   @db.VarChar(255)
  description   String?  @db.Text
  successCount  Int      @default(0)
  failureCount  Int      @default(0)
  lastSuccessAt DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([domain])
  @@index([successCount])
}
```

### Fields

- **`id`**: UUID primary key
- **`code`**: The coupon code (e.g., "SAVE20")
- **`domain`**: Website domain (e.g., "nike.com")
- **`description`**: Optional description
- **`successCount`**: Number of successful applications
- **`failureCount`**: Number of failed applications
- **`lastSuccessAt`**: Last successful application timestamp
- **`createdAt`**: Creation timestamp
- **`updatedAt`**: Last update timestamp

### Indexes

- `domain`: Fast lookups by website
- `successCount`: Optimized sorting by success rate

## API Endpoints

### GET /api/v1/coupons

Fetch coupons for a specific domain.

**Query Parameters**:
- `domain` (required): Website domain (e.g., "nike.com")

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "code": "SAVE20",
      "domain": "nike.com",
      "description": "20% off sitewide",
      "successCount": 45,
      "failureCount": 3,
      "lastSuccessAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Sorting**: Coupons are sorted by success rate (desc) and recency.

### POST /api/v1/coupons

Create a new coupon.

**Request Body**:
```json
{
  "code": "WELCOME10",
  "domain": "example.com",
  "description": "10% off first order"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "code": "WELCOME10",
    "domain": "example.com",
    "description": "10% off first order",
    "successCount": 0,
    "failureCount": 0,
    "lastSuccessAt": null,
    "createdAt": "2024-01-15T12:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

### POST /api/v1/feedback/:couponId

Submit feedback for a coupon test.

**URL Parameters**:
- `couponId` (required): UUID of the coupon

**Request Body**:
```json
{
  "success": true,
  "discountAmount": 15.50
}
```

**Response**:
```json
{
  "success": true,
  "message": "Feedback recorded successfully"
}
```

**Rate Limit**: 50 requests per minute

### DELETE /api/v1/coupons/:id

Delete a coupon.

**URL Parameters**:
- `id` (required): UUID of the coupon

**Response**:
```json
{
  "success": true,
  "message": "Coupon deleted successfully"
}
```

## Setup and Development

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15 (via Docker)

### Installation

1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Start PostgreSQL database**
   ```bash
   # From project root
   docker compose up -d
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```

   Edit `.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/opencoupon?schema=public"
   PORT=3030
   NODE_ENV=development
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Seed database** (optional)
   ```bash
   npm run seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

   Server runs at `http://localhost:3030`

### Development Commands

```bash
# Start development server (with hot reload)
npm run dev

# Run database migrations
npx prisma migrate dev --name <migration-name>

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database with sample data
npm run seed

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Test coverage report
npm run test:coverage

# Lint code
npm run lint

# Type check
npm run build
```

## Testing

### Unit Tests

Test individual services and utilities in isolation.

**Example** (`coupon.service.test.ts`):
```typescript
describe('CouponService', () => {
  describe('getCouponsForDomain', () => {
    it('should return coupons sorted by success rate', async () => {
      const coupons = await couponService.getCouponsForDomain('nike.com');

      expect(coupons).toHaveLength(3);
      expect(coupons[0].successCount).toBeGreaterThanOrEqual(coupons[1].successCount);
    });
  });
});
```

### Integration Tests

Test full API endpoints with database.

**Example** (`coupon.routes.test.ts`):
```typescript
describe('GET /api/v1/coupons', () => {
  it('should return 200 with coupons for valid domain', async () => {
    const response = await request(app)
      .get('/api/v1/coupons?domain=nike.com')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('should return 400 for missing domain', async () => {
    await request(app)
      .get('/api/v1/coupons')
      .expect(400);
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

Current coverage: **>85%**

- Controllers: >90%
- Services: >85%
- Validators: 100%
- Routes: >80%

## Database Management

### Migrations

Create a new migration when schema changes:

```bash
npx prisma migrate dev --name add_coupon_tags
```

Apply migrations to production:

```bash
npx prisma migrate deploy
```

### Prisma Studio

Visual database editor:

```bash
npx prisma studio
```

Opens at `http://localhost:5555`

### Seeding

Populate database with sample data:

```bash
npm run seed
```

Seeds:
- 50+ coupons across 10 domains
- Realistic success/failure counts
- Sample descriptions

## Deployment

### Production Build

1. **Set environment variables**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL="postgresql://user:pass@host:5432/db"
   export PORT=3030
   ```

2. **Build TypeScript**
   ```bash
   npm run build
   ```

3. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start server**
   ```bash
   npm start
   ```

### Docker Deployment

**Dockerfile**:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
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

# Optional
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

## Security

### Input Validation

All inputs validated with Zod schemas:
- Type checking
- Length limits
- Format validation
- SQL injection prevention

### Rate Limiting

API endpoints are rate-limited:
- Coupon endpoints: 20 req/min per IP
- Feedback endpoints: 50 req/min per IP

### CORS

Configured to allow requests only from:
- Extension origin (development: `chrome-extension://...`)
- Configured domains (production)

### Error Handling

- No stack traces exposed in production
- Generic error messages to prevent info disclosure
- All errors logged server-side

### Database Security

- Prepared statements (Prisma prevents SQL injection)
- Connection pooling
- Encrypted connections in production

## Monitoring and Logging

### Logging

Winston logger with different levels:

```typescript
logger.info('Coupon created', { couponId, domain });
logger.warn('Rate limit exceeded', { ip, endpoint });
logger.error('Database error', { error, query });
```

**Log Levels**:
- `error`: Critical errors
- `warn`: Warnings
- `info`: General info
- `debug`: Debug details (dev only)

### Health Check

```bash
GET /api/v1/health
```

Returns:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00Z",
  "uptime": 3600
}
```

## Contributing

We welcome backend contributions!

### Contribution Areas

- **API Endpoints**: Add new endpoints for features
- **Database Schema**: Improve schema design
- **Performance**: Optimize database queries
- **Testing**: Increase test coverage
- **Documentation**: Improve API docs

### Development Workflow

1. Fork repository
2. Create feature branch
3. Write tests for new features
4. Implement feature
5. Run tests: `npm test`
6. Run linter: `npm run lint`
7. Create Pull Request

### Code Style

- **TypeScript**: Strict mode enabled
- **Async/Await**: Use async/await over callbacks
- **Error Handling**: Always use try/catch
- **Comments**: JSDoc for public functions
- **Formatting**: Prettier (2 spaces)

## License

MIT License - see [../LICENSE](../LICENSE) for details.

---

**Need Help?** Check the [main README](../README.md) or open an issue on GitHub.
