import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/manage/_admin-layout/a/edit/$id/seo"
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/manage/_admin-layout/a/drafts/publish/$id/seo"!</div>;
}
