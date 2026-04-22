# Mileage Tracker

Multi-user vehicle fleet mileage tracker. Log trips, track fuel usage, monitor
total distance per vehicle, and export trip data to CSV.

## Tech stack

- **Next.js 16** (App Router, React Server Components, Server Actions)
- **Tailwind CSS 4**
- **PostgreSQL 16** (containerised via Docker Compose)
- **Prisma** ORM
- **Custom JWT session auth** (`jose` + `bcryptjs`) stored in an httpOnly cookie

All database access happens server-side in Server Components, Server Actions,
and Route Handlers. No database credentials, session secrets, or API keys are
ever sent to the browser.

## Features

1. **Authentication** — email + password registration and sign-in; sessions
   stored in an httpOnly JWT cookie.
2. **Dashboard** — fleet overview with vehicle list, current odometer readings
   and aggregate stats.
3. **Vehicle management** — add vehicles, view per-vehicle trip history.
4. **Trip logging** — form for `Date`, `Start Odometer`, `End Odometer`,
   `Driver`, plus optional fuel usage and notes. Submitting a trip updates the
   vehicle's current odometer when appropriate.
5. **CSV export** — download all trips (or trips for a single vehicle) as CSV.
6. **Role-based access control** — `USER` and `ADMIN` roles. New registrations
   are **disabled** by default and must be enabled by an admin before sign-in.
7. **Per-user preferences** — unit of measurement (kilometers or miles,
   default **miles**) and interface language (English or French, default
   **English**). Distances are always stored as kilometers in the database
   and converted at display and input time.
8. **Admin console** — admins can enable/disable users and promote/demote
   between `USER` and `ADMIN` roles.

## Local development

### 1. Prerequisites

- Node.js 20+ (22 recommended)
- Docker / Docker Compose

### 2. Start PostgreSQL

```bash
docker compose up -d
```

This starts a `postgres:16-alpine` container on port `5432` with database
`mileage`, user `mileage`, password `mileage` (see `docker-compose.yml`).

### 3. Configure env vars

```bash
cp .env.example .env
# edit .env and set AUTH_SECRET to a long random string
# e.g. AUTH_SECRET=$(openssl rand -base64 32)
# also set ADMIN_EMAIL and ADMIN_PASSWORD for the first admin account
```

### 4. Install dependencies and apply the schema

```bash
npm install
npx prisma migrate dev
```

### 5. Seed the first admin account

```bash
npm run seed:admin
```

This upserts a user using the `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME`
env vars with `role=ADMIN` and `enabled=true`. Re-running the script rotates
the admin's password to the current value of `ADMIN_PASSWORD`.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the seeded
admin account. Regular users who register will see a **pending approval**
screen until the admin enables them from `/admin/users`.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` — production build
- `npm run start` — start the built app
- `npm run lint` — ESLint
- `npm run seed:admin` — create/update the first admin user from env vars
- `npx prisma studio` — database GUI
- `npx prisma migrate dev` — apply schema changes in development
- `npx prisma migrate deploy` — apply migrations in production

## Project layout

```
src/
  app/
    (app)/                 # authenticated area with sidebar layout
      dashboard/
      vehicles/
      trips/
      settings/            # per-user unit + locale preferences
      admin/users/         # admin-only user management
    api/trips/export/      # CSV export route handler (unit- and locale-aware)
    login/ register/       # public auth pages
    pending/               # public "account pending approval" screen
  i18n/                    # en.json and fr.json message catalogs
  lib/
    auth.ts                # JWT session + role helpers (server-only)
    prisma.ts              # Prisma client singleton
    csv.ts                 # CSV serialisation helper
    i18n.ts                # minimal translator utility
    units.ts               # km ⇄ mi conversion + formatting
scripts/
  seed-admin.ts            # idempotent first-admin seeder
prisma/
  schema.prisma            # User / Vehicle / Trip models + Role/Unit/Locale enums
docker-compose.yml         # PostgreSQL service
```

## Units and internationalisation

- Distances are stored as **integers in kilometers** in the database
  (`Vehicle.currentOdometer`, `Trip.startOdometer`, `Trip.endOdometer`).
- Each user has a `unit` preference (`KM` | `MI`, default `MI`) and a `locale`
  preference (`EN` | `FR`, default `EN`) on the `User` row.
- All display and input sites convert to/from the user's preferred unit via
  helpers in `src/lib/units.ts`.
- UI strings are served from `src/i18n/en.json` and `src/i18n/fr.json`;
  server components render in the current user's locale via `translator()`
  from `src/lib/i18n.ts`.
- The CSV export uses the requester's unit and locale for headers and for
  distance/odometer values.

## Role-based access control

- `Role` enum: `USER` (default on registration) and `ADMIN`.
- `enabled` flag on `User` defaults to `false`. The login server action
  rejects disabled users with a pending-approval notice, and the
  authenticated layout's `requireUser()` guard invalidates any stale session
  whose user is no longer enabled.
- `requireAdmin()` guards `/admin/users` and its server actions. Admins
  cannot disable or demote themselves.
- The first admin is created by `npm run seed:admin` (not via the UI).

## Security notes

- `src/lib/auth.ts` is marked `import "server-only"` — the session secret and
  password hashing helpers can never be bundled into client code.
- The Prisma client is instantiated only in server code; API keys and the
  database URL live in `.env` (gitignored) and never reach the browser.
- Passwords are stored as bcrypt hashes (cost 10).
- Sessions are signed JWTs in an httpOnly, SameSite=Lax cookie.
- Admin endpoints and mutations are guarded server-side by `requireAdmin()`.
