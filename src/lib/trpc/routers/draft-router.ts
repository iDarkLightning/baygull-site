import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { parseArticle } from "~/lib/db/article-parser";
import {
  article,
  articleMedia,
  draftDefaultContent,
  draftMeta,
  graphicContent,
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

export const draftRouter = {
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
            ? article.draftMeta
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

  // getById: authedProcedure
  //   .input(z.object({ draftId: z.string() }))
  //   .query(async ({ input, ctx }) => {
  //     const draft = await ctx.db.query.article.findFirst({
  //       where: and(eq(article.id, input.draftId), eq(article.status, 0)),
  //       with: {
  //         users: {
  //           columns: {},
  //           with: {
  //             user: true,
  //           },
  //         },
  //         content: true,
  //       },
  //     });

  //     if (!draft) throw new TRPCError({ code: "NOT_FOUND" });

  //     const drive = createDriveClient();

  //     const fileId = new URL(draft.content!.docUrl!).pathname.split("/").at(3);

  //     const response = await drive.files.export({
  //       mimeType: "text/html",
  //       fileId,
  //     });

  //     if (response.status !== 200)
  //       throw new TRPCError({
  //         code: "INTERNAL_SERVER_ERROR",
  //         message: "Error occured while exporting to markdown!",
  //       });

  //     return { ...draft, content: response.data as string };
  //   }),

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
          })
        ),
        docId: z.string().optional(),
        keyIdeas: z.string(),
        message: z.string(),
        collaborators: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // let contentInput: typeof articleContent.$inferInsert | null = null;
      // if (input.type === "default") {
      //   if (!input.docId)
      //     throw new TRPCError({
      //       code: "BAD_REQUEST",
      //       message: "docId must be provided for type = default",
      //     });

      //   contentInput = {
      //     articleId: "",

      //   };
      // }

      const resultId = await ctx.db.transaction(async (tx) => {
        const [{ articleId }] = await tx
          .insert(article)
          .values({
            title: input.title,
            status: "draft",
            type: input.type,
          })
          .returning({ articleId: article.id });

        await tx.insert(draftMeta).values({
          articleId,
          message: input.message,
          keyIdeas: input.keyIdeas,
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
            }))
          );
        }

        return articleId;
      });

      return {
        message: "ok",
        draftId: resultId,
      };

      // const copyResult = await createArticleEditingCopy({
      //   articleName: input.title,
      //   fileId: input.docId,
      // });

      // const [insertResult] = await ctx.db
      //   .insert(articleDraft)
      //   .values({
      //     title: input.title,
      //     type: input.type,
      //     description: input.description,
      //     coverImg: input.coverImg,
      //     originalUrl: `https://docs.google.com/document/d/${input.docId}`,
      //     editingUrl: `https://docs.google.com/document/d/${copyResult.id}`,
      //     keyIdeas: input.keyIdeas,
      //     message: input.message,
      //   })
      //   .returning();

      // await ctx.db.insert(usersToArticleDrafts).values([
      //   {
      //     draftId: insertResult.id,
      //     userId: ctx.user.id,
      //   },
      //   ...input.collaborators.map((userId) => ({
      //     draftId: insertResult.id,
      //     userId,
      //   })),
      // ]);

      // if (!!insertResult) {
      //   return { message: "ok" };
      // }

      // throw new TRPCError({
      //   code: "INTERNAL_SERVER_ERROR",
      //   message: "Error occured while creating draft!",
      // });
    }),

  getAuthorList: adminProcedure.query(async ({ input, ctx }) => {
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
