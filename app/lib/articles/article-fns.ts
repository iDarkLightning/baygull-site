import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { article, articlesToTopics } from "../db/schema";
import { notFound } from "@tanstack/react-router";

export const getArticleBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const queryResult = await db.query.article.findFirst({
      where: eq(article.slug, data.slug),
      with: {
        users: {
          with: {
            user: true,
          },
        },
        topics: {
          with: {
            topic: true,
          },
        },
      },
    });

    if (!queryResult) throw notFound();

    return queryResult;
  });

export const getAllArticles = createServerFn({ method: "GET" }).handler(
  async () => {
    return db.query.article.findMany({
      with: {
        users: {
          with: {
            user: true,
          },
        },
        topics: {
          with: {
            topic: true,
          },
        },
      },
      orderBy: (articles, { desc }) => desc(articles.publishedAt),
    });
  }
);

export type TArticlesList = Awaited<ReturnType<typeof getAllArticles>>;
