// app/router.tsx
import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { createTRPCClient, httpBatchStreamLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import { TRPCProvider } from "./lib/trpc-client";
import type { TRPCRouter } from "@baygull/api/trpc";
import { routeTree } from "./routeTree.gen";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

const isomorphicHeaders = createIsomorphicFn()
  .server(() => getRequestHeaders())
  .client(() => ({}));

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
      queries: {
        refetchOnMount: false,
      },
    },
  });

  const trpcClient = createTRPCClient<TRPCRouter>({
    links: [
      httpBatchStreamLink({
        transformer: superjson,
        url: `/api/trpc`,
        headers: async () => {
          return isomorphicHeaders();
        },
      }),
    ],
  });

  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  });

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient, trpc: serverHelpers, trpcClient },
    defaultPreload: "intent",
    scrollRestoration: true,
    Wrap: (props) => (
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    ),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
