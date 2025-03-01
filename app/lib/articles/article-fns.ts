import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { article, articlesToTopics } from "../db/schema";
import { notFound } from "@tanstack/react-router";
import { createDriveClient } from "../google-drive";

const ARTICLE_FOLDER_ID = "18Vc7DIU6zxB8cmyeDb2izdB_9p3HtByT";

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

export const createArticleEditingCopy = createServerFn({
  method: "POST",
})
  .validator(z.object({ articleName: z.string(), fileId: z.string() }))
  .handler(async ({ data }) => {
    const drive = createDriveClient();

    const response = await drive.files.copy({
      fileId: data.fileId,
      requestBody: {
        name: `Editing Copy - ${data.articleName}`,
        parents: [ARTICLE_FOLDER_ID],
      },
    });

    return response.status;
  });
