import { SQL, sql } from "drizzle-orm";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";

export type ColumnToType<T> = T extends SQLiteColumn ? T["_"]["data"] : T;

export const jsonObject = <T extends {}>(object: T) => {
  const query = sql.empty();
  query.append(sql`JSON_OBJECT(`);

  const entries = Object.entries(object);

  entries.forEach(([key, value], index) => {
    query.append(sql`${key}, ${value}`);
    if (index !== entries.length - 1) {
      query.append(sql`, `);
    }
  });

  query.append(sql`)`);

  return query.mapWith(
    (val) =>
      JSON.parse(val) as {
        [K in keyof T]: ColumnToType<T[K]>;
      }
  );
};

export const jsonGroupArray = <
  T extends SQL<any>,
  U = T extends SQL<infer U> ? U : never
>(
  inner: T
) => {
  const query = sql.empty();

  query.append(sql`JSON_GROUP_ARRAY(`);
  query.append(inner);
  query.append(sql`)`);

  return query.mapWith((val) => JSON.parse(val) as U[]);
};

export const caseWhen = <T>(
  branches: {
    when: SQL;
    then: SQL<T> | SQL.Aliased<any> | SQLiteColumn<any>;
  }[],
  elseBranch?: SQL<T>
): SQL<T> => {
  const query = sql.empty();

  query.append(sql`CASE`);

  branches.forEach((branch) => {
    query.append(sql` WHEN ${branch.when} THEN ${branch.then}`);
  });

  if (elseBranch) {
    query.append(sql` ELSE ${elseBranch}`);
  }

  query.append(sql`END`);

  return query as SQL<T>;
};
