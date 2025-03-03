import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  article,
  articleDraft,
  usersToArticleDrafts,
  usersToArticles,
} from "../db/schema";
import { createDriveClient } from "../google-drive";
import { getUser } from "../auth/auth-fns";
import { setResponseStatus } from "@tanstack/react-start/server";
import { parse } from "node-html-parser";
import { UTApi } from "uploadthing/server";
import DOMPurify from "isomorphic-dompurify";

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

    if (response.status !== 200)
      throw new Error("Error occured during creating copy!");

    return { id: response.data.id as string };
  });

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

export const createArticleDraft = createServerFn({
  method: "POST",
})
  .validator(
    z.object({
      title: z.string(),
      description: z.string(),
      coverImg: z.string().optional(),
      docId: z.string(),
      keyIdeas: z.string(),
      message: z.string(),
    })
  )
  .handler(async ({ data, context }) => {
    const user = await getUser();

    if (!user) {
      setResponseStatus(401);
      return { message: "unauthorized" };
    }

    const copyResult = await createArticleEditingCopy({
      data: {
        articleName: data.title,
        fileId: data.docId,
      },
    });

    const [insertResult] = await db
      .insert(articleDraft)
      .values({
        title: data.title,
        description: data.description,
        coverImg: data.coverImg,
        originalUrl: `https://docs.google.com/document/d/${data.docId}`,
        editingUrl: `https://docs.google.com/document/d/${copyResult.id}`,
        keyIdeas: data.keyIdeas,
        message: data.message,
      })
      .returning();

    await db.insert(usersToArticleDrafts).values({
      draftId: insertResult.id,
      userId: user.id,
    });

    if (!!insertResult) {
      return { message: "ok" };
    }

    throw new Error("Error occured while creating draft!");
  });

export const getArticleDraftById = createServerFn({ method: "GET" })
  .validator(z.object({ draftId: z.string() }))
  .handler(async ({ data }) => {
    const draft = await db.query.articleDraft.findFirst({
      where: eq(articleDraft.id, data.draftId),
      with: {
        users: {
          columns: {},
          with: {
            user: true,
          },
        },
      },
    });

    if (!draft) throw notFound();

    const drive = createDriveClient();

    const fileId = new URL(draft.editingUrl).pathname.split("/").at(3);

    const response = await drive.files.export({
      mimeType: "text/html",
      fileId,
    });

    if (response.status !== 200)
      throw new Error("Error occured while exporting to markdown!");

    return { ...draft, content: response.data as string };
  });

export type TArticleDraft = Awaited<ReturnType<typeof getArticleDraftById>>;

const processArticleContent = async (htmlContent: string) => {
  console.log("PARSING...");
  const parsed = parse(htmlContent);
  console.log(parsed.toString());
  const imgs = parsed.querySelectorAll("img");

  const urls = imgs.map((img) => img.getAttribute("src")!);
  console.log(urls);

  const utapi = new UTApi();

  const uploadResult = await utapi.uploadFilesFromUrl(urls);

  imgs.forEach((img, index) => {
    if (uploadResult[index].error) {
      console.log(index, uploadResult[index].error);
      throw new Error("Error occurred parsing!");
    }
    img.setAttribute("src", uploadResult[index].data.ufsUrl);
  });

  const oldImgs = parsed.querySelectorAll("img");

  imgs.forEach((img, index) => parsed.exchangeChild(oldImgs[index], img));

  console.log(parsed.toString());

  return DOMPurify.sanitize(parsed.toString());
};

export const publishArticle = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string(),
      description: z.string(),
      slug: z.string(),
      coverImg: z.string().optional(),
      content: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const user = await getUser();

    if (!user) {
      setResponseStatus(401);
      return { message: "unauthorized" };
    }

    const content = await processArticleContent(data.content);

    const [insertResult] = await db
      .insert(article)
      .values({
        title: data.title,
        slug: data.slug,
        description: data.description,
        coverImg: data.coverImg,
        content,
      })
      .returning();

    await db.insert(usersToArticles).values({
      articleId: insertResult.id,
      userId: user.id,
    });

    if (!!insertResult) {
      return { message: "ok" };
    }

    throw new Error("Error occured while creating draft!");
  });
