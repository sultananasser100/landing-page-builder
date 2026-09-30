# Landing Page Builder

Build, edit, and publish landing pages. An admin signs in, creates pages from a
template, edits them section by section, and publishes them at `/p/{slug}`.

Built with Next.js, React, Prisma (PostgreSQL), Tailwind CSS, Jest and Playwright.

## Prerequisites

- Node.js 20.9 or newer (the Next.js requirement) and npm
- Docker with Docker Compose, for the PostgreSQL database defined in
  [docker-compose.yml](docker-compose.yml) (Postgres 17, exposed on host port
  `5433`)

## Setup

```bash
npm install
```

### 1. Environment: `.env`

Copy [.env.example](.env.example) to `.env` and fill it in. It documents each
variable; in short:

| Variable | What to put there |
| --- | --- |
| `DATABASE_URL` | The default matches `docker-compose.yml`. |
| `ADMIN_EMAIL` | The email you will sign in with. |
| `ADMIN_PASSWORD_HASH` | A bcrypt hash of your password (see below). |
| `SESSION_SECRET` | At least 32 random characters. Changing it signs out every session. |

**Password hash.** Generate `ADMIN_PASSWORD_HASH` with:

```bash
npm run auth:hash-password
```

In a terminal it asks for the password twice (input is hidden); otherwise it
reads the password from stdin. It prints a ready-to-paste `.env` line in which
each `$` is escaped as `\$`. That escaping is required, because Next.js expands
`$` in `.env` files.

**Session secret.** `.env.example` shows a way to generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

### 2. Environment for E2E tests: `.env.test`

The Playwright tests write to the database, so they use a separate one. Create
`.env.test` containing the connection string for the test database:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/landing_builder_test"
```

The E2E run refuses to start unless the database name in this URL ends in
`_test`. It supplies its own throwaway admin credentials, so `.env.test` does
not need the admin or session variables.

`.env` and `.env.test` are git-ignored.

### 3. Database

```bash
npm run db:up          # start Postgres (docker compose up -d --wait)
npm run db:generate    # generate the Prisma client (src/generated is git-ignored)
npm run db:migrate     # development only: apply migrations to the database in .env
npm run db:seed        # development/test only: add a published sample page at /p/sample
```

`npm run db:down` stops the database container.

`db:seed` is for development and test databases only. It creates or
**overwrites** the page with slug `sample` (name, draft and published content)
and publishes it. Do not run it against a production database.

**Test database caveat.** [docker/init-test-db.sql](docker/init-test-db.sql)
creates the `landing_builder_test` database, but Postgres runs it only when the
data volume is first created. If your volume already existed before that
script did, the test database is missing. Create it once with:

```bash
docker compose exec postgres psql -U postgres -c "CREATE DATABASE landing_builder_test;"
```

Then apply the migrations to it (uses `.env.test`):

```bash
npm run db:migrate:test
```

## Running the app

Order for local development:

```bash
npm run db:up
npm run db:migrate     # first time, or after pulling new migrations
npm run dev
```

Open <http://localhost:3000>. `/` redirects to `/dashboard`, and visitors who are
not signed in go to `/login`. Sign in with `ADMIN_EMAIL` and the password you
hashed. Published pages are public at `/p/{slug}`.

## Tests and checks

```bash
npm test               # unit tests (Jest)
npm run lint
npm run typecheck
```

### End-to-end tests (Playwright)

Prepare once, or after new migrations:

```bash
npm run db:up
npm run db:migrate:test
```

Then:

```bash
npm run test:e2e
```

What this does:

- Playwright starts its own dev server on port `3001`, against the database in
  `.env.test`.
- Global setup first checks the database name ends in `_test`, then resets the
  fixture pages the specs rely on: the published "Sample SaaS page" and the
  "E2E persistence page". It also deletes pages whose slug starts with
  `e2e-created-`, which are the pages the new-page spec creates.
- `next dev` allows only one server per project directory. If a dev server is
  already running for this project (for example `npm run dev`), stop it before
  running the E2E tests.

## Production

The app is built with `next build` and served with `next start`; there is no
other build configuration.

**Environment variables.** These are the only variables the app reads:

| Variable | Needed at |
| --- | --- |
| `DATABASE_URL` | Build and runtime (also used by the migration command) |
| `ADMIN_EMAIL` | Runtime |
| `ADMIN_PASSWORD_HASH` | Runtime |
| `SESSION_SECRET` | Runtime |

The build only needs `DATABASE_URL` to be set; the database does not have to be
reachable while building. The three auth variables are validated when first used,
not at build time.

Provide them as process environment variables or in a `.env` file. Where you set
`ADMIN_PASSWORD_HASH` matters: `npm run auth:hash-password` prints the value with
each `$` escaped as `\$`, which is only for `.env` files (Next.js expands `$`
there). As a real environment variable, use the plain bcrypt hash without the
backslashes.

**Deploy order:**

```bash
npm ci                     # includes dev dependencies: the build and migrations use them
npm run db:generate        # src/generated is git-ignored
npm run db:migrate:deploy  # apply pending migrations
npm run build
npm start
```

Notes:

- Apply migrations before starting the new build.
- Use `db:migrate:deploy` in production, never `db:migrate` (a development
  command) or `db:seed`.
- `prisma`, `dotenv`, `tsx`, `typescript` and the Tailwind packages are dev
  dependencies that migrations and the build rely on, so do not install with
  `--omit=dev` before building or migrating.
- `npm start` runs Next.js in production mode, which marks the session cookie
  `Secure`. Serve the app over HTTPS.
- A new database is empty. Sign in and use New page to create the first page.

## npm scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen`, then `tsc --noEmit` |
| `npm test` | Jest unit tests |
| `npm run test:e2e` | Playwright end-to-end tests (see above) |
| `npm run db:up` | Start Postgres with Docker Compose |
| `npm run db:down` | Stop the Docker Compose services |
| `npm run db:migrate` | Development only: `prisma migrate dev` against the database in `.env` |
| `npm run db:migrate:deploy` | `prisma migrate deploy` against `DATABASE_URL`; the production migration command |
| `npm run db:migrate:test` | `prisma migrate deploy` against the database in `.env.test` |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:seed` | Development/test only: seed the published sample page |
| `npm run db:studio` | Open Prisma Studio |
| `npm run auth:hash-password` | Generate the `ADMIN_PASSWORD_HASH` line for `.env` |
