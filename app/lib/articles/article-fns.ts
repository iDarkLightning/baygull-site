import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { article } from "../db/schema";
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

// https://docs.google.com/document/d/1CRF-t2Bck4o2oNwmR3outXpHk4WWmibJs4eToZzePaw/edit?tab=t.0

export const getGoogleDocFromUrl = createServerFn({
  method: "GET",
})
  .validator(z.object({ docUrl: z.string() }))
  .handler(async ({ data }) => {
    const drive = createDriveClient();
    const url = new URL(data.docUrl);

    if (url.hostname !== "docs.google.com")
      throw new Error("Invalid URL! Please use a docs.google.com link!");

    const fileId = url.pathname.split("/").at(3);

    const response = await drive.files.get({
      fileId,
    });

    if (response.status !== 200)
      throw new Error(
        "We can't seem to access that document, please make sure that link sharing is enabled!"
      );

    return {
      name: response.data.name as string,
      id: response.data.id as string,
    };
  });
