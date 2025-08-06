import { CalendarDate } from "@internationalized/date";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import {
  Button as AriaButton,
  DateRange,
  Key,
  Menu,
  MenuTrigger,
} from "react-aria-components";
import { Button } from "~/components/ui/button";
import {
  ClockIcon,
  PublishIcon,
  ThreeDotsIcon,
  TrashIcon,
} from "~/components/ui/icons";
import { MenuItem, MenuItemLink } from "~/components/ui/menu";
import { Popover } from "~/components/ui/popover";
import { Tooltip, TooltipTrigger } from "~/components/ui/tooltip";
import { useDraftFilterStore } from "~/lib/articles/draft-filter-store";
import { cn } from "~/lib/cn";
import { useTRPC } from "~/lib/trpc/client";
import { TDraftList } from "~/lib/trpc/types";

const columnHelper = createColumnHelper<TDraftList[number]>();

const routeApi = getRouteApi("/manage/_admin-layout/a/$status");

const columns = [
  columnHelper.accessor(
    (row) => {
      if (row.type !== "headline" && row.status !== "archived") {
        return { title: row.title, desc: row.description };
      }

      return { title: row.title };
    },
    {
      id: "title-desc",
      cell: (info) => (
        <div className="pl-4 mr-4">
          <p className="font-medium max-w-[24ch] truncate">
            {info.getValue().title}
          </p>
          {info.getValue().desc && (
            <p className="text-xs text-neutral-600">
              {info.getValue().desc?.slice(0, 20)}...
            </p>
          )}
        </div>
      ),
      header: () => <span className="pl-4">Title</span>,
      filterFn: (row, columnId, value: string) => {
        if (value === "") return true;

        const { title, desc } = row.getValue<{ title: string; desc: string }>(
          columnId
        );

        if (desc)
          return (
            title.toLowerCase().includes(value.toLowerCase()) ||
            desc.toLowerCase().includes(value.toLowerCase())
          );

        return title.toLowerCase().includes(value.toLowerCase());
      },
    }
  ),
  columnHelper.accessor("users", {
    cell: (info) => {
      const users = info.getValue();

      const [{ user: firstUser }] = users;

      return (
        <div>
          <div className="flex-1/12 items-center gap-2 flex px-3 py-2 mr-4">
            <div className="leading-6">
              <p className="font-medium">{firstUser.name}</p>
              <p className="text-neutral-600 text-xs">{firstUser.email}</p>
            </div>
            {users.length - 1 > 0 && (
              <TooltipTrigger>
                <AriaButton className="focus:outline-none ml-8 text-xs bg-zinc-100 px-4 py-1 font-semibold rounded-full border-[0.0125rem] border-zinc-300/60">
                  +{users.length - 1}
                </AriaButton>
                <Tooltip placement="end">
                  {users
                    .slice(1)
                    .map(({ user }) => user.name)
                    .join(", ")}
                </Tooltip>
              </TooltipTrigger>
            )}
          </div>
        </div>
      );
    },
    header: () => <span className="pl-3">Author</span>,
    filterFn: (row, columnId, value: Set<Key>) => {
      if (value.size === 0) return true;

      const user = row.getValue<TDraftList[number]["users"]>(columnId);

      return user.some((user) => value.has(user.userId));
    },
  }),
  columnHelper.accessor("type", {
    header: () => <span>Type</span>,
    cell: (info) => {
      const type = info.getValue();

      return (
        <div
          className={cn(
            "flex items-center px-3 py-0.5 rounded-full text-sm w-fit font-medium mr-4 shadow-sam",
            type == "default" && "bg-sky-100 text-sky-800",
            type == "graphic" && "bg-green-100 text-green-800",
            type == "headline" && "bg-purple-100 text-purple-800"
          )}
        >
          <p>{type.charAt(0).toUpperCase() + type.slice(1)}</p>
        </div>
      );
    },
    filterFn: (row, columnId, value: Set<Key>) => {
      if (value.size === 0) return true;

      const type = row.getValue<string>(columnId);

      return value.has(type);
    },
  }),
  columnHelper.accessor("createdAt", {
    header: () => <span>Submitted</span>,
    cell: (info) => {
      const date = new Date(info.getValue());

      return (
        <div className="flex items-center gap-2 text-neutral-600 mr-4">
          <ClockIcon />
          <p className="text-xs whitespace-nowrap">
            {date.toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
      );
    },
    filterFn: (row, columnId, value: DateRange) => {
      if (value === null) return true;

      const submittedAt = new Date(row.getValue<number>(columnId));

      const date = new CalendarDate(
        submittedAt.getFullYear(),
        submittedAt.getMonth() + 1,
        submittedAt.getDate()
      );

      return (
        date.compare(value.start) === 0 ||
        (date.compare(value.start) > 0 && date.compare(value.end) < 0)
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: (row) => (
      <MenuTrigger>
        <Button variant="ghost" size="icon">
          <ThreeDotsIcon />
        </Button>
        <Popover placement="bottom right">
          <Menu className="focus:outline-none min-w-42">
            <MenuItemLink
              to="/manage/a/drafts/publish/$id"
              params={{ id: row.row.original.id }}
              activeProps={{}}
              inactiveProps={{}}
            >
              <div className="flex gap-3 items-center">
                <PublishIcon />
                Publish
              </div>
            </MenuItemLink>
            <MenuItem>
              <div className="flex gap-3 items-center text-rose-600">
                <TrashIcon />
                Delete
              </div>
            </MenuItem>
          </Menu>
        </Popover>
      </MenuTrigger>
    ),
  }),
];

export const DraftTable = () => {
  const trpc = useTRPC();
  const routeContext = routeApi.useRouteContext();
  const { data } = useSuspenseQuery(
    trpc.article.draft.getAll.queryOptions({
      status: routeContext.status,
    })
  );

  const state = useDraftFilterStore((s) => s);
  const [filters, setFilters] = useState<
    {
      id: string;
      value: unknown;
    }[]
  >([
    { id: "title-desc", value: state.titleDesc },
    { id: "users", value: state.authors },
    { id: "type", value: state.types },
    { id: "createdAt", value: state.submissionTime },
  ]);

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters: filters,
    },
    onColumnFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  useEffect(() => {
    table.setColumnFilters([
      { id: "title-desc", value: state.titleDesc },
      { id: "users", value: state.authors },
      { id: "type", value: state.types },
      { id: "createdAt", value: state.submissionTime },
    ]);
  }, [state]);

  const isFilterActive =
    state.titleDesc !== "" ||
    state.authors.size > 0 ||
    state.types.size > 0 ||
    state.submissionTime !== null;

  return (
    <div className="px-1 md:px-6 overflow-auto">
      {table.getRowModel().rows.length === 0 && (
        <div className="flex flex-col mx-auto justify-center my-32 w-fit max-w-sm gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-12 text-neutral-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m7.875 14.25 1.214 1.942a2.25 2.25 0 0 0 1.908 1.058h2.006c.776 0 1.497-.4 1.908-1.058l1.214-1.942M2.41 9h4.636a2.25 2.25 0 0 1 1.872 1.002l.164.246a2.25 2.25 0 0 0 1.872 1.002h2.092a2.25 2.25 0 0 0 1.872-1.002l.164-.246A2.25 2.25 0 0 1 16.954 9h4.636M2.41 9a2.25 2.25 0 0 0-.16.832V12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 12V9.832c0-.287-.055-.57-.16-.832M2.41 9a2.25 2.25 0 0 1 .382-.632l3.285-3.832a2.25 2.25 0 0 1 1.708-.786h8.43c.657 0 1.281.287 1.709.786l3.284 3.832c.163.19.291.404.382.632M4.5 20.25h15A2.25 2.25 0 0 0 21.75 18v-2.625c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125V18a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>

          <p className="text- font-semibold text-neutral-700">
            Submitted Drafts
          </p>
          <p className="text-sm text-neutral-500">
            {isFilterActive
              ? "There are no drafts that match the selected filters"
              : "Article drafts are all submissions made by authors for potential review. There are currently no submissions."}
          </p>
        </div>
      )}
      {table.getRowModel().rows.length > 0 && (
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="text-left">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="font-semibold text-sm text-neutral-700 py-2"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
