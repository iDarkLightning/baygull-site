import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { AdminShell } from "~/components/layout/admin-shell";

export const Route = createFileRoute("/manage/_admin-layout")({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw notFound();
    }
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
