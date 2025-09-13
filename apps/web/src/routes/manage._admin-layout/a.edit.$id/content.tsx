import { createFileRoute } from "@tanstack/react-router";
import ArticleContentEditor from "~/components/articles/manage/content-editor/editor";
import { useDraft } from "~/lib/articles/use-draft";

export const Route = createFileRoute(
  "/manage/_admin-layout/a/edit/$id/content"
)({
  ssr: "data-only",
  pendingComponent: () => <div>Loading...</div>,
  component: RouteComponent,
});

function RouteComponent() {
  const draft = useDraft();

  if (draft.data.type === "default") {
    return (
      <div>
        <ArticleContentEditor />
      </div>
    );
  }

  return (
    <div>
      An editor has not been implemented for drafts of type "{draft.data.type}"!
    </div>
  );
}
