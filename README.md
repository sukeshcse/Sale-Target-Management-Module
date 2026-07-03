# Sales Target Management Module

A sales performance management system: define targets across business dimensions (product,
store, salesman, business unit, region) for a time period, import target values from XLSX,
and automatically track achievement against actual historical sales — including retroactively,
for plans created after their period has already (partly) elapsed.

- **Backend**: NestJS 11 + Prisma 7 + PostgreSQL, Swagger docs at `/api/docs`
- **Frontend**: Next.js 16 (App Router, TypeScript, Tailwind v4)
- **Repo layout**: `backend/` and `frontend/` as two independent projects in one git repo

## 1. Running the project

### Prerequisites

- Node.js 20+
- A PostgreSQL 14+ database. Either:
  - `docker compose up -d` from the repo root (starts Postgres on `localhost:5432`, matches the `.env.example` below out of the box), **or**
  - a local Postgres install — just point `DATABASE_URL` at it.

### Backend

```bash
cd backend
npm install
cp .env.example .env        # adjust DATABASE_URL if not using docker-compose
npx prisma migrate deploy   # applies all 3 migrations (Task 1/2/3 models)
npm run seed                # seeds SalesActual history + one ready-to-activate demo plan
npm run start:dev           # http://localhost:3001, Swagger at /api/docs
```

`npm run test` runs the unit tests (period-label parsing, achievement calculation logic).

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL, defaults to http://localhost:3001/api
npm run dev                        # http://localhost:3000
```

### Env vars

| File | Var | Purpose |
|---|---|---|
| `backend/.env` | `DATABASE_URL` | Postgres connection string |
| `backend/.env` | `PORT` | API port (default 3001) |
| `backend/.env` | `CORS_ORIGIN` | Allowed frontend origin |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | Base URL the frontend calls (`http://localhost:3001/api`) |

### Trying it out

1. Open `http://localhost:3000` → redirects to the plans list. The seed script already created
   one Draft plan ("Q1 2024 - Store-wise Target") with 6 target lines — open it and click
   **Activate Plan** to see retroactive achievement computed immediately against the seeded
   `SalesActual` data (a mix of Achieved/Missed lines, on purpose).
2. Or start fresh: **+ New Plan** → fill in the form → on the detail page, drag in
   `backend/samples/target-import-sample.xlsx` → preview → **Confirm Import** → **Activate Plan**.
3. Swagger (`http://localhost:3001/api/docs`) exercises every endpoint directly, including the
   XLSX upload (multipart file field `file`) and `?preview=true` dry-run.

## 2. XLSX import format

**Columns** (header row required, any column order, matched by name):

| Period | DimensionCode | DimensionName | TargetValue |
|---|---|---|---|
| 2024-Jan | STR001 | Store North | 150,000 |
| 2024-Feb | STR001 | Store North | 175,000 |
| 2024-Jan | STR002 | Store South | 120,000 |

- **Period** label format depends on the plan's `periodType`:
  - `Monthly` → `YYYY-Mon` (e.g. `2024-Jan`)
  - `Weekly` → `YYYY-Www`, ISO week (e.g. `2024-W01`)
  - `Quarterly` → `YYYY-Q#` (e.g. `2024-Q1`)
  - Must fall fully within the plan's `startDate`–`endDate`, or it's a row-level error.
- **DimensionCode** — the business dimension code (e.g. store code). Must be non-empty and
  match `[A-Za-z0-9_-]+`. There's no master dimension table in scope, so this is a format
  check only, not an existence check against another system (see Assumptions).
- **TargetValue** — non-negative number; thousands separators (`150,000`) are accepted.
- A dimension+period pair must be unique **within the file**; duplicates are rejected as a
  row-level error rather than silently keeping the last one.

**Endpoint**: `POST /api/target-plans/:id/import`, multipart field `file`. Add `?preview=true`
to parse and validate without persisting (used by the frontend's preview-before-confirm step —
see §3).

## 3. Transaction & calculation strategy

**Import** (`TargetImportService`): the whole file is parsed and validated in memory (multer
`memoryStorage()` — the raw upload is never written to disk) before touching the database.
If *any* row fails validation, nothing is persisted — a `TargetImportLog` is written with
`status=Failed` and the full row-by-row error report, and the API returns 201 with that report
(the plan itself is untouched). If every row is valid, all `SalesTargetLine` upserts (keyed on
`planId + dimensionId + periodLabel`) and the `TargetImportLog` (`status=Success`) happen inside
one `prisma.$transaction` — all rows land or none do. Re-importing a revised file hits the same
upsert key, so it updates existing lines instead of duplicating them.

