import { createFileRoute } from "@tanstack/react-router";
import { DraftInfoEditor } from "~/components/articles/drafts/draft-info-editor";

export const Route = createFileRoute(
  "/manage/_admin-layout/a/edit/$id/"
)({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.user.getUsers.queryOptions({ includeMe: true })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <DraftInfoEditor />;
}
