import { auth } from "@baygull/auth";
import { createTRPCMiddleware, publicProcedure } from "../init";
import { TRPCError } from "@trpc/server";

export const extractAuth = createTRPCMiddleware(async ({ ctx, next }) => {
  const session = await auth.api.getSession({
    headers: ctx.request.headers,
  });

  return next({
    ctx: {
      user: session?.user,
    },
  });
});

export const authedProcedure = publicProcedure
  .use(extractAuth)
  .use(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        user: ctx.user,
      },
    });
  });

export const adminProcedure = authedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role < 2) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next();
});
