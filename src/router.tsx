// app/router.tsx
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";
import { createTRPCClient, httpBatchStreamLink } from "@trpc/client";
import type { TRPCRouter } from "./lib/trpc/routers/root-router";
import {
  createTRPCOptionsProxy,
  type TRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
import { TRPCProvider } from "./lib/trpc/client";

export function createRouter() {
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
        url: `${process.env.BASE_URL ?? ""}/api/trpc`,
        headers: async () => {
          if (typeof window === "undefined") {
            const { getHeaders } = await import("@tanstack/react-start/server");
            return getHeaders();
          }
          return {};
        },
      }),
    ],
  });

  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  });

  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      context: { queryClient, trpc: serverHelpers },
      defaultPreload: "intent",
      Wrap: (props) => (
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          {props.children}
        </TRPCProvider>
      ),
    }),
    queryClient
  );

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
