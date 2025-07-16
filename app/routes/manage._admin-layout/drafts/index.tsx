import { createFileRoute } from "@tanstack/react-router";
import {
  DraftFilterDisplay,
  DraftFilterMenu,
} from "~/components/articles/drafts/draft-filter";
import { DraftTable } from "~/components/articles/drafts/draft-table";

export const Route = createFileRoute("/manage/_admin-layout/drafts/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.article.draft.getAll.queryOptions()
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <div className="rounded-lg mx-4 mt-4 mb-1 pt-3 pb-1 px-6">
        <div className="flex items-center justify-between">
          <h1 className="font-medium text-lg">Drafts</h1>
          <DraftFilterMenu />
        </div>
        <DraftFilterDisplay />
      </div>
      <DraftTable />
    </div>
  );
}
