import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { TRPCRouter } from "./routers/root-router";
import {
  createTRPCClient as _createTRPCClient,
  httpBatchStreamLink,
} from "@trpc/client";
import superjson from "superjson";

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<TRPCRouter>();

export const createTRPCClient = () =>
  _createTRPCClient<TRPCRouter>({
    links: [
      httpBatchStreamLink({
        transformer: superjson,
        url: `${process.env.BASE_URL ?? ""}/api/trpc`,
      }),
    ],
  });
