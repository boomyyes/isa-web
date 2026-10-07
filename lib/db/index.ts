// Postgres (Neon) for the admin workspace's relational data: calendar, forum,
// chat, finance. Certificates, forms and admin sessions stay in Upstash.
//
// Neon's HTTP driver: one HTTPS request per query, no pooled sockets, which is
// what serverless functions want. Built lazily so a missing DATABASE_URL fails
// the request that needs it rather than `next build`.

import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let client: NeonHttpDatabase<typeof schema> | null = null;

export function db(): NeonHttpDatabase<typeof schema> {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  client = drizzle(neon(url), { schema });
  return client;
}

export const dbConfigured = () => Boolean(process.env.DATABASE_URL);
