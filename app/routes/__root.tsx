// app/routes/__root.tsx
import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";

import globalCss from "~/styles/global.css?url";
import { QueryClient } from "@tanstack/react-query";
import { getUserQuery } from "~/lib/auth/auth-api";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
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
          href: "https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@300..900&display=swap",
        },
      ],
    }),
    beforeLoad: async ({ context }) => {
      const user = await context.queryClient.ensureQueryData(getUserQuery());

      return { user };
    },
    errorComponent: () => <p>Oh noes! An error! Run!!</p>,
    component: RootComponent,
  }
);

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
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
