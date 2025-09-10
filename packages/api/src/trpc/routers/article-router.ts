import { publishMeta } from "@baygull/db/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { createDriveClient } from "../../google-drive";
import { articleQueryBuilder } from "../../services/article-service";
import { publicProcedure } from "../init";
import { authedProcedure } from "../middleware/auth-middleware";
import { manageArticleRouter } from "./article-manage-router";

export const articleRouter = {
  manage: manageArticleRouter,

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const query = await ctx.uniqueResultOrThrow(
        articleQueryBuilder(ctx.db, "published")
          .includeMeta()
          .includeDescription()
          .withUsers()
          .withTopics()
          .withCoverImage()
          .with(
            (ext) =>
              void ext.push((qb) => qb.where(eq(publishMeta.slug, input.slug)))
          )
          .run()
      );

      return query;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const articles = await articleQueryBuilder(ctx.db, "published")
      .includeMeta()
      .includeDescription()
      .withUsers()
      .withTopics()
      .withCoverImage()
      .with(
        (ext) =>
          void ext.push((qb) => qb.orderBy(desc(publishMeta.publishedAt)))
      )
      .run();

    return articles;
  }),

  getHomePage: publicProcedure.query(async ({ ctx }) => {
    const articles = await articleQueryBuilder(ctx.db, "published")
      .includeMeta()
      .includeDescription()
      .withUsers()
      .withTopics()
      .withCoverImage()
      .with(
        (ext) =>
          void ext.push((qb) => qb.orderBy(desc(publishMeta.publishedAt)))
      )
      .run();

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
};
