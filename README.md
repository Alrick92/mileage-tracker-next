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
```

### 4. Install dependencies and apply the schema

```bash
npm install
npx prisma migrate dev --name init
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register a new account,
then add a vehicle and start logging trips.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` — production build
- `npm run start` — start the built app
- `npm run lint` — ESLint
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
    api/trips/export/      # CSV export route handler
    login/ register/       # public auth pages
  lib/
    auth.ts                # JWT session helpers (server-only)
    prisma.ts              # Prisma client singleton
    csv.ts                 # CSV serialisation helper
prisma/
  schema.prisma            # User / Vehicle / Trip models
docker-compose.yml         # PostgreSQL service
```

## Security notes

- `src/lib/auth.ts` is marked `import "server-only"` — the session secret and
  password hashing helpers can never be bundled into client code.
- The Prisma client is instantiated only in server code; API keys and the
  database URL live in `.env` (gitignored) and never reach the browser.
- Passwords are stored as bcrypt hashes (cost 10).
- Sessions are signed JWTs in an httpOnly, SameSite=Lax cookie.
