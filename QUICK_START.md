# Sales API MVP - Quick Start Guide

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Edit .env with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=store_hub
# DB_USER=postgres
# DB_PASSWORD=yourpassword

# 4. Create database tables
psql -U postgres -d postgres -f database-schema-final.sql
```

## Running the API

### Development
```bash
npm run dev
# Server runs on http://localhost:3000
```

### Production
```bash
npm run build
npm start
```

### Tests
```bash
npm test
```

## API Examples

### 1. Create Sales (POST)
```bash
curl -X POST http://localhost:3000/v1/sales \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "store_id": 1,
    "date": "2026-08-18",
    "total_revenue": 1500.00,
    "cash_payment": 1000.00,
    "card_payment": 500.00
  }'

# Response (201 Created):
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "version": 1,
    "total_revenue": 1500.00,
    ...
  }
}
```

### 2. Get Sales (GET)
```bash
curl http://localhost:3000/v1/sales/550e8400-e29b-41d4-a716-446655440000 \
  -H "x-user-id: 1"

# Response (200 OK):
{
  "success": true,
  "data": { ... }
}
```

### 3. Update Sales (PUT - Optimistic Locking)
```bash
curl -X PUT http://localhost:3000/v1/sales/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "x-user-id: 1" \
  -d '{
    "total_revenue": 2000.00,
    "cash_payment": 1200.00,
    "card_payment": 800.00,
    "version": 1
  }'

# Response (200 OK):
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "version": 2,  // Auto-incremented
    ...
  }
}

# If version mismatch (409 Conflict):
{
  "success": false,
  "error": {
    "code": "CONFLICT_ERROR",
    "message": "Version conflict: expected 2, got 1"
  }
}
```

## Key Features

- **Optimistic Locking**: Version field prevents concurrent update conflicts
- **Validation**: Zod schemas with cross-field checks
- **Audit Logging**: All changes logged with timestamps
- **Error Handling**: Proper HTTP status codes (400, 404, 409, 500)
- **Transactions**: Database ACID compliance
- **TypeScript**: Full type safety

## Files Structure

```
src/
├── controllers/sales-controller.ts    - Express routes
├── services/sales-service.ts          - Business logic
├── validators/sales-validator.ts      - Zod validation
├── models/types.ts                    - TypeScript types
├── config/database.ts                 - DB connection
├── __tests__/sales.test.ts            - Jest tests
└── index.ts                           - Express app
```

## Environment Variables

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=store_hub
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3000
NODE_ENV=development
```

## Database

Requires PostgreSQL tables:
- `sales` - Sales records with version field
- `sales_audit_log` - Audit trail

Run migration: `psql -U postgres -d postgres -f database-schema-final.sql`

## Health Check

```bash
curl http://localhost:3000/health
# { "status": "healthy", "version": "1.0.0" }
```

## Status

✅ Production ready
✅ All tests passing
✅ Ready for Phase 2
