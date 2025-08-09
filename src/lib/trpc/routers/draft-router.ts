import { createId, isCuid } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import { and, count, eq, like, not, sql } from "drizzle-orm";
import slugify from "slugify";
import { UTApi } from "uploadthing/server";
import { z } from "zod";
import { db } from "~/lib/db";
import { parseArticle } from "~/lib/db/article-parser";
import {
  article,
  articleMedia,
  articlesToTopics,
  draftDefaultContent,
  draftMeta,
  graphicContent,
  publishMeta,
  topic,
  usersToArticles,
} from "~/lib/db/schema";
import { createDriveClient } from "~/lib/google-drive";
import { adminProcedure, authedProcedure } from "../middleware/auth-middleware";

const ARTICLE_FOLDER_ID = "18Vc7DIU6zxB8cmyeDb2izdB_9p3HtByT";

const createArticleEditingCopy = async (data: {
  articleName: string;
  fileId: string;
}) => {
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
};

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const setUpdatedTime = async (tx: Transaction, id: string) => {
  await tx
    .update(draftMeta)
    .set({
      updatedAt: sql`current_timestamp`,
    })
    .where(eq(draftMeta.articleId, id));
};

export const draftRouter = {
  // test: publicProcedure.query(async ({ ctx }) => {
  //   const result = await ctx.db.all(sql`
  //       SELECT ${article.id}, ${article.title}, json_group_array(
  //         json_object('name', ${user.name}, 'id', ${user.id})) AS 'users' FROM ${article}
  //       INNER JOIN ${publishMeta} ON ${article.id} = ${publishMeta.articleId}
  //       INNER JOIN ${usersToArticles} ON ${usersToArticles.articleId} = ${article.id}
  //       INNER JOIN ${user} on ${user.id} = ${usersToArticles.userId}
  //       GROUP BY ${article.id}
  //     `);

  //   const ormResult = await ctx.db
  //     .select({
  //       id: article.id,
  //       title: article.title,
  //       users:
  //         sql`json_group_array(json_object('id', ${user.id}, 'name', ${user.name}))`.as(
  //           "users"
  //         ),
  //     })
  //     .from(article)
  //     .innerJoin(publishMeta, eq(article.id, publishMeta.articleId))
  //     .innerJoin(usersToArticles, eq(article.id, usersToArticles.articleId))
  //     .innerJoin(user, eq(user.id, usersToArticles.userId))
  //     .groupBy(article.id);

  //   return {
  //     result,
  //     ormResult,
  //   };
  // }),

  getAll: adminProcedure
    .input(
      z.object({
        status: z.enum(["draft", "published", "archived"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const articles = await ctx.db.query.article.findMany({
        where: and(eq(article.status, input.status)),
        with: {
          publishMeta: true,
          draftMeta: true,
          archiveMeta: true,
          publishDefaultContent: true,
          draftDefaultContent: true,
          graphicContent: true,
          users: {
            with: {
              user: true,
            },
          },
        },
      });

      return articles.map((article) => {
        const statusMeta =
          article.status === "published"
            ? article.publishMeta
            : article.status === "draft"
            ? { ...article.draftMeta, publishMeta: article.publishMeta }
            : article.archiveMeta;

        const content =
          article.type === "graphic"
            ? { ...article.graphicContent }
            : article.type === "default"
            ? article.status === "draft"
              ? article.draftDefaultContent
              : article.status === "published"
              ? article.publishDefaultContent
              : ({} as Record<string, never>)
            : ({} as Record<string, never>);

        return {
          ...parseArticle(
            {
              id: article.id,
              type: article.type,
              status: article.status,
              title: article.title,
              createdAt: article.createdAt,
              ...statusMeta,
              ...content,
            },
            article.type,
            article.status
          ),
          users: article.users,
        };
      });
    }),

  getById: authedProcedure
    .input(z.object({ draftId: z.string() }))
    .query(async ({ input, ctx }) => {
      const draft = await ctx.db.query.article.findFirst({
        where: and(eq(article.id, input.draftId), eq(article.status, "draft")),
        with: {
          draftMeta: true,
          publishMeta: true,
          draftDefaultContent: true,
          graphicContent: true,
          media: {
            limit: 1,
            where: eq(articleMedia.intent, "cover_img"),
          },
          users: {
            columns: {},
            with: {
              user: true,
            },
          },
          topics: {
            columns: {},
            with: {
              topic: true,
            },
          },
        },
      });

      if (!draft) throw new TRPCError({ code: "NOT_FOUND" });

      const articleParse = parseArticle(
        {
          ...draft,
          ...draft.draftMeta,
          ...(draft.type === "default"
            ? draft.draftDefaultContent
            : draft.graphicContent),
        },
        draft.type,
        "draft"
      );

      return {
        ...articleParse,
        users: draft.users,
        topics: draft.topics,
        coverImg: draft.media[0],
      };
    }),

  create: authedProcedure
    .input(
      z.object({
        title: z.string(),
        type: z.enum(["default", "headline", "graphic"]),
        description: z.string().optional(),
        media: z.array(
          z.object({
            mimeType: z.string(),
            url: z.string().url(),
            size: z.number(),
            fileName: z.string(),
            ufsId: z.string(),
          })
        ),
        docId: z.string().optional(),
        keyIdeas: z.string(),
        message: z.string(),
        collaborators: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const resultId = await ctx.db.transaction(async (tx) => {
        const [result] = await tx
          .insert(article)
          .values({
            title: input.title,
            status: "draft",
            type: input.type,
          })
          .returning({ articleId: article.id });

        const { articleId } = result!;

        await tx.insert(draftMeta).values({
          articleId,
          message: input.message,
          keyIdeas: input.keyIdeas,
        });

        await tx.insert(publishMeta).values({
          articleId,
          slug: slugify(input.title, {
            lower: true,
            trim: true,
            strict: true,
          }),
        });

        if (input.type === "default") {
          const copyResult = await createArticleEditingCopy({
            articleName: input.title,
            fileId: input.docId!,
          });

          await tx.insert(draftDefaultContent).values({
            articleId,
            description: input.description!,
            originalUrl: `https://docs.google.com/document/d/${input.docId}`,
            editingUrl: `https://docs.google.com/document/d/${copyResult.id}`,
          });
        } else if (input.type === "graphic") {
          await tx.insert(graphicContent).values({
            articleId,
            description: input.description!,
          });
        }

        await tx.insert(usersToArticles).values([
          {
            articleId,
            userId: ctx.user.id,
          },
          ...input.collaborators.map((userId) => ({
            articleId,
            userId,
          })),
        ]);

        if (input.media.length > 0) {
          await tx.insert(articleMedia).values(
            input.media.map((media) => ({
              articleId,
              mimeType: media.mimeType,
              intent:
                input.type === "graphic"
                  ? ("content_img" as const)
                  : ("cover_img" as const),
              url: media.url,
              size: media.size,
              fileName: media.fileName,
              ufsId: media.ufsId,
            }))
          );
        }

        return articleId;
      });

      return {
        message: "ok",
        draftId: resultId,
      };
    }),

  updateTitle: adminProcedure
    .input(
      z.object({
        id: z.string().refine(isCuid),
        title: z.string().nonempty(),
        deriveSlug: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await ctx.db.transaction(async (tx) => {
        const [{ id }] = await tx
          .update(article)
          .set({
            title: input.title,
          })
          .where(eq(article.id, input.id))
          .returning({ id: article.id });

        if (input.deriveSlug) {
          const derivedSlug = slugify(input.title, {
            lower: true,
            strict: true,
            trim: true,
          });

          const [{ count: slugCount }] = await tx
            .select({ count: count() })
            .from(publishMeta)
            .where(like(publishMeta.slug, `${derivedSlug}%`));

          await tx
            .update(publishMeta)
            .set({
              slug:
                slugCount === 0
                  ? derivedSlug
                  : `${derivedSlug}-${slugCount + 1}`,
            })
            .where(eq(publishMeta.articleId, input.id));
        }

        await setUpdatedTime(tx, input.id);
        return id;
      });

      return id;
    }),

  validateSlug: adminProcedure
    .input(z.object({ id: z.string().refine(isCuid), slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const [{ count: rows }] = await ctx.db
        .select({ count: count() })
        .from(publishMeta)
        .where(
          and(
            eq(publishMeta.slug, input.slug),
            not(eq(publishMeta.articleId, input.id))
          )
        );

      if (rows > 0)
        throw new TRPCError({
          code: "CONFLICT",
          message: "That slug is taken!",
        });
      return rows;
    }),

  updateType: adminProcedure
    .input(
      z.object({
        id: z.string().refine(isCuid),
        type: z.enum(["default", "headline", "graphic"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = await ctx.db.transaction(async (tx) => {
        const [{ id }] = await tx
          .update(article)
          .set({
            type: input.type,
          })
          .where(eq(article.id, input.id))
          .returning({
            id: article.id,
          });

        if (input.type === "default") {
          const [graphicDesc] = await tx
            .select({
              description: graphicContent.description,
            })
            .from(graphicContent)
            .where(eq(graphicContent.articleId, input.id))
            .limit(1);

          await tx
            .insert(draftDefaultContent)
            .values({
              articleId: input.id,
              description: !!graphicDesc ? graphicDesc.description : "",
              editingUrl: "",
              originalUrl: "",
            })
            .onConflictDoUpdate({
              target: draftDefaultContent.articleId,
              set: !!graphicDesc
                ? { description: graphicDesc.description }
                : {},
            });
        } else if (input.type === "graphic") {
          const [defaultDesc] = await tx
            .select({ description: draftDefaultContent.description })
            .from(draftDefaultContent)
            .where(eq(draftDefaultContent.articleId, input.id))
            .limit(1);

          await tx
            .insert(graphicContent)
            .values({
              articleId: input.id,
              description: !!defaultDesc ? defaultDesc.description : "",
            })
            .onConflictDoUpdate({
              target: graphicContent.articleId,
              set: !!defaultDesc
                ? { description: defaultDesc.description }
                : {},
            });
        }

        await setUpdatedTime(tx, input.id);
        return id;
      });

      return id;
    }),

  updateSlug: adminProcedure
    .input(
      z.object({
        id: z.string().refine(isCuid),
        data: z.discriminatedUnion("deriveFromTitle", [
          z.object({
            deriveFromTitle: z.literal(true),
          }),
          z.object({
            deriveFromTitle: z.literal(false),
            slug: z.string().nonempty().optional(),
          }),
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.data.deriveFromTitle) {
        await ctx.db.transaction(async (tx) => {
          const [{ title }] = await tx
            .select({ title: article.title })
            .from(article)
            .where(eq(article.id, input.id));

          const derivedSlug = slugify(title, {
            lower: true,
            strict: true,
            trim: true,
          });

          const [{ count: slugCount }] = await tx
            .select({ count: count() })
            .from(publishMeta)
            .where(
              and(
                like(publishMeta.slug, `${derivedSlug}%`),
                not(eq(publishMeta.articleId, input.id))
              )
            );

          await tx
            .update(publishMeta)
            .set({
              deriveSlugFromTitle: true,
              slug:
                slugCount === 0
                  ? derivedSlug
                  : `${derivedSlug}-${slugCount + 1}`,
            })
            .where(eq(publishMeta.articleId, input.id));

          await setUpdatedTime(tx, input.id);
        });
      } else {
        await ctx.db.transaction(async (tx) => {
          if (input.data.deriveFromTitle) return;

          await tx
            .update(publishMeta)
            .set({
              deriveSlugFromTitle: false,
              ...(input.data.slug ? { slug: input.data.slug } : {}),
            })
            .where(eq(publishMeta.articleId, input.id));

          await setUpdatedTime(tx, input.id);
        });
      }
    }),

  updateDescription: adminProcedure
    .input(
      z.object({
        id: z.string().refine(isCuid),
        type: z.enum(["default", "graphic"]),
        description: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        const table =
          input.type === "default" ? draftDefaultContent : graphicContent;

        await tx
          .update(table)
          .set({
            description: input.description,
          })
          .where(eq(table.articleId, input.id));

        await setUpdatedTime(tx, input.id);
      });
    }),

  updateAuthors: adminProcedure
    .input(
      z.object({
        id: z.string().refine(isCuid),
        authors: z.array(z.string()).nonempty(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await tx
          .delete(usersToArticles)
          .where(and(eq(usersToArticles.articleId, input.id)));

        await tx.insert(usersToArticles).values(
          input.authors.map((a) => ({
            userId: a,
            articleId: input.id,
          }))
        );

        await setUpdatedTime(tx, input.id);
      });
    }),

  updateTopics: adminProcedure
    .input(
      z.object({
        id: z.string().refine(isCuid),
        topics: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await tx.insert(topic).values(input.topics).onConflictDoNothing();

        await tx
          .delete(articlesToTopics)
          .where(and(eq(articlesToTopics.articleId, input.id)));

        await tx.insert(articlesToTopics).values(
          input.topics.map((t) => ({
            topicId: t.id,
            articleId: input.id,
          }))
        );

        await setUpdatedTime(tx, input.id);
      });
    }),

  updateCoverImage: adminProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.discriminatedUnion("action", [
          z.object({
            action: z.literal("delete"),
          }),
          z.object({
            action: z.literal("add"),
            fileName: z.string(),
            ufsId: z.string(),
            mimeType: z.string(),
            url: z.string(),
            size: z.number(),
          }),
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.data.action === "delete") {
        const ids = await ctx.db.transaction(async (tx) => {
          const ids = await tx
            .delete(articleMedia)
            .where(eq(articleMedia.articleId, input.id))
            .returning({
              ufsId: articleMedia.ufsId,
            });

          await setUpdatedTime(tx, input.id);

          return ids;
        });

        const utapi = new UTApi();
        return utapi.deleteFiles(ids.map((i) => i.ufsId));
      } else {
        await ctx.db.transaction(async (tx) => {
          if (input.data.action === "delete") return;

          await tx
            .insert(articleMedia)
            .values({
              intent: "cover_img",
              articleId: input.id,
              fileName: input.data.fileName,
              mimeType: input.data.mimeType,
              url: input.data.url,
              size: input.data.size,
              ufsId: input.data.ufsId,
            })
            .onConflictDoUpdate({
              target: articleMedia.articleId,
              set: {
                fileName: input.data.fileName,
                mimeType: input.data.mimeType,
                url: input.data.url,
                size: input.data.size,
              },
            });

          await setUpdatedTime(tx, input.id);
        });
      }
    }),

  updateDraftDefaultContent: adminProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transaction(async (tx) => {
        await tx
          .update(draftDefaultContent)
          .set({
            content: input.content,
          })
          .where(eq(draftDefaultContent.articleId, input.id));

        await setUpdatedTime(tx, input.id);
      });
    }),

  getDraftDefaultContentHTML: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const draftContent = await ctx.db.query.draftDefaultContent.findFirst({
        where: eq(draftDefaultContent.articleId, input.id),
      });

      if (!draftContent) throw new TRPCError({ code: "NOT_FOUND" });

      const drive = createDriveClient();

      const fileId = new URL(draftContent.editingUrl).pathname.split("/").at(3);

      const response = await drive.files.export({
        mimeType: "text/html",
        fileId,
      });

      return response.data as string;
    }),

  uploadExternalContentImage: adminProcedure
    .input(
      z.object({
        id: z.string(),
        url: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const media = await ctx.db
        .select()
        .from(articleMedia)
        .where(eq(articleMedia.url, input.url))
        .limit(1);

      if (media.length > 0) {
        return media[0];
      } else {
        const utapi = new UTApi();

        const [mime, buffer, fileName] = await (async () => {
          if (!input.url.startsWith("data:")) {
            // UTApi has a uploadFilesFromUrl but it doesn't preserve the file mime type so
            // we're doing it manually

            const fileResponse = await fetch(input.url);
            const mime =
              fileResponse.headers.get("Content-Type") ||
              "application/octet-stream";
            const buffer = await fileResponse.blob();

            return [
              mime,
              buffer,
              new URL(input.url).pathname.split("/").pop() ||
                `${input.id}-${createId()}`,
            ] as const;
          } else {
            const [header, data] = input.url.split(",");

            const mime =
              header.match(/:(.*?);/)?.[1] || "application/octet-stream";
            const buffer = Buffer.from(data, "base64");

            return [mime, buffer, `${input.id}-${createId()}`] as const;
          }
        })();

        const file = new File([buffer], fileName, {
          type: mime,
        });

        const uploadResult = (await utapi.uploadFiles([file]))[0];

        if (uploadResult.error)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            cause: uploadResult.error.code,
            message: uploadResult.error.message,
          });

        const [media] = await ctx.db
          .insert(articleMedia)
          .values({
            articleId: input.id,
            intent: "content_img",
            fileName: uploadResult.data.name,
            mimeType: uploadResult.data.type,
            size: uploadResult.data.size,
            ufsId: uploadResult.data.key,
            url: uploadResult.data.ufsUrl,
          })
          .returning();

        return media;
      }
    }),

  deleteContentImage: adminProcedure
    .input(
      z.object({
        mediaId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [media] = await ctx.db
        .select()
        .from(articleMedia)
        .where(eq(articleMedia.id, input.mediaId))
        .limit(1);

      if (!media) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.delete(articleMedia).where(eq(articleMedia.id, media.id));

      const utapi = new UTApi();
      return utapi.deleteFiles([media.ufsId]);
    }),

  getAuthorList: adminProcedure.query(async ({ ctx }) => {
    const queryResult = await ctx.db.query.usersToArticles.findMany({
      with: {
        user: true,
      },
    });

    const authors = queryResult.map((author) => author.user);

    const seenKeys = new Set<string>();
    return authors.reduce((accumulator, currentItem) => {
      if (!seenKeys.has(currentItem.id)) {
        seenKeys.add(currentItem.id);
        accumulator.push(currentItem);
      }
      return accumulator;
    }, [] as typeof authors);
  }),
};
