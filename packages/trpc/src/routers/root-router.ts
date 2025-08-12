import { createTRPCRouter } from "../init";
import { articleRouter } from "./article-router";
import { topicRouter } from "./topic-router";
import { userRouter } from "./user-router";

export const rootRouter = createTRPCRouter({
  article: articleRouter,
  user: userRouter,
  topic: topicRouter,
});

export type TRPCRouter = typeof rootRouter;
