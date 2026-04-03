# Finance Dashboard Backend

Production-oriented backend for finance dashboard use cases with MongoDB persistence, JWT + session-based authentication, role-based access control, financial record management, and dashboard analytics.

## What changed

- MongoDB integration via Mongoose
- JWT access tokens + Mongo-backed refresh sessions
- First-admin bootstrap with password and optional bootstrap token guard
- Role-based access control for Viewer, Analyst, Admin
- Financial records CRUD with filtering and dashboard summaries

## Tech Stack

- Node.js + TypeScript
- Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`) + password hashing (`bcryptjs`)
- Zod validation
- Vitest tests

## Authentication Model

- `POST /api/auth/login` returns:
  - `accessToken` (JWT)
  - `refreshToken`
  - `sessionId`
- Protected routes require:
  - `Authorization: Bearer <accessToken>`
- `POST /api/auth/refresh` rotates refresh token using `{ sessionId, refreshToken }`
- `POST /api/auth/logout` revokes active session

## Role Matrix

- `VIEWER`
  - Read dashboard summary
- `ANALYST`
  - Viewer permissions + read records
- `ADMIN`
  - Full user management + full records CRUD + dashboard

## API Overview

Base URL: `http://localhost:4000`

### Public routes

- `GET /api/health`
- `POST /api/setup/bootstrap-admin`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

### Protected routes

- `POST /api/auth/logout`
- `GET /api/users/me`
- `GET /api/users` (admin)
- `POST /api/users` (admin)
- `PATCH /api/users/:id` (admin)
- `POST /api/records` (admin)
- `GET /api/records` (analyst, admin)
- `GET /api/records/:id` (analyst, admin)
- `PATCH /api/records/:id` (admin)
- `DELETE /api/records/:id` (admin)
- `GET /api/dashboard/summary` (viewer, analyst, admin)

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env
```

3. Start MongoDB (local example)

```bash
docker run -d --name finance-mongo -p 27017:27017 mongo:7
```

4. Run backend

```bash
npm run dev
```

## First Admin Bootstrap

Call once when DB has no users:

`POST /api/setup/bootstrap-admin`

Body:

```json
{
  "email": "admin@example.com",
  "fullName": "Admin User",
  "password": "AdminPass123!"
}
```

If `BOOTSTRAP_TOKEN` is set in env, include header:

- `x-bootstrap-token: <BOOTSTRAP_TOKEN>`

## Environment Variables

- `PORT` (default `4000`)
- `CORS_ORIGIN` (default `http://localhost:3000`)
- `RATE_LIMIT_WINDOW_MS` (default `60000`)
- `RATE_LIMIT_MAX_REQUESTS` (default `120`)
- `MONGODB_URI` (default `mongodb://127.0.0.1:27017/finance_dashboard`)
- `JWT_ACCESS_SECRET` (set strong secret in production)
- `JWT_REFRESH_SECRET` (set strong secret in production)
- `ACCESS_TOKEN_TTL` (default `15m`)
- `REFRESH_TOKEN_TTL_DAYS` (default `7`)
- `BOOTSTRAP_TOKEN` (recommended in production)

## Validation and Errors

- Zod request validation on routes
- Typical status codes:
  - `400` invalid payload/query
  - `401` invalid credentials/token/session
  - `403` permission denied/inactive user
  - `404` not found
  - `409` conflicts (duplicate users/bootstrap state)
  - `429` rate-limited
  - `500` internal errors

Error responses include `requestId` for traceability.
