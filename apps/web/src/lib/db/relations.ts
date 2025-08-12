import { relations } from "drizzle-orm";
import {
  article,
  usersToArticles,
  articlesToTopics,
  user,
  topic,
  session,
  articleMedia,
  publishMeta,
  draftMeta,
  archiveMeta,
  publishDefaultContent,
  draftDefaultContent,
  graphicContent,
} from "./schema";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  articles: many(usersToArticles),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const usersToArticlesRelations = relations(
  usersToArticles,
  ({ one }) => ({
    user: one(user, {
      fields: [usersToArticles.userId],
      references: [user.id],
    }),
    article: one(article, {
      fields: [usersToArticles.articleId],
      references: [article.id],
    }),
  })
);

export const articleRelations = relations(article, ({ many, one }) => ({
  users: many(usersToArticles),
  topics: many(articlesToTopics),
  media: many(articleMedia),

  publishMeta: one(publishMeta, {
    fields: [article.id],
    references: [publishMeta.articleId],
  }),
  draftMeta: one(draftMeta, {
    fields: [article.id],
    references: [draftMeta.articleId],
  }),
  archiveMeta: one(archiveMeta, {
    fields: [article.id],
    references: [archiveMeta.articleId],
  }),

  publishDefaultContent: one(publishDefaultContent, {
    fields: [article.id],
    references: [publishDefaultContent.articleId],
  }),
  draftDefaultContent: one(draftDefaultContent, {
    fields: [article.id],
    references: [draftDefaultContent.articleId],
  }),

  graphicContent: one(graphicContent, {
    fields: [article.id],
    references: [graphicContent.articleId],
  }),
}));

export const publishMetaRelations = relations(publishMeta, ({ one }) => ({
  article: one(article, {
    fields: [publishMeta.articleId],
    references: [article.id],
  }),
}));

export const draftMetaRelations = relations(draftMeta, ({ one }) => ({
  article: one(article, {
    fields: [draftMeta.articleId],
    references: [article.id],
  }),
}));

export const archiveMetaRelations = relations(archiveMeta, ({ one }) => ({
  article: one(article, {
    fields: [archiveMeta.articleId],
    references: [article.id],
  }),
}));

export const publishDefaultContentRelations = relations(
  publishDefaultContent,
  ({ one }) => ({
    article: one(article, {
      fields: [publishDefaultContent.articleId],
      references: [article.id],
    }),
  })
);

export const draftDefaultContentRelations = relations(
  draftDefaultContent,
  ({ one }) => ({
    article: one(article, {
      fields: [draftDefaultContent.articleId],
      references: [article.id],
    }),
  })
);

export const graphicContentRelations = relations(graphicContent, ({ one }) => ({
  article: one(article, {
    fields: [graphicContent.articleId],
    references: [article.id],
  }),
}));

export const articleMedaRelations = relations(articleMedia, ({ one }) => ({
  article: one(article, {
    fields: [articleMedia.articleId],
    references: [article.id],
  }),
}));

export const topicRelations = relations(topic, ({ many }) => ({
  articles: many(articlesToTopics),
}));

export const articlesToTopicsRelations = relations(
  articlesToTopics,
  ({ one }) => ({
    article: one(article, {
      fields: [articlesToTopics.articleId],
      references: [article.id],
    }),
    topic: one(topic, {
      fields: [articlesToTopics.topicId],
      references: [topic.id],
    }),
  })
);
