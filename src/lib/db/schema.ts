import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  blob,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  /**
   * 0 = User
   * 1 = Published
   * 2 = Admin
   */

  role: integer("role").notNull().default(0),
});

export type User = typeof user.$inferInsert;

export const session = sqliteTable("session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const article = sqliteTable("article", {
  id: text("id")
    .primaryKey()
    .unique()
    .$defaultFn(() => createId()),

  type: text("type", { enum: ["default", "headline", "graphic"] }).notNull(),
  status: text("status", {
    enum: ["draft", "published", "archived"],
  }).notNull(),

  title: text("title").notNull(),

  createdAt: text("created_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const publishMeta = sqliteTable("publish_meta", {
  articleId: text("article_id")
    .primaryKey()
    .references(() => article.id),
  slug: text("slug").notNull().unique(),
  deriveSlugFromTitle: integer("derive_slug_from_title", { mode: "boolean" })
    .notNull()
    .default(true),

  isHighlighted: integer("is_highlighted", { mode: "boolean" }),

  publishedAt: text("published_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const publishDefaultContent = sqliteTable("publish_default_content", {
  articleId: text("article_id")
    .primaryKey()
    .references(() => article.id),

  description: text("description").notNull(),

  content: text("content").notNull(),
});

export const draftMeta = sqliteTable("draft_meta", {
  articleId: text("article_id")
    .primaryKey()
    .references(() => article.id),

  keyIdeas: text("key_ideas").notNull(),
  message: text("message").notNull(),

  submittedAt: text("submitted_at")
    .notNull()
    .default(sql`(current_timestamp)`),

  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(current_timestamp)`)
    .$onUpdate(() => sql`(current_timestamp)`),
});

export const draftDefaultContent = sqliteTable("draft_default_content", {
  articleId: text("article_id")
    .primaryKey()
    .references(() => article.id),

  description: text("description").notNull(),

  content: text("content", { mode: "json" }),

  editingUrl: text("editingUrl").notNull(),
  originalUrl: text("originalUrl").notNull(),
});

export const archiveMeta = sqliteTable("archive_meta", {
  articleId: text("article_id")
    .primaryKey()
    .references(() => article.id),

  archivedAt: text("archived_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const graphicContent = sqliteTable("graphic_default_content", {
  articleId: text("article_id")
    .primaryKey()
    .references(() => article.id),

  description: text("description").notNull(),
});

export const articleMedia = sqliteTable("article_media", {
  id: text("id").primaryKey().notNull().$defaultFn(createId),

  articleId: text("article_id").references(() => article.id),

  intent: text("intent", {
    enum: ["cover_img", "content_img"],
  }).notNull(),

  caption: text("caption").notNull(),
  markedForDeletion: text("marked_for_deletion"),

  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),

  url: text("url").notNull().unique(),
  size: integer("size").notNull(),

  ufsId: text("ufs_id").notNull().unique(),
});

export type ArticleMedia = typeof articleMedia.$inferSelect;

export const usersToArticles = sqliteTable(
  "users_to_articles",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    articleId: text("articleId")
      .notNull()
      .references(() => article.id),
  },
  (table) => [primaryKey({ columns: [table.userId, table.articleId] })]
);

export const topic = sqliteTable("topic", {
  id: text("id")
    .primaryKey()
    .unique()
    .$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
});

export const articlesToTopics = sqliteTable(
  "articles_to_topics",
  {
    articleId: text("articleId")
      .notNull()
      .references(() => article.id),
    topicId: text("topicId")
      .notNull()
      .references(() => topic.id),
  },
  (table) => [primaryKey({ columns: [table.articleId, table.topicId] })]
);
