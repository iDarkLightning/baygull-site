import { db } from "~/lib/db";
import { authedProcedure } from "../middleware/auth-middleware";

export const topicRouter = {
  getAll: authedProcedure.query(async () => {
    return await db.query.topic.findMany();
  }),
};
