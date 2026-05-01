import { Pool } from "pg";

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Set it in your .env (example: postgresql://user:password@localhost:5432/dbname).",
  );
}

// If the server requires SCRAM auth, pg needs a non-empty string password.
try {
  const url = new URL(connectionString);
  const password = url.password;
  if (password == null || password.length === 0) {
    throw new Error(
      "DATABASE_URL is missing the password part (expected: postgresql://user:password@host:port/dbname).",
    );
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  throw new Error(`Invalid DATABASE_URL: ${message}`);
}

const sslEnabled = parseBoolean(process.env.DATABASE_SSL, false);

export const pool = new Pool({
  connectionString,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
});
