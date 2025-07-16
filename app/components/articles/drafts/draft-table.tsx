import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTRPC } from "~/lib/trpc/client";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { TDraftList } from "~/lib/trpc/types";
import { TooltipTrigger, Tooltip } from "~/components/ui/tooltip";
import {
  Button as AriaButton,
  DateRange,
  Key,
  Menu,
  MenuTrigger,
} from "react-aria-components";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/cn";
import {
  ClockIcon,
  PublishIcon,
  ThreeDotsIcon,
  TrashIcon,
} from "~/components/ui/icons";
import { Popover } from "~/components/ui/popover";
import { MenuItem } from "~/components/ui/menu";
import { Checkbox } from "~/components/ui/checkbox";
import { CalendarDate } from "@internationalized/date";
import { useEffect, useState } from "react";
import { useFilterStore } from "./draft-filter";

const mapStatusToLabel = ["Active", "Published", "Archived"];

const columnHelper = createColumnHelper<TDraftList[number]>();

const columns = [
  columnHelper.accessor(
    (row) => ({ title: row.title, desc: row.description }),
    {
      id: "title-desc",
      cell: (info) => (
        <div className="pl-4">
          <p className="font-medium">{info.getValue().title}</p>
          <p className="text-xs text-neutral-600">
            {info.getValue().desc.slice(0, 20)}...
          </p>
        </div>
      ),
      header: () => <span className="pl-4">Title</span>,
      filterFn: (row, columnId, value: string) => {
        if (value === "") return true;
        console.log("NOT TRUE");

        const { title, desc } = row.getValue<{ title: string; desc: string }>(
          columnId
        );

        return (
          title.toLowerCase().includes(value.toLowerCase()) ||
          desc.toLowerCase().includes(value.toLowerCase())
        );
      },
    }
  ),
  columnHelper.accessor("users", {
    cell: (info) => {
      const users = info.getValue();

      const { user: firstUser } = users[0];

      return (
        <div>
          <div className="flex-1/12 items-center gap-2 flex px-3 py-2">
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
      console.log("NOT TRUE");

      const user = row.getValue<TDraftList[number]["users"]>(columnId);

      return user.some((user) => value.has(user.userId));
    },
  }),
  columnHelper.accessor("status", {
    header: () => <span>Status</span>,
    cell: (info) => {
      const status = info.getValue();

      return (
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-0.5 rounded-full text-sm w-fit font-medium",
            status == 0 && "bg-sky-100 text-sky-800",
            status == 1 && "bg-green-100 text-green-800",
            status == 2 && "bg-neutral-100 text-neutral-800"
          )}
        >
          <p>{mapStatusToLabel[status]}</p>
        </div>
      );
    },
    filterFn: (row, columnId, value: Set<Key>) => {
      if (value.size === 0) return true;
      console.log("NOT TRUE");

      const status = row.getValue<number>(columnId);

      return value.has(mapStatusToLabel[status].toLowerCase());
    },
  }),
  columnHelper.accessor("submittedAt", {
    header: () => <span>Submitted</span>,
    cell: (info) => {
      const date = new Date(info.getValue());

      return (
        <div className="flex items-center gap-2 text-neutral-600">
          <ClockIcon />
          <p className="text-xs">
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
        submittedAt.getMonth(),
        submittedAt.getDay()
      );

      console.log(
        date.compare(value.start) === 0 ||
          (date.compare(value.start) > 0 && date.compare(value.end) < 0)
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
            <MenuItem href={`/manage/drafts/publish/${row.row.original.id}`}>
              <div className="flex gap-3 items-center">
                <PublishIcon />
                Publish
              </div>
            </MenuItem>
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
  const { data } = useSuspenseQuery(trpc.article.draft.getAll.queryOptions());

  const [filters, setFilters] = useState<
    {
      id: string;
      value: unknown;
    }[]
  >([]);

  const state = useFilterStore();

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
      { id: "status", value: state.statuses },
      { id: "submittedAt", value: state.submissionTime },
    ]);
  }, [state]);

  return (
    <div className="px-6">
      <table className="w-full overflow-x-auto">
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
      {/* {data.map((draft) => (
        <Link
          to="/manage/drafts/publish/$id"
          params={{ id: draft.id }}
          key={draft.id}
        >
          <h1>{draft.title}</h1>
        </Link>
      ))} */}
    </div>
  );
};
