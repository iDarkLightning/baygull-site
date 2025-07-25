import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  articleDraft,
  articleMedia,
  usersToArticleDrafts,
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
        status: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.articleDraft.findMany({
        where: eq(articleDraft.status, input.status),
        with: {
          users: {
            with: {
              user: true,
            },
          },
        },
        orderBy: (draft, { asc, desc }) => [
          asc(draft.status),
          desc(draft.submittedAt),
        ],
      });

      return result;
    }),

  getById: authedProcedure
    .input(z.object({ draftId: z.string() }))
    .query(async ({ input, ctx }) => {
      const draft = await ctx.db.query.articleDraft.findFirst({
        where: eq(articleDraft.id, input.draftId),
        with: {
          users: {
            columns: {},
            with: {
              user: true,
            },
          },
        },
      });

      if (!draft) throw new TRPCError({ code: "NOT_FOUND" });

      const drive = createDriveClient();

      const fileId = new URL(draft.editingUrl!).pathname.split("/").at(3);

      const response = await drive.files.export({
        mimeType: "text/html",
        fileId,
      });

      if (response.status !== 200)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error occured while exporting to markdown!",
        });

      return { ...draft, content: response.data as string };
    }),

  create: authedProcedure
    .input(
      z.object({
        title: z.string(),
        type: z.enum(["default", "headline", "graphic"]),
        description: z.string().optional(),
        media: z.array(
          z.object({
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
      const draftInput: typeof articleDraft.$inferInsert = {
        title: input.title,
        type: ["default", "headline", "graphic"].indexOf(input.type),
        description: input.description,
        keyIdeas: input.keyIdeas,
        message: input.message,
      };

      if (input.type === "default") {
        if (!input.docId)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "docId must be provided for type = default",
          });

        const copyResult = await createArticleEditingCopy({
          articleName: input.title,
          fileId: input.docId,
        });

        draftInput.originalUrl = `https://docs.google.com/document/d/${input.docId}`;
        draftInput.editingUrl = `https://docs.google.com/document/d/${copyResult.id}`;
      }

      const draftId = await ctx.db.transaction(async (tx) => {
        const [{ draftId }] = await tx
          .insert(articleDraft)
          .values(draftInput)
          .returning({ draftId: articleDraft.id });

        await tx.insert(usersToArticleDrafts).values([
          {
            draftId,
            userId: ctx.user.id,
          },
          ...input.collaborators.map((userId) => ({
            draftId,
            userId,
          })),
        ]);

        if (input.media.length > 0) {
          await tx.insert(articleMedia).values(
            input.media.map((media) => ({
              draftId,
              type: 0,
              intent: input.type === "graphic" ? 2 : 0,
              url: media.url,
              size: media.size,
            }))
          );
        }

        return draftId;
      });

      return {
        message: "ok",
        draftId,
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
    const queryResult = await ctx.db.query.usersToArticleDrafts.findMany({
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
