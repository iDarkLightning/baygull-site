import { publicProcedure } from "../init";
import { extractAuth } from "../middleware/auth-middleware";

export const userRouter = {
  me: publicProcedure
    .use(extractAuth)
    .query(async ({ ctx }) => ctx.user ?? null),
};
