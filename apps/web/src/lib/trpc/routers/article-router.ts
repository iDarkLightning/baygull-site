import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns } from "drizzle-orm";
import DOMPurify from "isomorphic-dompurify";
import parse from "node-html-parser";
import { UTApi } from "uploadthing/server";
import { z } from "zod";
import { parseArticle } from "@baygull/db/article-parser";
import {
  article,
  articleMedia,
  articlesToTopics,
  publishDefaultContent,
  publishMeta,
  topic,
  user,
  usersToArticles,
} from "@baygull/db/schema";
import { createDriveClient } from "~/lib/google-drive";
import { type TRPCContext } from "../context";
import { publicProcedure } from "../init";
import { authedProcedure } from "../middleware/auth-middleware";
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

const getAllArticles = async (ctx: TRPCContext) => {
  const articles = await ctx.db.query.article.findMany({
    where: and(eq(article.type, "default"), eq(article.status, "published")),
    with: {
      publishMeta: true,
      publishDefaultContent: true,
      media: {
        where: eq(articleMedia.intent, "cover_img"),
      },
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

  return articles.map(({ users, topics, media: [coverImg], ...article }) => {
    const parsedArticle = parseArticle(
      { ...article, ...article.publishMeta, ...article.publishDefaultContent },
      "default",
      "published"
    );

    return {
      ...parsedArticle,
      coverImg,
      users,
      topics,
    };
  });
};

export const articleRouter = {
  draft: draftRouter,

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const [articleQuery] = await ctx.db
        .select({
          ...getTableColumns(article),
          ...getTableColumns(publishMeta),
          ...getTableColumns(publishDefaultContent),
        })
        .from(article)
        .leftJoin(publishMeta, eq(article.id, publishMeta.articleId))
        .leftJoin(
          publishDefaultContent,
          eq(article.id, publishDefaultContent.articleId)
        )
        .where(eq(publishMeta.slug, input.slug))
        .limit(1);

      const parsedArticle = parseArticle(articleQuery, "default", "published");

      const [[coverImg], users, topics] = await Promise.all([
        ctx.db
          .select()
          .from(articleMedia)
          .where(
            and(
              eq(articleMedia.articleId, parsedArticle.id),
              eq(articleMedia.intent, "cover_img")
            )
          )
          .limit(1),
        ctx.db
          .select({
            user: user,
          })
          .from(usersToArticles)
          .innerJoin(user, eq(usersToArticles.userId, user.id))
          .where(eq(usersToArticles.articleId, parsedArticle.id)),
        ctx.db
          .select({
            topic: topic,
          })
          .from(articlesToTopics)
          .innerJoin(topic, eq(articlesToTopics.articleId, topic.id))
          .where(eq(articlesToTopics.topicId, parsedArticle.id)),
      ]);

      if (!articleQuery) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        ...parsedArticle,
        users: users,
        topics,
        coverImg,
      };
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return getAllArticles(ctx);
  }),

  getHomePage: publicProcedure.query(async ({ ctx }) => {
    const articles = await getAllArticles(ctx);

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

  // publish: adminProcedure
  //   .input(
  //     z.object({
  //       title: z.string(),
  //       description: z.string(),
  //       slug: z.string(),
  //       coverImg: z.string().optional(),
  //       content: z.string(),
  //     })
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     if (!ctx.user) {
  //       throw new TRPCError({ code: "UNAUTHORIZED" });
  //     }

  //     const content = await processArticleContent(input.content);

  //     const [insertResult] = await ctx.db
  //       .insert(article)
  //       .values({
  //         title: input.title,
  //         slug: input.slug,
  //         description: input.description,
  //         coverImg: input.coverImg,
  //         content,
  //       })
  //       .returning();

  //     await ctx.db.insert(usersToArticles).values({
  //       articleId: insertResult.id,
  //       userId: ctx.user.id,
  //     });

  //     if (!!insertResult) {
  //       return { message: "ok" };
  //     }

  //     throw new Error("Error occured while creating draft!");
  //   }),
};
