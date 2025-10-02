import { fetchRequestHandler } from "@baygull/api/trpc/server";
import { rootRouter } from "@baygull/api/trpc";
import { createTRPCContext } from "@baygull/api/trpc/context";
import { createFileRoute } from "@tanstack/react-router";

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: rootRouter,
    createContext: () => createTRPCContext(request),
    endpoint: "/api/trpc",
  });
}

export const Route = createFileRoute("/api/trpc/$")({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});
