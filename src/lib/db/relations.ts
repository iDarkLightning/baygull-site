import { relations } from "drizzle-orm";
import {
  article,
  usersToArticles,
  articlesToTopics,
  user,
  topic,
  usersToArticleDrafts,
  articleDraft,
  session,
} from "./schema";

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  articles: many(usersToArticles),
  drafts: many(usersToArticleDrafts),
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

export const usersToArticleDraftsRelations = relations(
  usersToArticleDrafts,
  ({ one }) => ({
    user: one(user, {
      fields: [usersToArticleDrafts.userId],
      references: [user.id],
    }),
    article: one(articleDraft, {
      fields: [usersToArticleDrafts.draftId],
      references: [articleDraft.id],
    }),
  })
);

export const articleDraftsRelations = relations(articleDraft, ({ many }) => ({
  users: many(usersToArticleDrafts),
}));

export const articleRelations = relations(article, ({ many }) => ({
  users: many(usersToArticles),
  topics: many(articlesToTopics),
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
