import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import DOMPurify from "isomorphic-dompurify";
import parse from "node-html-parser";
import { UTApi } from "uploadthing/server";
import { z } from "zod";
import { db } from "~/lib/db";
import { article, usersToArticles } from "~/lib/db/schema";
import { createDriveClient } from "~/lib/google-drive";
import { publicProcedure } from "../init";
import { adminProcedure, authedProcedure } from "../middleware/auth-middleware";
import { draftRouter } from "./draft-router";

const processArticleContent = async (htmlContent: string) => {
  const parsed = parse(htmlContent);
  const imgs = parsed.querySelectorAll("img");

  const urls = imgs.map((img) => img.getAttribute("src")!);

  const utapi = new UTApi();
  const uploadResult = await utapi.uploadFilesFromUrl(urls);

  imgs.forEach((img, index) => {
    if (uploadResult[index].error) {
      throw new Error("Error occurred parsing!");
    }
    img.setAttribute("src", uploadResult[index].data.ufsUrl);
  });

  const oldImgs = parsed.querySelectorAll("img");
  imgs.forEach((img, index) => parsed.exchangeChild(oldImgs[index], img));

  return DOMPurify.sanitize(parsed.toString());
};

const getAllArticles = async () =>
  db.query.article.findMany({
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

export const articleRouter = {
  draft: draftRouter,

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const queryResult = await db.query.article.findFirst({
        where: eq(article.slug, input.slug),
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

      if (!queryResult) throw new TRPCError({ code: "NOT_FOUND" });

      return queryResult;
    }),

  getAll: publicProcedure.query(async () => {
    return getAllArticles();
  }),

  getHomePage: publicProcedure.query(async () => {
    const articles = await getAllArticles();

    if (articles.length === 0) {
      return {
        latest: null,
        highlights: [],
        recent: [],
      };
    }

    return {
      latest: articles[0],
      highlights: articles.slice(1).filter((a) => a.isHighlighted),
      recent: articles
        .slice(1)
        .filter((a) => !a.isHighlighted)
        .slice(0, Math.min(8, articles.length)),
    };
  }),

  getGoogleDocFromUrl: authedProcedure
    .input(z.object({ docUrl: z.string().optional() }))
    .query(async ({ input }) => {
      if (!input.docUrl) return null;

      const drive = createDriveClient();
      const url = new URL(input.docUrl);

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
    }),

  publish: adminProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        slug: z.string(),
        coverImg: z.string().optional(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const content = await processArticleContent(input.content);

      const [insertResult] = await db
        .insert(article)
        .values({
          title: input.title,
          slug: input.slug,
          description: input.description,
          coverImg: input.coverImg,
          content,
        })
        .returning();

      await db.insert(usersToArticles).values({
        articleId: insertResult.id,
        userId: ctx.user.id,
      });

      if (!!insertResult) {
        return { message: "ok" };
      }

      throw new Error("Error occured while creating draft!");
    }),
};
