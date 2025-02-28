import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { article } from "../db/schema";
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
