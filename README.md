# Ripbao

Ripbao is a Vietnamese marketplace and collection manager for the Riftbound
trading card game. Users can browse cards, publish cards from their collection,
add listings to a cart, and send trade requests to sellers. Guest checkout is
supported, and a guest account can later be converted into a permanent account.

## Features

- Search and filter the Riftbound card catalog
- Manage non-foil and foil cards in a personal collection
- Configure fixed prices or prices based on a TCG multiplier
- Browse public seller collections and add cards to a cart
- Send, update, complete, cancel, and hide trade requests
- Configure trading and delivery preferences
- Use the marketplace as a guest or registered user

## Tech stack

- [Next.js](https://nextjs.org/) App Router
- React and TypeScript
- Tailwind CSS
- Neon serverless Postgres
- Bun for dependencies and project scripts
- Riftbound card data from [RiftCodex](https://api.riftcodex.com/)
- Market pricing from [JustTCG](https://justtcg.com/)

## Local development

Requirements:

- [Bun](https://bun.sh/)
- A Postgres database, such as a Neon database

Install dependencies:

```bash
bun install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Set the pooled Postgres connection string in `.env.local`:

```dotenv
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

Create or update the database schema, then import the card catalog:

```bash
bun run db:migrate
bun run db:sync-cards
bun run db:sync-prices
```

Start the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the Next.js development server |
| `bun run build` | Create a production build |
| `bun run start` | Start the production server |
| `bun run typecheck` | Type-check the project |
| `bun run lint` | Run ESLint |
| `bun run test` | Run the Bun test suite |
| `bun run check` | Run type-checking, lint, and tests |
| `bun run db:migrate` | Apply pending SQL migrations |
| `bun run db:sync-cards` | Synchronize cards from RiftCodex |
| `bun run db:sync-prices` | Synchronize active listing prices from JustTCG |

## Database migrations

Migrations live in [`db/`](db/) and are applied in filename order. The migration
runner stores each applied filename and its SHA-256 checksum in
`schema_migrations`.

Do not edit a migration after it has been applied. Add a new numbered SQL file
for every schema change. See [`db/README.md`](db/README.md) for details.

Card synchronization marks cards missing from the current RiftCodex response as
inactive and upserts the remaining catalog by Riftbound ID. Run it intentionally
against the correct database.

## Project structure

```text
app/          Pages, layouts, and API route handlers
components/   Shared UI and client-side providers
db/           Ordered SQL migrations
docs/         API integration notes
lib/          Authentication, database, and shared utilities
scripts/      Database migration and card synchronization scripts
```

## Deployment

The project is configured for Vercel and uses the Singapore region (`sin1`). Add
`DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, and `CRON_SECRET` to the deployment
environment, add `JUSTTCG_API_KEY` and `USD_TO_VND`, apply migrations, and
synchronize the card catalog before serving marketplace traffic. Vercel invokes
protected daily jobs to synchronize active listing prices and remove expired
sessions, stale rate-limit counters, old inactive carts, and unused guest accounts.

Keep `DATABASE_URL` server-side and never expose it through a `NEXT_PUBLIC_`
environment variable.
