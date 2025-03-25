import { authedProcedure } from "../middleware/auth-middleware";

export const topicRouter = {
  getAll: authedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.topic.findMany();
  }),
};
