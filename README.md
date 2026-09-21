# Restaurant Management & POS System

A production-oriented, modular Restaurant Management & POS System built with a
TypeScript monorepo. This project is developed **one module at a time** — each
module delivers a fully working vertical slice (database + API + validation +
frontend) and is reviewed before the next one starts.

**Status:** Module 1 complete — project setup, monorepo architecture, and live
frontend ↔ backend connectivity (REST + Socket.IO). Database schema, seeding,
and all business modules are built incrementally in later modules.

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
| `DATABASE_URL` | PostgreSQL connection string (Phase 2+) | — |
| `JWT_SECRET` | Access-token secret (Phase 3+) | — |
| `JWT_REFRESH_SECRET` | Refresh-token secret (Phase 3+) | — |

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

Workspace-scoped equivalents: `npm run dev -w @restaurant/server`,
`npm run build -w @restaurant/client`, etc.

---

## API

Base path: `/api/v1`

| Endpoint | Description |
| --- | --- |
| `GET /api/v1/health` | Service health, uptime, environment, DB config status |

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

## Security Baseline (Module 1)

- Helmet security headers
- CORS restricted to `CLIENT_URL` with credentials
- Rate limiting on the API base path (`300 req / 15 min / IP`)
- Zod-validated environment variables
- Centralized error handling — no stack traces / DB details leaked
- HTTP-only cookie auth, JWT, bcrypt, role-based authorization arrive in the
  Authentication + Authorization modules

---

## Development Roadmap (Module Order)

1. ✅ **Project Setup & Architecture** — monorepo, tooling, connectivity (this module)
2. Prisma schema, migrations, seed data
3. Authentication + Authorization (JWT, roles, users)
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