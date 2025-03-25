import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { TRPCRouter } from "./routers/root-router";

export const { TRPCProvider, useTRPC } = createTRPCContext<TRPCRouter>();
