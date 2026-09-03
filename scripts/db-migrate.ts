import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured");

const sql = neon(connectionString);
const migrationsDirectory = resolve("db");
const migrationFiles = (await readdir(migrationsDirectory))
  .filter((file) => /^\d+_[a-z0-9_]+\.sql$/.test(file))
  .sort((left, right) => left.localeCompare(right));

if (migrationFiles.length === 0) {
  throw new Error(`No migration files found in ${migrationsDirectory}`);
}

await sql`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

const appliedRows = await sql`
  SELECT name, checksum
  FROM schema_migrations
  ORDER BY name
`;
const appliedMigrations = new Map(
  appliedRows.map((row) => [String(row.name), String(row.checksum)]),
);

let appliedCount = 0;

for (const file of migrationFiles) {
  const migration = await readFile(resolve(migrationsDirectory, file), "utf8");
  const checksum = createHash("sha256").update(migration).digest("hex");
  const appliedChecksum = appliedMigrations.get(file);

  if (appliedChecksum) {
    if (appliedChecksum !== checksum) {
      throw new Error(
        `Migration ${file} was modified after it was applied. Create a new migration instead.`,
      );
    }

    console.log(`Skipped ${file} (already applied)`);
    continue;
  }

  const statements = migration
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  await sql.transaction((tx) => [
    ...statements.map((statement) => tx.query(statement)),
    tx`
      INSERT INTO schema_migrations (name, checksum)
      VALUES (${file}, ${checksum})
    `,
  ]);

  appliedCount += 1;
  console.log(`Applied ${file}`);
}

console.log(
  appliedCount === 0
    ? "Database is already up to date"
    : `Applied ${appliedCount} migration${appliedCount === 1 ? "" : "s"}`,
);
