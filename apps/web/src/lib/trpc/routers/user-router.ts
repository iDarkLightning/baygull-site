import { eq, not } from "drizzle-orm";
import { publicProcedure } from "../init";
import { authedProcedure, extractAuth } from "../middleware/auth-middleware";
import { user } from "@baygull/db/schema";
import { z } from "zod";

export const userRouter = {
  me: publicProcedure
    .use(extractAuth)
    .query(async ({ ctx }) => ctx.user ?? null),

  getUsers: authedProcedure
    .input(
      z.object({
        includeMe: z.boolean(),
      })
    )
    .query(async ({ input, ctx }) => {
      const users = await ctx.db.query.user.findMany({
        where: input.includeMe ? undefined : not(eq(user.id, ctx.user.id)),
        columns: {
          name: true,
          id: true,
          image: true,
        },
      });

      return users;
    }),
};
