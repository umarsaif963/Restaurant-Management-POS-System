# Restaurant Management & POS System

A production-oriented, modular Restaurant Management & POS System built with a
TypeScript monorepo. This project is developed **one module at a time** — each
module delivers a fully working vertical slice (database + API + validation +
frontend) and is reviewed before the next one starts.

**Status:** Modules 1–9 complete — project setup/architecture, the full
PostgreSQL database (schema, migration, seed), Authentication, Authorization
&amp; user/role management, restaurant settings, table sections/floor plan,
customer management, the menu (categories, items, variations, add-ons),
the **Point of Sale (order creation + order management)** — line-item pricing
(variations, add-ons, tax), dine-in/takeaway/delivery orders, table &amp;
customer lifecycle and order status workflow, **customer receipts, kitchen
tickets &amp; printing** — automatic kitchen tickets on order confirmation, a
kitchen ticket board with a dedicated status workflow, printable customer
receipts and kitchen tickets — the **Kitchen Display System (KDS) with a
real-time Socket.IO workflow** — authenticated sockets, server-pushed domain
events (order/kitchen/table/customer) that keep every open view in sync, and
a live kitchen production board — and **payments &amp; billing** — multi-method
payments (cash/card/bank/other) with split/partial payment support, cash
change handling, manager/administrator refunds with a full payment ledger, and
payment history on customer receipts.
Every later module builds on the Prisma schema.

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
| `GET /api/v1/settings` | Restaurant profile + settings + opening hours (authenticated) |
| `PATCH /api/v1/settings` | Update restaurant/settings/opening-hours (MANAGER/ADMIN) |
| `GET /api/v1/tables/sections` | Table sections with table counts (authenticated) |
| `POST /api/v1/tables/sections` | Create a section (MANAGER/ADMIN) |
| `PATCH /api/v1/tables/sections/:id` | Update a section (MANAGER/ADMIN) |
| `DELETE /api/v1/tables/sections/:id` | Delete an empty section (MANAGER/ADMIN) |
| `GET /api/v1/tables` | List tables, filter by section/status (authenticated) |
| `POST /api/v1/tables` | Create a table (MANAGER/ADMIN) |
| `PATCH /api/v1/tables/:id` | Update a table (MANAGER/ADMIN) |
| `DELETE /api/v1/tables/:id` | Delete a table with no order history (MANAGER/ADMIN) |
| `GET /api/v1/customers` | List/search customers with pagination (ADMIN/MANAGER/CASHIER/WAITER) |
| `POST /api/v1/customers` | Create a customer (ADMIN/MANAGER/CASHIER/WAITER) |
| `PATCH /api/v1/customers/:id` | Update a customer (MANAGER/ADMIN) |
| `DELETE /api/v1/customers/:id` | Delete a customer (MANAGER/ADMIN) |
| `GET /api/v1/menu/categories` | Menu categories with item counts (authenticated) |
| `POST /api/v1/menu/categories` | Create a category (MANAGER/ADMIN) |
| `PATCH /api/v1/menu/categories/:id` | Update a category (MANAGER/ADMIN) |
| `DELETE /api/v1/menu/categories/:id` | Delete an empty category (MANAGER/ADMIN) |
| `GET /api/v1/menu/items` | List/search items with category/status filters + pagination |
| `POST /api/v1/menu/items` | Create an item, optionally with variations + add-ons (MANAGER/ADMIN) |
| `PATCH /api/v1/menu/items/:id` | Update an item (MANAGER/ADMIN) |
| `DELETE /api/v1/menu/items/:id` | Delete an item with no order history (MANAGER/ADMIN) |
| `POST /api/v1/menu/items/:itemId/variations` | Add a variation (MANAGER/ADMIN) |
| `PATCH /api/v1/menu/variations/:id` | Update a variation (defaults transfer on `isDefault`) (MANAGER/ADMIN) |
| `DELETE /api/v1/menu/variations/:id` | Delete a non-default variation (MANAGER/ADMIN) |
| `POST /api/v1/menu/items/:itemId/addons` | Add an add-on (MANAGER/ADMIN) |
| `PATCH /api/v1/menu/addons/:id` | Update an add-on (MANAGER/ADMIN) |
| `DELETE /api/v1/menu/addons/:id` | Delete an add-on (MANAGER/ADMIN) |
| `GET /api/v1/orders` | List/search orders (status, type, payment, text) + pagination (authenticated) |
| `GET /api/v1/orders/:id` | Order detail with line-item snapshots (authenticated) |
| `POST /api/v1/orders` | Create an order (DINE_IN/TAKEAWAY/DELIVERY) with items (ADMIN/MANAGER/CASHIER/WAITER) |
| `PATCH /api/v1/orders/:id` | Update notes, kitchen notes, customer, table, order type (ADMIN/MANAGER/CASHIER/WAITER) |
| `POST /api/v1/orders/:id/items` | Add items to a PENDING/CONFIRMED order (ADMIN/MANAGER/CASHIER/WAITER) |
| `DELETE /api/v1/orders/:id/items/:itemId` | Remove an item + re-total (ADMIN/MANAGER/CASHIER/WAITER) |
| `POST /api/v1/orders/:id/status` | Advance status per the order state machine; cancel requires a reason (ADMIN/MANAGER/CASHIER/WAITER) |
| `GET /api/v1/orders/:id/receipt` | Printable customer receipt (restaurant branding + settings + order totals) (authenticated) |
| `GET /api/v1/kitchen-orders` | List kitchen tickets (status, orderId) + pagination (authenticated) |
| `GET /api/v1/kitchen-orders/:id` | Kitchen ticket detail with item snapshots (authenticated) |
| `POST /api/v1/kitchen-orders/:id/status` | Advance a ticket (ACCEPTED → PREPARING → READY → SERVED → COMPLETED; cancel allowed early) (KITCHEN_STAFF/MANAGER/ADMIN) |

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

