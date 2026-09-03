# Database migrations

Add schema changes as numbered SQL files in this directory:

```text
001_create_cards.sql
002_create_users.sql
003_create_listings.sql
004_create_trading_preferences.sql
005_make_cards_riftbound_id_unique.sql
006_create_carts.sql
007_create_trade_requests.sql
```

Run all pending migrations with:

```bash
bun run db:migrate
```

The runner applies files in filename order and records each filename and SHA-256
checksum in `schema_migrations`. Applied migrations are immutable; add a new file
for later changes instead of editing an applied SQL file.

Each file runs in its own transaction. Keep SQL statements separated by
semicolons. Stored procedures or other SQL containing internal semicolons need a
runner update before they are added.
