import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const MIGRATIONS_DIR = path.resolve('src/db/migrations');

async function runMigrations() {
  const client = new Client({
    host: process.env["DB_HOST"] ?? "localhost",
    port: Number(process.env["DB_PORT"] ?? "5432"),
    database: process.env["DB_NAME"] ?? "url_shortener",
    user: process.env["DB_USER"] ?? "postgres",
    password: process.env["DB_PASSWORD"] ?? "",
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL for migrations');

    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL PRIMARY KEY,
        filename    VARCHAR(255) NOT NULL UNIQUE,
        ran_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Get list of already applied migrations
    const { rows: appliedRows } = await client.query(
      'SELECT filename FROM _migrations ORDER BY id ASC'
    );
    const applied = new Set(appliedRows.map((r) => r.filename));

    // Read and sort all .sql files
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort(); // sorts in order

    let ranCount = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`Skipping (already applied): ${file}`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`Running migration: ${file}`);

      // Run the migration and record it in a single transaction
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`Applied: ${file}`);
        ranCount++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Failed on: ${file}`, err);
        throw err; // stop everything 
      }
    }

    if (ranCount === 0) {
      console.log('All migrations already up to date.');
    } else {
      console.log(`\n ${ranCount} migration(s) applied successfully.`);
    }
  } finally {
    await client.end();
  }
}

runMigrations().catch((err) => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});