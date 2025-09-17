import { user } from "@baygull/db/schema";
import { desc, eq } from "drizzle-orm";
import z from "zod";
import { adminProcedure } from "../middleware/auth-middleware";
import { TRPCError } from "@trpc/server";

export const userManageRouter = {
  getAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(user);
  }),

  updateRole: adminProcedure
    .input(z.object({ id: z.string(), role: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (input.id === ctx.user.id && input.role < ctx.user.role)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot demote yourself.",
        });

      const result = await ctx.uniqueResultOrThrow(
        ctx.db
          .update(user)
          .set({
            role: input.role,
          })
          .where(eq(user.id, input.id))
          .returning({ id: user.id })
      );

      return result;
    }),
};
