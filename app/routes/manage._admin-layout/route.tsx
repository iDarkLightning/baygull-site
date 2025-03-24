import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "~/components/layout/admin-shell";

export const Route = createFileRoute("/manage/_admin-layout")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
