import { isCuid } from "@paralleldrive/cuid2";
import { z } from "zod";
import { topic } from "~/lib/db/schema";
import { publicProcedure } from "../init";
import { adminProcedure } from "../middleware/auth-middleware";

export const topicRouter = {
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.topic.findMany();
  }),

  create: adminProcedure
    .input(
      z.object({
        id: z.string().refine((id) => isCuid(id)),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .insert(topic)
        .values({
          name: input.name,
        })
        .returning();

      return result;
    }),
};
