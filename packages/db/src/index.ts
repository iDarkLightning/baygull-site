import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import * as relations from "./relations";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, {
  schema: { ...schema, ...relations },
});

export type DBClient = typeof db;
export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
