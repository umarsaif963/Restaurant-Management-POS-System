# Restaurant Management & POS System

A production-oriented, modular Restaurant Management & POS System built with a
TypeScript monorepo. This project is developed **one module at a time** — each
module delivers a fully working vertical slice (database + API + validation +
frontend) and is reviewed before the next one starts.

**Status:** Modules 1–3 complete — project setup/architecture, the full
PostgreSQL database (schema, migration, seed), and Authentication, Authorization
&amp; user/role management (login, sessions, password reset). Every later module
builds on the Prisma schema.

---

## Tech Stack

| Layer     | Technologies |
| --------- | ------------ |
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS, Redux Toolkit (RTK Query), React Router, Axios, Zod, Lucide, Socket.IO Client |
| Backend   | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT (HTTP-only cookies), bcrypt, Socket.IO, Zod |
| Infra     | Redis, Cloudinary, Multer, Docker (Compose), ESLint, Prettier |

---

## Monorepo Layout

```
|-- client/                 React SPA (Vite)
|-- server/                 Express REST + Socket.IO API
|-- shared/                 Shared TypeScript types (@restaurant/shared)
|-- docker-compose.yml      Dev infrastructure (PostgreSQL + Redis)
|-- docker-compose.prod.yml Production-style build (api + web + infra)
```

npm workspaces link the three packages together.

---

## Prerequisites

- Node.js ≥ 20 (developed/tested on Node 24)
- npm ≥ 10
- Docker Desktop (only needed for PostgreSQL/Redis containers)

---

## Quick Start (Development)

```bash
# 1. Install all workspace dependencies (run from repository root)
npm install

# 2. Start PostgreSQL + Redis (optional but recommended)
docker compose up -d

# 3. Build the shared package, then start API (port 4000) and client (port 5173)
npm run dev
```

Open http://localhost:5173 — the **System Status** page shows live REST health
and the real-time Socket.IO channel.

### Individual processes

```bash
npm run dev:server    # API only (tsx watch, hot reload)
npm run dev:client    # Client only (Vite dev server)
```

The Vite dev server proxies `/api` and `/socket.io` to `http://localhost:4000`
(override with `VITE_PROXY_TARGET` in `client/.env`).

---

## Environment Configuration

Copy the example files and fill them in. **Never commit real `.env` files.**

```bash
cp .env.example .env                 # root reference (not required to run)
cp server/.env.example server/.env   # server settings
cp client/.env.example client/.env   # client settings
```

### Key variables (`server/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | API port | `4000` |
| `SERVER_URL` | Public API URL | `http://localhost:4000` |
| `CLIENT_URL` | Allowed CORS origin | `http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `JWT_SECRET` | Access-token secret (min 16 chars) | — |
| `JWT_REFRESH_SECRET` | Refresh-token secret (min 16 chars) | — |
| `JWT_ACCESS_EXPIRES_IN` | Access-token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh session lifetime | `7d` |
| `PASSWORD_RESET_EXPIRES_IN` | Reset-token lifetime | `30m` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Outbound mail (reset links); falls back to console in dev | — |
| `MAIL_FROM` | From address for reset emails | — |

The API validates all environment variables with Zod at boot and exits with a
clear error report if any are invalid.

---

## Useful Scripts

| Command (from root) | Description |
| --- | --- |
| `npm run dev` | Build shared, then run API + client concurrently |
| `npm run dev:server` | Run the API only |
| `npm run dev:client` | Run the client only |
| `npm run build` | Build shared → server → client |
| `npm run start` | Run the compiled API (`server/dist`) |
| `npm run typecheck` | Type-check all workspaces |
| `npm run lint` | ESLint all workspaces |
| `npm run format` | Prettier (write) |
| `npm run prisma:generate` | Regenerate Prisma Client |
| `npm run prisma:migrate` | Create/apply a dev migration (`-- --name <name>`) |
| `npm run prisma:migrate:deploy` | Apply migrations in production |
| `npm run prisma:seed` | Seed the database (idempotent) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:reset` | Drop, re-migrate, and re-seed the dev DB |

Workspace-scoped equivalents: `npm run dev -w @restaurant/server`,
`npm run build -w @restaurant/client`, etc.

---

## Database (PostgreSQL + Prisma)

Schema lives in `server/prisma/schema.prisma`, migrations in
`server/prisma/migrations`, and the demo dataset in `server/prisma/seed.ts`.

### Requirements

A running PostgreSQL server (local install or Docker):

```bash
docker compose up -d postgres   # if using Docker (Postgres 16 on :5432)
```

Create `server/.env` from `server/.env.example` and set `DATABASE_URL`, e.g.:

```
DATABASE_URL=postgresql://postgres:admin@localhost:5432/restaurant_db
```

### Commands

```bash
npm run prisma:generate        # generate Prisma Client
npm run prisma:migrate -- --name init         # create & apply a migration
npm run prisma:migrate:deploy  # non-interactive apply (CI/prod)
npm run prisma:seed            # seed demo data (idempotent)
npm run prisma:studio          # browse data in a GUI
```

> `prisma migrate dev` automatically regenerates the client and runs the seed.

### What the migration creates

