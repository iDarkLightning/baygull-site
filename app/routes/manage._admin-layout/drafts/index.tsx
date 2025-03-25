import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTRPC } from "~/lib/trpc/client";

export const Route = createFileRoute("/manage/_admin-layout/drafts/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.article.draft.getAll.queryOptions()
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.article.draft.getAll.queryOptions());

  return (
    <div>
      {data.map((draft) => (
        <Link
          to="/manage/drafts/publish/$id"
          params={{ id: draft.id }}
          key={draft.id}
        >
          <h1>{draft.title}</h1>
        </Link>
      ))}
    </div>
  );
}
