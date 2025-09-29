import {
  archiveMeta,
  article,
  articleMedia,
  articlesToTopics,
  draftDefaultContent,
  draftMeta,
  graphicContent,
  publishMeta,
  topic,
  usersToArticles,
} from "@baygull/db/schema";
import { createId, isCuid } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, like, not, sql } from "drizzle-orm";
import slugify from "slugify";
import { UTApi } from "uploadthing/server";
import { z } from "zod";
import { createDriveClient } from "../../google-drive";
import { articleQueryBuilder } from "../../services/article-service";
import { adminProcedure, authedProcedure } from "../middleware/auth-middleware";
import { type Transaction } from "@baygull/db";

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

const getArticleDocContent = async (data: { editingUrl: string }) => {
  const drive = createDriveClient();

  const fileId = new URL(data.editingUrl).pathname.split("/").at(3);

  const response = await drive.files.export({
    mimeType: "text/html",
    fileId,
  });

  if (response.status !== 200)
    throw new Error("Error occured getting doc content!");

  return { content: response.data as string };
};

const setUpdatedTime = async (tx: Transaction, id: string) => {
  await tx
    .update(draftMeta)
    .set({
      updatedAt: sql`current_timestamp`,
    })
    .where(eq(draftMeta.articleId, id));
};

export const manageArticleRouter = {
  getAll: adminProcedure
    .input(
      z.object({
        status: z.enum(["draft", "published", "archived"]),
      })
    )
    .query(async ({ ctx, input }) => {
      const orderField = {
        draft: draftMeta.submittedAt,
        published: publishMeta.publishedAt,
        archived: archiveMeta.archivedAt,
      } as const;

      const articles = await articleQueryBuilder(ctx.db, input.status)
        .includeMeta()
        .includeDescription()
        .withUsers()
        .with(
          (exts) =>
            void exts.push((qb) => qb.orderBy(desc(orderField[input.status])))
        )
        .run();

      return articles;
    }),

  getById: authedProcedure
    .input(z.object({ draftId: z.string() }))
    .query(async ({ input, ctx }) => {
      const draft = await ctx.uniqueResultOrThrow(
        articleQueryBuilder(ctx.db, "draft")
          .includeMeta()
          .includeDescription()
          .withUsers()
          .withTopics()
          .withCoverImage()
          .with(
            (exts) =>
              void exts.push((qb) => qb.where(eq(article.id, input.draftId)))
          )
          .run()
      );

      if (draft.type === "default") {
        const content = await ctx.uniqueResultOrThrow(
          ctx.db
            .select()
            .from(draftDefaultContent)
            .where(eq(draftDefaultContent.articleId, draft.articleId))
        );

        if (content.isSynced) {
          const docContent = await getArticleDocContent({
            editingUrl: content.editingUrl,
          });

          return {
            ...draft,
            type: "default" as const,
            content: {
              ...content,
              content: docContent.content,
            },
          };
        }

        return {
          ...draft,
          type: "default" as const,
          content,
        };
      } else if (draft.type === "graphic") {
        const content = await ctx.uniqueResultOrThrow(
          ctx.db
            .select()
            .from(graphicContent)
            .where(eq(graphicContent.articleId, draft.articleId))
        );

        return {
          ...draft,
          type: "graphic" as const,
          content,
        };
      } else {
        return {
          ...draft,
          type: "headline" as const,
        };
      }
    }),

  getDraftContent: authedProcedure
    .input(
      z.object({
        articleId: z.string(),
        type: z.enum(["default", "graphic"]),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.type === "default") {
        const content = await ctx.uniqueResultOrThrow(
          ctx.db
            .select()
            .from(draftDefaultContent)
            .where(eq(draftDefaultContent.articleId, input.articleId))
        );

        if (content.isSynced) {
          const docContent = await getArticleDocContent({
            editingUrl: content.editingUrl,
          });

          return {
            ...content,
            content: docContent.content,
          };
        }

        return content;
      }
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
          slug: slugify(input.title, {
            lower: true,
            strict: true,
            trim: true,
          }),
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
              caption: "",
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
        const { id } = await ctx.uniqueResultOrThrow(
          tx
            .update(article)
            .set({
              title: input.title,
            })
            .where(eq(article.id, input.id))
            .returning({ id: article.id })
        );

        if (input.deriveSlug) {
          const derivedSlug = slugify(input.title, {
            lower: true,
            strict: true,
            trim: true,
          });

          const { count: slugCount } = await ctx.uniqueResultOrThrow(
            tx
              .select({ count: count() })
              .from(draftMeta)
              .where(like(draftMeta.slug, `${derivedSlug}%`))
          );

          await tx
            .update(draftMeta)
            .set({
              slug:
                slugCount === 0
                  ? derivedSlug
                  : `${derivedSlug}-${slugCount + 1}`,
            })
            .where(eq(draftMeta.articleId, input.id));
        }

        await setUpdatedTime(tx, input.id);
        return id;
      });

      return id;
    }),

  validateSlug: adminProcedure
    .input(z.object({ id: z.string().refine(isCuid), slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const { count: rows } = await ctx.uniqueResultOrThrow(
        ctx.db
          .select({ count: count() })
          .from(publishMeta)
          .where(
            and(
              eq(publishMeta.slug, input.slug),
              not(eq(publishMeta.articleId, input.id))
            )
          )
          .limit(1)
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
        const { id } = await ctx.uniqueResultOrThrow(
          tx
            .update(article)
            .set({
              type: input.type,
            })
            .where(eq(article.id, input.id))
            .returning({
              id: article.id,
            })
        );

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
              isSynced: false,
              syncDisabledAt: sql`(CURRENT_TIMESTAMP)`,
            })
            .onConflictDoUpdate({
              target: draftDefaultContent.articleId,
              set: !!graphicDesc
                ? { description: graphicDesc.description }
                : { description: "" },
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
          const { title } = await ctx.uniqueResultOrThrow(
            tx
              .select({ title: article.title })
              .from(article)
              .where(eq(article.id, input.id))
              .limit(1)
          );

          const derivedSlug = slugify(title, {
            lower: true,
            strict: true,
            trim: true,
          });

          const { count: slugCount } = await ctx.uniqueResultOrThrow(
            tx
              .select({ count: count() })
              .from(draftMeta)
              .where(
                and(
                  like(draftMeta.slug, `${derivedSlug}%`),
                  not(eq(draftMeta.articleId, input.id))
                )
              )
              .limit(1)
          );

          await tx
            .update(draftMeta)
            .set({
              deriveSlugFromTitle: true,
              slug:
                slugCount === 0
                  ? derivedSlug
                  : `${derivedSlug}-${slugCount + 1}`,
            })
            .where(eq(draftMeta.articleId, input.id));

          await setUpdatedTime(tx, input.id);
        });
      } else {
        await ctx.db.transaction(async (tx) => {
          if (input.data.deriveFromTitle) return;

          await tx
            .update(draftMeta)
            .set({
              deriveSlugFromTitle: false,
              ...(input.data.slug ? { slug: input.data.slug } : {}),
            })
            .where(eq(draftMeta.articleId, input.id));

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
        if (input.topics.length > 0) {
          await tx.insert(topic).values(input.topics).onConflictDoNothing();
        }

        await tx
          .delete(articlesToTopics)
          .where(and(eq(articlesToTopics.articleId, input.id)));

        if (input.topics.length > 0) {
          await tx.insert(articlesToTopics).values(
            input.topics.map((t) => ({
              topicId: t.id,
              articleId: input.id,
            }))
          );
        }

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

          await tx.insert(articleMedia).values({
            intent: "cover_img",
            articleId: input.id,
            caption: "",
            fileName: input.data.fileName,
            mimeType: input.data.mimeType,
            url: input.data.url,
            size: input.data.size,
            ufsId: input.data.ufsId,
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
            type: "json",
            content: input.content,
          })
          .where(eq(draftDefaultContent.articleId, input.id));

        await setUpdatedTime(tx, input.id);
      });
    }),

  uploadExternalContentImage: adminProcedure
    .input(
      z.object({
        id: z.string(),
        url: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const media = await ctx.uniqueResult(
        ctx.db
          .select()
          .from(articleMedia)
          .where(eq(articleMedia.url, input.url))
          .limit(1)
      );

      if (media !== undefined) {
        await ctx.db
          .update(articleMedia)
          .set({
            markedForDeletion: null,
          })
          .where(eq(articleMedia.id, media.id));

        return media;
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
            if (!header || !data) throw new TRPCError({ code: "BAD_REQUEST" });

            const mime =
              header.match(/:(.*?);/)?.[1] || "application/octet-stream";
            const buffer = Buffer.from(data, "base64");

            return [mime, buffer, `${input.id}-${createId()}`] as const;
          }
        })();

        const file = new File([buffer], fileName, {
          type: mime,
        });

        const uploadResult = await ctx.uniqueResultOrThrow(
          utapi.uploadFiles([file])
        );

        if (uploadResult.error)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            cause: uploadResult.error.code,
            message: uploadResult.error.message,
          });

        const media = await ctx.uniqueResultOrThrow(
          ctx.db
            .insert(articleMedia)
            .values({
              articleId: input.id,
              intent: "content_img",
              caption: "",
              fileName: uploadResult.data.name,
              mimeType: uploadResult.data.type,
              size: uploadResult.data.size,
              ufsId: uploadResult.data.key,
              url: uploadResult.data.ufsUrl,
            })
            .returning()
        );

        return media;
      }
    }),

  updateContentImage: adminProcedure
    .input(
      z.object({
        mediaId: z.string(),
        caption: z.string().optional(),
        markForDeletion: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const media = await ctx.uniqueResultOrThrow(
        ctx.db
          .select()
          .from(articleMedia)
          .where(eq(articleMedia.id, input.mediaId))
          .limit(1)
      );

      await ctx.db
        .update(articleMedia)
        .set({
          ...(input.caption ? { caption: input.caption } : {}),
          ...(input.markForDeletion
            ? { markedForDeletion: input.markForDeletion ? ctx.user.id : null }
            : {}),
        })
        .where(eq(articleMedia.id, media.id));
    }),

  commitContentDeletion: adminProcedure.mutation(async ({ ctx }) => {
    const media = await ctx.db
      .delete(articleMedia)
      .where(eq(articleMedia.markedForDeletion, ctx.user.id))
      .returning();

    const utapi = new UTApi();
    utapi.deleteFiles(media.map((m) => m.ufsId));

    return media.map((m) => m.id);
  }),

  getEditingDoc: adminProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const draftContent = await ctx.uniqueResultOrThrow(
        ctx.db
          .select()
          .from(draftDefaultContent)
          .where(eq(draftDefaultContent.articleId, input.id))
          .limit(1)
      );

      try {
        const fileId = new URL(draftContent.editingUrl).pathname
          .split("/")
          .at(3);

        const drive = createDriveClient();
        const response = await drive.files.get({
          fileId,
          fields: "id,name,modifiedTime",
        });

        if (response.status !== 200)
          throw new TRPCError({
            code: "NOT_FOUND",
          });

        return response.data as {
          id: string;
          name: string;
          modifiedTime: string;
        };
      } catch {
        return null;
      }
    }),

  updateDocSync: adminProcedure
    .input(
      z.object({
        id: z.string(),
        isSynced: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const result = await ctx.uniqueResultOrThrow(
          tx
            .update(draftDefaultContent)
            .set({
              isSynced: input.isSynced,
              ...(input.isSynced
                ? { syncDisabledAt: null, type: "html" }
                : { syncDisabledAt: sql`(CURRENT_TIMESTAMP)`, type: "json" }),
            })
            .where(eq(draftDefaultContent.articleId, input.id))
            .returning()
        );

        await setUpdatedTime(tx, input.id);

        return result;
      });

      if (!input.isSynced) {
        return { isSynced: false, content: result.content as string };
      } else {
        const drive = createDriveClient();

        const fileId = new URL(result.editingUrl).pathname.split("/").at(3);

        const response = await drive.files.export({
          mimeType: "text/html",
          fileId,
        });

        return { isSynced: true, content: response.data as string };
      }
    }),

  updateEditingUrl: adminProcedure
    .input(
      z.object({
        id: z.string(),
        editingUrl: z.string(),
        shouldSync: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.transaction(async (tx) => {
        const result = ctx.uniqueResultOrThrow(
          tx
            .update(draftDefaultContent)
            .set({
              editingUrl: input.editingUrl,
              isSynced: input.shouldSync,
              ...(input.shouldSync
                ? { syncDisabledAt: null }
                : { syncDisabledAt: sql`(CURRENT_TIMESTAMP)` }),
            })
            .where(eq(draftDefaultContent.articleId, input.id))
            .returning()
        );

        await setUpdatedTime(tx, input.id);

        return result;
      });

      if (!result.isSynced) {
        return { isSynced: false, content: result.content as string };
      } else {
        const drive = createDriveClient();

        const fileId = new URL(result.editingUrl).pathname.split("/").at(3);

        const response = await drive.files.export({
          mimeType: "text/html",
          fileId,
        });

        return { isSynced: true, content: response.data as string };
      }
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
