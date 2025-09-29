import { Button } from "@baygull/ui/button";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useDraft } from "~/lib/articles/use-draft";
import { useTRPC } from "~/lib/trpc-client";

export const Route = createFileRoute(
  "/manage/_admin-layout/a/edit/$id/publishing"
)({
  component: RouteComponent,
});

function RouteComponent() {
  const draft = useDraft();

  const trpc = useTRPC();
  const publish = useMutation(trpc.article.manage.publish.mutationOptions());

  return (
    <div>
      <Button
        onPress={() =>
          publish.mutate({
            id: draft.data.id,
          })
        }
      >
        Publish
      </Button>
    </div>
  );
}
