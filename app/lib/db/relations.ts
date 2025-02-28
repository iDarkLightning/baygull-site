import { relations } from "drizzle-orm";
import {
  article,
  usersToArticles,
  articlesToTopics,
  user,
  topic,
} from "./schema";

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
