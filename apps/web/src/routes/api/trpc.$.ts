import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { rootRouter } from "@baygull/api/trpc";
import { createTRPCContext } from "@baygull/api/trpc/context";
import { createServerFileRoute } from "@tanstack/react-start/server";

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: rootRouter,
    createContext: () => createTRPCContext(request),
    endpoint: "/api/trpc",
  });
}

export const ServerRoute = createServerFileRoute("/api/trpc/$").methods({
  GET: handler,
  POST: handler,
});