PostgreSQL enums + tables: `Restaurant`, `RestaurantSettings`, `User`,
`Session`, `PasswordResetToken` (auth) plus `TableSection`, `RestaurantTable`,
`Customer`, `MenuCategory`, `MenuItem`, `MenuItemVariation`, `AddOn`, `Order`,
`OrderItem`, `Payment`, `KitchenOrder`, `KitchenOrderItem`, `Reservation`,
`InventoryItem`, `InventoryTransaction`, `Recipe`, `RecipeIngredient`,
`Supplier`, `Purchase`, `PurchaseItem`, `AuditLog` — with FKs, unique
constraints, and indexes on lookup columns.

### Demo credentials (development only)

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | `admin@restaurant.com` | `Admin@123` |
| MANAGER | `manager@restaurant.com` | `Manager@123` |
| CASHIER | `cashier@restaurant.com` | `Cashier@123` |
| WAITER | `waiter@restaurant.com` | `Waiter@123` |
| KITCHEN_STAFF | `kitchen@restaurant.com` | `Kitchen@123` |

---

## API

Base path: `/api/v1`

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/health` | Service health, uptime, environment, live DB connectivity |
| `POST /api/v1/auth/login` | Sign in with email + password (sets HTTP-only cookies) |
| `POST /api/v1/auth/refresh` | Rotate the refresh session; reissue access token |
| `POST /api/v1/auth/logout` | Revoke the current session and clear cookies |
| `GET /api/v1/auth/me` | Current signed-in user |
| `POST /api/v1/auth/change-password` | Change password (requires current password) |
| `POST /api/v1/auth/register` | Create accounts (MANAGER/ADMIN only) |
| `POST /api/v1/auth/forgot-password` | Request a password-reset link |
| `POST /api/v1/auth/reset-password` | Reset the password with a reset token |
| `GET /api/v1/users` | List/search users with role-status filters + pagination |
| `POST /api/v1/users` | Create a user (MANAGER/ADMIN) |
| `PATCH /api/v1/users/:id` | Update a user (MANAGER/ADMIN) |
| `DELETE /api/v1/users/:id` | Deactivate a user + revoke sessions (MANAGER/ADMIN) |

> In development, `forgot-password` prints the reset link to the **server
> console** instead of sending email (SMTP is optional).

All responses use a consistent envelope:

```json
{ "success": true, "data": { ... } }
```

Errors:

```json
{ "success": false, "message": "Validation failed", "errors": [{ "field": "email", "message": "Invalid email" }] }
```

Error handling is centralized: validation (Zod), API errors (`ApiError`),
malformed JSON, and unexpected exceptions never leak internals.

---

## Real-time (Socket.IO)

`/socket.io` namespace with CORS restricted to `CLIENT_URL`.

| Event (client → server) | Event (server → client) | Purpose |
| --- | --- | --- |
| `ping` | `pong` | Latency probe (used by System Status page) |
| — | `server:info` | Server identity on connect |

Kitchen Display, order status, and table-status broadcasts attach to this same
socket layer in later modules.

---

## Docker

**Infrastructure only (for local development):**

```bash
docker compose up -d        # PostgreSQL :5432, Redis :6379
docker compose down -v      # teardown (removes volumes)
```

**Full stack (API + web behind nginx):**

```bash
docker compose -f docker-compose.prod.yml up --build
# web at http://localhost:8080, api at http://localhost:4000
```

---

## Security Baseline (Modules 1–3)

- Helmet security headers
- CORS restricted to `CLIENT_URL` with credentials
- Rate limiting (`300 req / 15 min / IP`; tighter limits on password endpoints)
- Zod-validated environment variables
- Centralized error handling — no stack traces / DB details leaked
- Passwords hashed with bcrypt (12 rounds, `$2b$` format)
- Prisma parameterized queries (no raw SQL injection surface)
- **JWT access tokens (15 min) + rotating refresh sessions in HTTP-only,
  path-scoped cookies; sessions revocable server-side via a `Session` table**
- **Role-based access control (ADMIN / MANAGER / CASHIER / WAITER /
  KITCHEN_STAFF) enforced on every protected route**
- **Soft-deactivate accounts (status `INACTIVE`) revokes all sessions**
- **Hashed, single-use password-reset tokens with short expiry (30 min)**
- **Generic 401s / always-200 forgot-password (no account enumeration)**

---

## Development Roadmap (Module Order)

1. ✅ **Project Setup & Architecture** — monorepo, tooling, connectivity
2. ✅ **Database Schema, Migrations & Seed** — complete Prisma schema, initial migration, demo data
3. ✅ **Authentication + Authorization** — JWT/refresh sessions, roles, user management, password reset
4. Restaurant settings, tables, customers
5. Menu categories, items, add-ons, variations
6. POS / order creation + order management
7. Customer receipts, kitchen tickets, printing
8. Kitchen Display System + Socket.IO workflow
9. Payments + billing
10. Inventory, recipes, ingredients
11. Suppliers + purchases
12. Reservations
13. Dashboard + reports + analytics
14. Audit logs + security hardening
15. Testing + documentation + production prep

---

## License

Private project — no license granted.