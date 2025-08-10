import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { AdminShell } from "~/components/layout/admin-shell";

export const Route = createFileRoute("/manage/_admin-layout")({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw notFound();
    }
  },
  loader: ({ context }) => {
    context.trpcClient.article.draft.commitContentDeletion.mutate();
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
