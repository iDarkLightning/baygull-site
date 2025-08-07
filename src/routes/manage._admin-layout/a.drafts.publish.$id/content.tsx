import { createFileRoute } from "@tanstack/react-router";
import DraftContentEditor from "~/components/articles/drafts/content-editor/editor";

export const Route = createFileRoute(
  "/manage/_admin-layout/a/drafts/publish/$id/content"
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <DraftContentEditor />
    </div>
  );
}
