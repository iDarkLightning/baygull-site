import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/manage/_admin-layout/articles")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/manage/_admin-layout/articles"!</div>;
}
