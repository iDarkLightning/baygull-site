import { eq, not } from "drizzle-orm";
import { publicProcedure } from "../init";
import { authedProcedure, extractAuth } from "../middleware/auth-middleware";
import { user } from "~/lib/db/schema";

export const userRouter = {
  me: publicProcedure
    .use(extractAuth)
    .query(async ({ ctx }) => ctx.user ?? null),

  getUsers: authedProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.query.user.findMany({
      where: not(eq(user.id, ctx.user.id)),
      columns: {
        name: true,
        id: true,
        image: true,
      },
    });

    return users;
  }),
};
