import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTRPC } from "~/lib/trpc/client";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { TDraftList } from "~/lib/trpc/types";
import { TooltipTrigger, Tooltip } from "~/components/ui/tooltip";
import { Button as AriaButton, Menu, MenuTrigger } from "react-aria-components";
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="pt-2 px-6">
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
