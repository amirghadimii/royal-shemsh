# Royal Shemsh (رویال شمش) — Trading Platform

Full-stack gold & coin trading platform (Next.js 16 frontend + NestJS 11 / Prisma / PostgreSQL / Redis / Socket.io backend).

> **Important (GitHub Pages vs Backend):** GitHub Pages (`https://amirghadimii.github.io/royal-shemsh/`) serves the **static UI only**. The NestJS backend, PostgreSQL, and Redis run locally in staging/development.

## Architecture & Ports (Staging / Dev)

| Service | Port | Notes |
| --- | --- | --- |
| Frontend (Next.js) | `3000` | `npm run dev` |
| Backend (NestJS + Socket.io) | `4001` | `cd backend && node --env-file=.env.staging dist/main` |
| PostgreSQL 16 (Docker) | `5433` | Container `royalshemsh-postgres`, DB `royalshemsh_staging` |
| Redis 7 (Docker) | `6379` | Container `royalshemsh-redis` |

## Running Locally (Staging)

1. **Start infrastructure (Postgres + Redis):**
   ```powershell
   docker compose up -d
   ```

2. **Prepare and start the backend:**
   ```powershell
   cd backend
   npm install
   npx prisma migrate deploy
   npx prisma generate
   npm run prisma:seed
   npm run typecheck
   npm run build
   node --env-file=.env.staging dist/main
   ```

3. **Start the frontend:**
   ```powershell
   npm install
   npm run typecheck
   npm run dev
   ```

4. **Static export build (GitHub Pages):**
   ```powershell
   npm run build
   ```

## Seeded Staging Sample Accounts

> **Staging-only fixtures:** Blocked automatically when `NODE_ENV=production` or `APP_ENV=production`.

| Username | Role | Password | Notes |
| --- | --- | --- | --- |
| `admin` | `ADMIN` (ادمین) | `Royal@1405` | Full admin, reports, finance, settings |
| `manager` | `SYSTEM_MANAGER` (مدیر سیستم) | `Manager@1405` | Operational & board management |
| `parsian` | `REGULAR` (کاربر عادی) | `User@1405` | Assigned to a user group (sees allowed board products) |
| `kourosh` | `REGULAR` (کاربر عادی) | `User@1405` | Ungrouped regular user (0 board products) |

## Shadow Mode (`SHADOW_MODE`)

- Controlled via `shadowMode` in `PATCH /admin/settings` (or `SHADOW_MODE=true` env fallback; default `false`).
- When `true`, order submissions and admin approve/reject decisions run end-to-end and are recorded in `shadow_logs` (`GET /admin/shadow-logs`), **without** creating `trades` or posting `ledger_entries` (derived balances remain unchanged).
- Switching `shadowMode` back to `false` resumes normal trade and double-entry ledger posting immediately.

## Backup & Restore (Staging)

- **Manual backup:**
  ```powershell
  powershell -ExecutionPolicy Bypass -File backend/scripts/backup-staging.ps1
  ```
  Writes timestamped SQL dumps to `backend/backups/` (gitignored).
- **Automated daily backup (Windows Task Scheduler):**
  ```powershell
  schtasks /Create /SC DAILY /TN "RoyalShemshStagingBackup" /TR "powershell -ExecutionPolicy Bypass -File d:\Ghadimi\Site\GoldProject\backend\scripts\backup-staging.ps1" /ST 02:00
  ```
- **Backup + scratch-DB restore verification:**
  ```powershell
  powershell -ExecutionPolicy Bypass -File backend/scripts/verify-backup-restore.ps1
  ```

## QA & Verification Scripts

Run from the repo root with Postgres, Redis, and the staging backend running on `:4001` (except `verify-b2.mjs`, which spawns its own backend instance on `:4001` with `OTP_TTL_SECONDS=2` and should be run from `backend/` while `:4001` is free):

- `node backend/scripts/verify-env.mjs` — Environment & production isolation guards
- `node backend/scripts/verify-b1.mjs` — Schema, seed counts, ledger immutability triggers
- `cd backend && node scripts/verify-b2.mjs` — OTP/password auth, sessions, lockout
- `node backend/scripts/verify-b3.mjs` — RBAC (`RolesGuard`) & group-based board access
- `node backend/scripts/verify-b4.mjs` — Admin user CRUD, group assignment, document uploads
- `node backend/scripts/verify-b5.mjs` — Products CRUD, ordering, settings, stop flag
- `node backend/scripts/verify-b6.mjs` — Manual pricing, HomeGold stub modes 1/2/3, staleness
- `node backend/scripts/verify-b7.mjs` — Authenticated Socket.io rooms, price/status events
- `node backend/scripts/verify-b8.mjs` — Order submission validation, idempotency, ownership
- `node backend/scripts/verify-b9.mjs` — Transactional approve/reject, concurrency, expiry worker
- `node backend/scripts/verify-b10.mjs` — Conditional pre-orders, atomic trigger engine, day-end expiry
- `node backend/scripts/verify-b11.mjs` — Double-entry ledger, derived balances, CSV export, audit
- `node backend/scripts/verify-b11-expiry-zero-ledger.mjs` — Expired order posts zero ledger entries
- `node backend/scripts/verify-b12-finance.mjs` — P&L, asset dashboard, customer P&L, commission, discrepancy, remittances
- `node backend/scripts/verify-b12-messages.mjs` — Internal messages, online-only targeting, archive, SMS rule `isActive` & `STUB` logs
- `node backend/scripts/verify-b13.mjs` — Production guards, CORS/headers, `/auth/*` rate limit, 400 validation, `SHADOW_MODE`, 50-socket + 100-order load sanity

## Known Open Items (External Integrations)

1. **Kimia accounting API**: Exact production endpoint/payload contract not yet connected (current accounting/discrepancy uses internal double-entry ledger).
2. **Real SMS gateway**: All SMS sends currently write `STUB` rows in `sms_logs`; real provider credentials/webhook integration is pending.
3. **Real HomeGold feed**: Mode 1/2/3 runs against the staging stub adapter (`HomeGoldStubAdapter`); live `homegold750.ir` feed integration is pending.
4. **Manual pre-order exact form fields**: Screen 14 / Screen 21 manual pre-order fields are wired to the staging schema and awaiting final business field sign-off.
