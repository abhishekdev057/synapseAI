import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.",
  );
}

// Neon's serverless HTTP driver — one round-trip per query, no pool to manage.
// Ideal for Next.js route handlers running on serverless / edge-style runtimes.
const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
export { schema };
