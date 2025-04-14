// app/routes/__root.tsx
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useNavigate,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { QueryClient } from "@tanstack/react-query";
import { type TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { type TRPCRouter } from "~/lib/trpc/routers/root-router";
import globalCss from "~/styles/global.css?url";
import { RouterProvider } from "react-aria-components";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<TRPCRouter>;
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: globalCss,
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
      },
    ],
  }),
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(
      context.trpc.user.me.queryOptions()
    );

    return { user };
  },
  errorComponent: () => <p>Oh noes! An error! Run!!</p>,
  component: RootComponent,
});

function RootComponent() {
  const navigate = useNavigate();

  return (
    <RootDocument>
      <RouterProvider navigate={(route) => navigate({ to: route })}>
        <Outlet />
      </RouterProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
