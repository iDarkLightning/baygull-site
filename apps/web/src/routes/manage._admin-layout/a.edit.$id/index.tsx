import { createFileRoute } from "@tanstack/react-router";
import { ArticleInfoEditor } from "~/components/articles/manage/article-info-editor";

export const Route = createFileRoute("/manage/_admin-layout/a/edit/$id/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.user.getUsers.queryOptions({ includeMe: true })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <ArticleInfoEditor />;
}
