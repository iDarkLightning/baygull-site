import { createFileRoute } from "@tanstack/react-router";
import { PeopleTable } from "~/components/people/people-table";

const roleDisplayText = ["Member", "", "Administrator"];

export const Route = createFileRoute("/manage/_admin-layout/people")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.user.manage.getAll.queryOptions()
    );
  },
});

function RouteComponent() {
  return (
    <div>
      <div className="rounded-lg mx-4 mt-4 mb-1 pt-3 pb-1 px-1 md:px-6">
        <div className="flex items-center justify-between">
          <h1 className="font-medium text-lg">People</h1>
        </div>
      </div>
      <PeopleTable />
    </div>
  );
}
