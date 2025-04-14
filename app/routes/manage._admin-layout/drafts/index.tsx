import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Key } from "react-aria-components";
import { DraftTable } from "~/components/articles/drafts/draft-table";
import { Checkbox } from "~/components/ui/checkbox";
import { SearchIcon } from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectBody,
  MultiSelectItem,
} from "~/components/ui/multi-select";
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
  const [selectedKeys, setSelectedKeys] = useState<Set<Key>>(new Set());

  return (
    <div>
      <div className="rounded-lg mx-4 mt-4 mb-1 py-3 px-6 flex items-center justify-between">
        <h1 className="font-medium text-lg">Drafts</h1>
        <Input
          leadingVisual={<SearchIcon />}
          placeholder="Search Drafts"
          tabIndex={0}
        />
        <div className="flex gap-3 items-center bg-zinc-50 p-2 rounded-md">
          <MultiSelect
            selectedKeys={selectedKeys}
            setSelectedKeys={(keys) => {
              console.log(keys);
              setSelectedKeys(keys);
            }}
          >
            <MultiSelectTrigger
              btnProps={{
                placeholder: "Status",
              }}
            >
              <MultiSelectBody>
                <MultiSelectItem id="active" value="active" textValue="Active">
                  <span className="w-2 h-2 bg-sky-400 rounded-full" />
                  <p>Active</p>
                </MultiSelectItem>
                <MultiSelectItem
                  id="published"
                  value="published"
                  textValue="Published"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  <p>Published</p>
                </MultiSelectItem>
                <MultiSelectItem
                  id="archived"
                  value="archived"
                  textValue="Archived"
                >
                  <span className="w-2 h-2 bg-neutral-400 rounded-full" />
                  <p>Archived</p>
                </MultiSelectItem>
              </MultiSelectBody>
            </MultiSelectTrigger>
          </MultiSelect>
        </div>
      </div>

      <DraftTable />
    </div>
  );
}