The frontend's "preview before confirm" step calls the *same* endpoint with `?preview=true`,
which runs identical parsing/validation logic and returns every row (valid or not) without
persisting anything — so the preview can never drift from what a real import would actually do.
There's a `.xlsx` fixture at `backend/samples/target-import-sample.xlsx` for testing.

**Achievement calculation** (`AchievementService.calculateForPlan`): for each `SalesTargetLine`,
sums `SalesActual.saleAmount` where `dimensionType`/`dimensionId` match the line and `saleDate`
falls within the line's `periodStart`/`periodEnd`, then computes `achievementPct` and a status:

- `targetValue === 0` → `NoTargetSet` (explicit divide-by-zero guard, not silently 0/0=NaN)
- `periodEnd < now` → `Achieved` (pct ≥ 100) or `Missed` (pct < 100)
- otherwise → `Pending` (covers both ongoing and future periods)

All line updates for a plan run inside one transaction. This runs automatically when a plan is
**activated** (Draft → Active) — covering the "fully past period" scenario immediately — and can
be triggered manually via `POST /calculate-achievement`. A daily cron
(`@nestjs/schedule`, midnight) re-runs it for every `Active` plan, which is what advances a
"partially elapsed" plan's still-`Pending` lines once their period lapses, and what would pick up
new `SalesActual` rows landing after the fact.

## 4. Assumptions

- **Money/percentage fields are `Float`**, not `Decimal`. Simpler to work with and to serialize
  to JSON; a production system handling real money should use `Decimal`/numeric with explicit
  rounding rules.
- **No master "dimension" table** (stores/products/salesmen aren't modeled as their own
  entities) — `DimensionCode`/`dimensionId` is validated for format only. In a real system this
  would be a foreign key into a Store/Product/Salesman table.
- **Weekly/Monthly/Quarterly span sanity thresholds** (Weekly ≥ ~2 years, Monthly ≥ ~5 years)
  are a simple, generous heuristic to catch obviously-wrong configurations — not a precisely
  specified business rule.
- **The cron recalculates every Active plan daily**, rather than tracking exactly which lines
  are due to flip out of `Pending`. Simpler, and correct, at the cost of some redundant work at
  scale (see §5).
- **The `PATCH /api/target-plans/:id` edit endpoint** isn't in the assignment's explicit
  endpoint list, but was added because the spec explicitly requires enforcing "Draft plans
  cannot have their date range edited once lines are attached" — a rule that needs an edit path
  to mean anything. No corresponding frontend edit form was built (out of the assignment's
  listed frontend scope); it's reachable via Swagger.
- **Status filtering on the lines grid is client-side** (the plan detail response already
  includes all lines for the plan, which is a bounded, per-plan dataset).
- **`xlsx` (SheetJS) was swapped for `exceljs`**: the npm `xlsx` package currently carries
  unpatched prototype-pollution/ReDoS advisories, which matters directly here since this
  endpoint parses untrusted uploads.
- **Prisma 7's driver-adapter requirement**: Prisma 7 removed direct connection-string
  construction in favor of mandatory driver adapters (`@prisma/adapter-pg` + `pg` here). No
  behavioral impact, just a require-at-setup-time dependency worth calling out since most
  Prisma tutorials/examples still show the old constructor.

## 5. What I'd improve with more time

- Track exactly which lines are due to leave `Pending` (by `periodEnd`) instead of
  recalculating every line of every Active plan nightly — matters once there are many plans.
- A real dimension master (Store/Product/Salesman tables) with FK validation on import instead
  of a format-only regex check.
- Idempotency/concurrency handling for simultaneous imports against the same plan (currently
  relies on the DB transaction + unique constraint; fine for one import at a time, but no
  explicit lock against two concurrent imports racing on the same dimension+period).
- Pagination on the target-lines grid for plans with very large numbers of lines (currently
  fetched all-at-once with the plan detail).
- E2E tests (Supertest) covering the full create → import → activate → recalculate flow, on top
  of the current unit tests for period parsing and achievement calculation.
- Decimal-based money fields with explicit rounding for production-grade financial precision.
