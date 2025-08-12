import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { TRPCContext } from "./context";

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  allowOutsideOfServer: false,
});

export const createTRPCRouter = t.router;
export const createTRPCMiddleware = t.middleware;
export const publicProcedure = t.procedure;
