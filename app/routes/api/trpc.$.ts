import { createAPIFileRoute } from "@tanstack/react-start/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { rootRouter } from "~/lib/trpc/routers/root-router";
import { createTRPCContext } from "~/lib/trpc/context";

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: rootRouter,
    createContext: () => createTRPCContext(request),
    endpoint: "/api/trpc",
  });
}

export const APIRoute = createAPIFileRoute("/api/trpc/$")({
  GET: handler,
  POST: handler,
});
