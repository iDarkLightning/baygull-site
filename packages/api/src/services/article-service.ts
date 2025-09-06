import { db, type DBClient } from "@baygull/db";
import {
  archiveMeta,
  article,
  articleMedia,
  articlesToTopics,
  draftDefaultContent,
  draftMeta,
  graphicContent,
  publishDefaultContent,
  publishMeta,
  topic,
  user,
  usersToArticles,
} from "@baygull/db/schema";
import { caseWhen, jsonGroupArray, jsonObject } from "@baygull/db/utils";
import { and, eq, getTableColumns, sql, SQL } from "drizzle-orm";
import {
  SelectedFields,
  SQLiteColumn,
  SQLiteSelect,
} from "drizzle-orm/sqlite-core";

type ResolveSQLType<T> = T extends SQLiteColumn
  ? T["_"]["data"]
  : T extends SQL<infer U>
  ? U
  : T extends SQL.Aliased<infer U>
  ? U
  : T;

const tableMap = {
  draft: draftMeta,
  published: publishMeta,
  archived: archiveMeta,
} as const;

export const articleQueryBuilder = <
  S extends "draft" | "published" | "archived"
>(
  db: DBClient,
  status: S
) => {
  const extensions: (<T extends SQLiteSelect>(qb: T) => void)[] = [];

  const createBuilder = <T extends SelectedFields>(fields: T) => {
    return {
      with(cb: (exts: typeof extensions) => SelectedFields | undefined) {
        const result = cb(extensions);
        const newFields = result ? { ...fields, ...result } : fields;

        return createBuilder(newFields);
      },

      includeMeta() {
        const table = tableMap[status];
        const newFields = getTableColumns(table);

        extensions.push((qb) =>
          qb.leftJoin(table, eq(table.articleId, article.id))
        );

        return createBuilder({ ...fields, ...newFields });
      },

      includeDescription() {
        const defaultTable =
          status === "draft" ? draftDefaultContent : publishDefaultContent;

        extensions.push((qb) =>
          qb
            .leftJoin(
              defaultTable,
              and(
                eq(defaultTable.articleId, article.id),
                eq(article.type, "default")
              )
            )
            .leftJoin(
              graphicContent,
              and(
                eq(graphicContent.articleId, article.id),
                eq(article.type, "graphic")
              )
            )
        );

        return createBuilder({
          ...fields,
          description: caseWhen<string | null>([
            {
              when: eq(article.type, "default"),
              then: defaultTable.description,
            },
            {
              when: eq(article.type, "graphic"),
              then: graphicContent.description,
            },
          ]),
        });
      },

      withCoverImage() {
        const sq = db
          .select({
            articleId: articleMedia.articleId,
            coverMedia: jsonObject({
              id: articleMedia.id,
              url: articleMedia.url,
              size: articleMedia.size,
              fileName: articleMedia.fileName,
            }).as("cover_media"),
          })
          .from(articleMedia)
          .where(eq(articleMedia.intent, "cover_img"))
          .limit(1)
          .as("cover_media_sub");

        extensions.push((qb) => qb.leftJoin(sq, eq(article.id, sq.articleId)));

        return createBuilder({
          ...fields,
          coverImg: sql`${sq.coverMedia}`.mapWith((val) =>
            val === null
              ? (val as null)
              : (JSON.parse(val) as typeof sq.coverMedia._.type)
          ),
        });
      },

      withUsers() {
        const sq = db
          .select({
            articleId: usersToArticles.articleId,
            users: jsonGroupArray(
              jsonObject({
                id: user.id,
                name: user.name,
                image: user.image,
                email: user.email,
              })
            ).as("users"),
          })
          .from(usersToArticles)
          .innerJoin(user, eq(user.id, usersToArticles.userId))
          .groupBy(usersToArticles.articleId)
          .as("users_sub");

        extensions.push((qb) => qb.innerJoin(sq, eq(article.id, sq.articleId)));

        return createBuilder({ ...fields, users: sq.users });
      },

      withTopics() {
        const sq = db
          .select({
            articleId: articlesToTopics.articleId,
            topics: jsonGroupArray(
              jsonObject({
                id: topic.id,
                name: topic.name,
              })
            ).as("topics"),
          })
          .from(articlesToTopics)
          .innerJoin(topic, eq(topic.id, articlesToTopics.topicId))
          .groupBy(articlesToTopics.articleId)
          .as("topics_sub");

        extensions.push((qb) => qb.leftJoin(sq, eq(article.id, sq.articleId)));

        return createBuilder({
          ...fields,
          topics: sql`COALESCE(${sq.topics}, '[]')`.mapWith(
            (val) => JSON.parse(val) as typeof sq.topics._.type
          ),
        });
      },

      async run(): Promise<
        {
          [K in keyof T]: ResolveSQLType<T[K]>;
        }[]
      > {
        const qb = db
          .select(fields)
          .from(article)
          .where(eq(article.status, status))
          .$dynamic();

        extensions.forEach((extend) => extend(qb));
        return qb;
      },
    };
  };

  const { status: _, ...cols } = getTableColumns(article);

  return createBuilder(cols);
};
