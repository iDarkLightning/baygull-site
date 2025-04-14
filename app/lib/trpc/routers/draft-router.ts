import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { articleDraft, usersToArticleDrafts } from "~/lib/db/schema";
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
  getAll: adminProcedure.query(async ({ ctx }) => {
    const result = await ctx.db.query.articleDraft.findMany({
      with: {
        users: {
          with: {
            user: true,
          },
        },
      },
      orderBy: (draft, { asc }) => asc(draft.status),
    });

    console.log(result);

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

      const fileId = new URL(draft.editingUrl).pathname.split("/").at(3);

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
        description: z.string(),
        coverImg: z.string().optional(),
        docId: z.string(),
        keyIdeas: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const copyResult = await createArticleEditingCopy({
        articleName: input.title,
        fileId: input.docId,
      });

      const [insertResult] = await ctx.db
        .insert(articleDraft)
        .values({
          title: input.title,
          description: input.description,
          coverImg: input.coverImg,
          originalUrl: `https://docs.google.com/document/d/${input.docId}`,
          editingUrl: `https://docs.google.com/document/d/${copyResult.id}`,
          keyIdeas: input.keyIdeas,
          message: input.message,
        })
        .returning();

      await ctx.db.insert(usersToArticleDrafts).values({
        draftId: insertResult.id,
        userId: ctx.user.id,
      });

      if (!!insertResult) {
        return { message: "ok" };
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error occured while creating draft!",
      });
    }),
};
