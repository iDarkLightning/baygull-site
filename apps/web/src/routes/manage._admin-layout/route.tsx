import { authClient } from "@baygull/auth/client";
import {
  createFileRoute,
  notFound,
  Outlet,
  redirect,
  rootRouteId,
} from "@tanstack/react-router";
import { AdminShell } from "~/components/layout/admin-shell";

export const Route = createFileRoute("/manage/_admin-layout")({
  head: () => ({
    meta: [{ title: "The Bay Gull - Manage" }],
  }),
  beforeLoad: async ({ context, location }) => {
    if (!context.user) {
      const { data } = await authClient.signIn.social({
        provider: "google",
        disableRedirect: true,
        callbackURL: location.href,
      });

      throw redirect({ href: data?.url });
    }

    if (context.user.role !== 2) throw notFound({ routeId: rootRouteId });
  },
  loader: ({ context }) => {
    context.trpcClient.article.manage.commitContentDeletion.mutate();
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