`/socket.io` namespace with CORS restricted to `CLIENT_URL`. Every handshake
is authenticated with the same access token as the REST API (either the
`access_token` cookie on same-origin connections or a token passed in the
socket `auth` payload for API clients); invalid sessions are rejected.

Server pushes domain events over five channels. Services publish on an
in-process bus **after committed mutations** (never on rollback), and the
socket layer forwards each event to every connected client. The web client
bridges them into RTK Query tag invalidations, so open views (orders, kitchen
display, tables, customers) refetch instantly without polling.

| Event (client → server) | Event (server → client) | Purpose |
| --- | --- | --- |
| `ping` | `pong` | Latency probe (used by System Status page) |
| — | `server:info` | Server identity on connect |
| — | `order:updated` | Order created / updated / items changed / status changed (payload: `orderId`) |
| — | `kitchen:created` | Order confirmed → kitchen ticket minted (payload: `orderId`) |
| — | `kitchen:updated` | Ticket status advanced or ticket items appended/removed (payload: `orderId`, optional `kitchenOrderId`) |
| — | `table:updated` | Table availability changed (payload: optional `tableId`) |
| — | `customer:updated` | Customer totals changed on completed order (payload: optional `customerId`) |

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

## Security Baseline (Modules 1–6)

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
- **Order mutations restricted to front-of-house roles; kitchen staff are read-only**
- **Kitchen ticket mutations restricted to KITCHEN_STAFF / MANAGER / ADMIN**
- **Socket.IO handshakes authenticated (access JWT + live server-side session);
  unauthenticated sockets are disconnected**

---

## Development Roadmap (Module Order)

1. ✅ **Project Setup & Architecture** — monorepo, tooling, connectivity
2. ✅ **Database Schema, Migrations & Seed** — complete Prisma schema, initial migration, demo data
3. ✅ **Authentication + Authorization** — JWT/refresh sessions, roles, user management, password reset
4. ✅ **Restaurant Settings, Tables & Customers** — restaurant profile/opening hours, floor plan, customer directory
5. ✅ **Menu — categories, items, variations & add-ons** — full menu CRUD with defaults transfer and RBAC
6. ✅ **Point of Sale — order creation + order management** — order number generation, item pricing (variations/add-ons/tax), dine-in/takeaway/delivery, status workflow with table & customer side-effects, POS + Orders UI
7. ✅ **Customer receipts, kitchen tickets & printing** — automated kitchen tickets on confirm, ticket state machine + kitchen board, printable receipts/tickets
8. ✅ **Kitchen Display System + Socket.IO workflow** — authenticated sockets, server-pushed domain events (order/kitchen/table/customer) invalidating open views, and a live KDS production board
9. ✅ **Payments + billing** — multi-method payments (cash/card/bank/other) with partial/split support, cash change handling, manager/admin refunds, payment ledger on receipts and order views
10. Inventory, recipes, ingredients
11. Suppliers + purchases
12. Reservations
13. Dashboard + reports + analytics
14. Audit logs + security hardening
15. Testing + documentation + production prep

---

## License

Private project — no license granted.