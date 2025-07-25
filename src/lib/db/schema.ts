import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  primaryKey,
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
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  coverImg: text("cover_img"),
  content: text("content").notNull(),
  isHighlighted: integer("is_highlighted", { mode: "boolean" })
    .notNull()
    .default(false),
  publishedAt: integer("published_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const articleDraft = sqliteTable("article_draft", {
  id: text("id")
    .primaryKey()
    .unique()
    .$defaultFn(() => createId()),
  /**
   * 0 = Default
   * 1 = Headline
   * 2 = Graphic
   */
  type: integer("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  // coverImg: text("cover_img"),
  // graphic: text("graphic"),
  originalUrl: text("original_url"),
  editingUrl: text("editing_url"),
  keyIdeas: text("key_ideas").notNull(),
  message: text("message").notNull(),
  /**
   * 0 = Active
   * 1 = Published
   * 2 = Archived
   */
  status: integer("status").notNull().default(0),
  submittedAt: integer("submitted_at")
    .notNull()
    .default(sql`(current_timestamp)`),
});

export const articleMedia = sqliteTable("article_media", {
  id: text("id")
    .primaryKey()
    .unique()
    .$defaultFn(() => createId()),
  articleId: text("article_id").references(() => article.id, {
    onDelete: "cascade",
  }),
  draftId: text("draft_id").references(() => articleDraft.id, {
    onDelete: "cascade",
  }),
  /**
   * 0 = Image
   */
  type: integer("type").notNull(),
  /**
   * 0 = Cover Image
   * 1 = Default Content Image
   * 2 = Graphic Content Image
   */
  intent: integer("intent").notNull(),
  url: text("url").notNull(),
  size: integer("size").notNull(),
});

export const usersToArticleDrafts = sqliteTable(
  "users_to_article_drafts",
  {
    userId: text("userId")
      .notNull()
      .references(() => user.id),
    draftId: text("draftId")
      .notNull()
      .references(() => articleDraft.id),
  },
  (table) => [primaryKey({ columns: [table.userId, table.draftId] })]
);

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
