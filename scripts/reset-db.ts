import { sql } from "drizzle-orm";

const resetDB = async () => {
  const { db } = await import("@baygull/db");

  console.log("\n---FETCHING TABLES TO DELETE---");
  const { rows: tables } = await db.run(
    sql`SELECT name FROM sqlite_master WHERE type='table';`
  );
  console.log("---DELETING ALL VALUES FROM THE FOLLOWING TABLES---\n");

  tables.forEach((table) => console.log(table.name));

  await db.run(sql`PRAGMA foreign_keys = OFF;`);

  await Promise.all(
    tables.toReversed().map((table) => db.run(`DELETE FROM ${table.name};`))
  );

  console.log("\n\n---DATABASE RESET---");

  await db.run(sql`PRAGMA foreign_keys = ON;`);
};

resetDB().catch(console.error);
