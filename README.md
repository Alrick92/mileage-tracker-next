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

## Running the app

Two supported modes: **full-stack Docker Compose** (recommended for deploys)
and **host Node + containerized Postgres** (typical for local dev).

### Prerequisites

- Docker / Docker Compose (both modes)
- Node.js 20+ (dev mode only)

### Configure env vars (both modes)

```bash
cp .env.example .env
# At minimum set a strong AUTH_SECRET and the admin credentials:
#   AUTH_SECRET=$(openssl rand -base64 32)
#   ADMIN_EMAIL=admin@example.com
#   ADMIN_PASSWORD=<something 8+ chars>
```

### Mode 1 — Full stack via Docker Compose (deploy)

```bash
docker compose up --build -d
```

This builds the app image and starts **two** services:

- `db` — `postgres:16-alpine` with a named volume for durability
- `app` — the Next.js app on port `3000`

On each `app` start the entrypoint automatically:

1. Runs `prisma migrate deploy` against the db
2. Upserts the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` /
   `ADMIN_NAME` (skipped if those are unset)
3. Starts `next start`

Open [http://localhost:3000](http://localhost:3000) and sign in with the
admin account. New self-registered users land on a **pending approval**
screen until the admin enables them in `/admin/users`.

To override the listening port, DB name, credentials, etc., set the optional
vars in `.env` (see the commented block in `.env.example`). To disable the
automatic migration or admin seed on boot, set `RUN_MIGRATIONS=0` or
`SEED_ADMIN=0` in the `app` environment.

### Mode 2 — Host Node + dockerized Postgres (dev)

```bash
docker compose up -d db                 # database only
npm install
npx prisma migrate dev                  # creates/updates dev schema
npm run seed:admin                      # reads .env for admin creds
npm run dev                             # http://localhost:3000
```

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
Dockerfile                 # Multi-stage build for the Next.js app
docker-compose.yml         # Full stack: db + app services
docker-entrypoint.sh       # Runs prisma migrate deploy + admin seed on boot
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
