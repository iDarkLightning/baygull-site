import { parseDate } from "@internationalized/date";
import { createFileRoute, stripSearchParams } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  DraftFilterDisplay,
  DraftFilterMenu,
  submissionRangePresets,
} from "~/components/articles/drafts/draft-filter";
import { DraftTable } from "~/components/articles/drafts/draft-table";
import { DraftFilterStoreProvider } from "~/lib/articles/draft-filter-store";

const filterParamDefaultValues = {
  statuses: [],
  authors: [],
  titleDesc: "",
  submissionTime: null,
  preset: "none",
};

const filterParamSchema = z.object({
  statuses: fallback(
    z.array(z.union([z.string(), z.number()])),
    filterParamDefaultValues.statuses
  ).default(filterParamDefaultValues.statuses),
  authors: fallback(
    z.array(z.union([z.string(), z.number()])),
    filterParamDefaultValues.authors
  ).default(filterParamDefaultValues.authors),
  titleDesc: fallback(z.string(), filterParamDefaultValues.titleDesc).default(
    filterParamDefaultValues.titleDesc
  ),
  submissionTime: fallback(
    z.nullable(
      z.object({
        start: z.string(),
        end: z.string(),
      })
    ),
    filterParamDefaultValues.submissionTime
  ),
  preset: fallback(
    z.enum([...Object.keys(submissionRangePresets), "none"] as [string]),
    "none"
  ).default(filterParamDefaultValues.preset),
});

export const Route = createFileRoute("/manage/_admin-layout/drafts/")({
  validateSearch: zodValidator(filterParamSchema),
  search: {
    middlewares: [stripSearchParams(filterParamDefaultValues)],
  },
  loaderDeps: ({ search }) => ({ authors: search.authors }),
  loader: async ({ context, deps }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.article.draft.getAll.queryOptions()
    );

    if (deps.authors.length > 0) {
      await context.queryClient.ensureQueryData(
        context.trpc.article.draft.getAuthorList.queryOptions()
      );
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();

  return (
    <div>
      <DraftFilterStoreProvider
        statuses={new Set(search.statuses)}
        authors={new Set(search.authors)}
        titleDesc={search.titleDesc}
        submissionTime={
          search.submissionTime
            ? {
                start: parseDate(search.submissionTime.start),
                end: parseDate(search.submissionTime.end),
              }
            : null
        }
        presetSelected={search.preset as any}
      >
        <div className="rounded-lg mx-4 mt-4 mb-1 pt-3 pb-1 px-1 md:px-6">
          <div className="flex items-center justify-between">
            <h1 className="font-medium text-lg">Drafts</h1>
            <DraftFilterMenu />
          </div>
          <DraftFilterDisplay />
        </div>
        <DraftTable />
      </DraftFilterStoreProvider>
    </div>
  );
}
