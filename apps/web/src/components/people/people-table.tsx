import { TDraftList, TPeopleList } from "@baygull/api/trpc/types";
import {
  Button as AriaButton,
  Button,
  DateRange,
  Key,
  Menu,
  MenuTrigger,
} from "@baygull/ui/aria";
import { checkbox, CheckIcon } from "@baygull/ui/checkbox";
import { cn } from "@baygull/ui/cn";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  ClockIcon,
} from "@baygull/ui/icons";
import { MenuItem } from "@baygull/ui/menu";
import { ModalPopover } from "@baygull/ui/modal-popover";
import { Tooltip, TooltipTrigger } from "@baygull/ui/tooltip";
import { CalendarDate } from "@internationalized/date";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { getRouteApi, Link, useRouter } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useArticleFilterStore } from "~/lib/articles/article-filter-store";
import { asUTCDate } from "~/lib/as-utc-date";
import { useTRPC } from "~/lib/trpc-client";

const columnHelper = createColumnHelper<TPeopleList[number]>();

// const routeApi = getRouteApi("/manage/_admin-layout/a/$status");

const columns = [
  columnHelper.accessor(
    (row) => ({ name: row.name, email: row.email, image: row.image }),
    {
      id: "info",
      cell: (info) => (
        <div className="flex items-center gap-2 pl-4 mr-4">
          {info.getValue().image && (
            <div>
              <img
                src={info.getValue().image!}
                alt={`${info.getValue().name}-pfp`}
                className="size-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div>
            <p className="text-sm font-medium">{info.getValue().name}</p>
            <p className="text-xs text-zinc-700">{info.getValue().email}</p>
          </div>
        </div>
      ),
      header: () => <span className="pl-4">Name</span>,
      //   filterFn: (row, columnId, value: string) => {
      //     if (value === "") return true;

      //     const { title, desc } = row.getValue<{ title: string; desc: string }>(
      //       columnId
      //     );

      //     if (desc)
      //       return (
      //         title.toLowerCase().includes(value.toLowerCase()) ||
      //         desc.toLowerCase().includes(value.toLowerCase())
      //       );

      //     return title.toLowerCase().includes(value.toLowerCase());
      //   },
    }
  ),
  columnHelper.accessor((user) => ({ id: user.id, role: user.role }), {
    id: "role",
    header: () => <span>Role</span>,
    cell: (info) => {
      const roleDisplayText = ["Member", "", "Administrator"];
      const { id, role } = info.getValue();

      const trpc = useTRPC();
      const queryClient = useQueryClient();
      const router = useRouter();

      const update = useMutation(
        trpc.user.manage.updateRole.mutationOptions({
          onSettled: () =>
            queryClient
              .invalidateQueries({
                queryKey: trpc.user.manage.getAll.queryKey(),
              })
              .then(() => router.invalidate()),
        })
      );

      return (
        <div>
          <MenuTrigger>
            <Button className="focus-visible:ring-0 focus-visible:outline-none text-sm font-medium bg-emerald-100 text-emerald-800 rounded-full px-3 py-0.5 flex items-center gap-0.5">
              {roleDisplayText[role]}
              <ChevronUpDownIcon />
            </Button>
            <ModalPopover>
              <Menu
                className="focus:outline-none"
                onAction={(key) => {
                  update.mutate({
                    id,
                    role: parseInt(key + ""),
                  });
                }}
              >
                <MenuItem id="2">
                  <span className="flex items-center gap-2 group">
                    <div
                      className={checkbox({ isSelected: role + "" === "2" })}
                    >
                      {role + "" === "2" && <CheckIcon />}
                    </div>
                    Administrator
                  </span>
                </MenuItem>
                <MenuItem id="0">
                  <span className="flex items-center gap-2 group">
                    <div
                      className={checkbox({ isSelected: role + "" === "0" })}
                    >
                      {role + "" === "0" && <CheckIcon />}
                    </div>
                    Member
                  </span>
                </MenuItem>
              </Menu>
            </ModalPopover>
          </MenuTrigger>
        </div>
      );
    },
    // filterFn: (row, columnId, value: Set<Key>) => {
    //   if (value.size === 0) return true;

    //   const type = row.getValue<string>(columnId);

    //   return value.has(type);
    // },
  }),
  columnHelper.accessor("createdAt", {
    id: "createdAt",
    header: () => {
      return <p>Joined</p>;
    },
    cell: (info) => {
      const date = info.getValue();

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
    // filterFn: (row, columnId, value: DateRange) => {
    //   if (value === null) return true;

    //   const submittedAt = new Date(row.getValue<number>(columnId));

    //   const date = new CalendarDate(
    //     submittedAt.getFullYear(),
    //     submittedAt.getMonth() + 1,
    //     submittedAt.getDate()
    //   );

    //   return (
    //     date.compare(value.start) === 0 ||
    //     (date.compare(value.start) > 0 && date.compare(value.end) < 0)
    //   );
    // },
  }),
];

export const PeopleTable = () => {
  const trpc = useTRPC();

  const { data, isStale, refetch } = useSuspenseQuery(
    trpc.user.manage.getAll.queryOptions()
  );

  //   const state = useArticleFilterStore((s) => s);
  //   const [filters, setFilters] = useState<
  //     {
  //       id: string;
  //       value: unknown;
  //     }[]
  //   >([
  //     { id: "title-desc", value: state.titleDesc },
  //     { id: "users", value: state.authors },
  //     { id: "type", value: state.types },
  //     { id: "createdAt", value: state.submissionTime },
  //   ]);

  const table = useReactTable({
    data,
    columns,
    // state: {
    //   columnFilters: filters,
    // },
    // onColumnFiltersChange: setFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getRowId: (row) => row.id,
  });

  useEffect(() => {
    if (isStale) refetch();
  }, []);

  //   useEffect(() => {
  //     table.setColumnFilters([
  //       { id: "title-desc", value: state.titleDesc },
  //       { id: "users", value: state.authors },
  //       { id: "type", value: state.types },
  //       { id: "createdAt", value: state.submissionTime },
  //     ]);
  //   }, [state]);

  //   const params = routeApi.useParams();

  //   const isFilterActive =
  //     state.titleDesc !== "" ||
  //     state.authors.size > 0 ||
  //     state.types.size > 0 ||
  //     state.submissionTime !== null;

  return (
    <div className="px-1 md:px-6 overflow-auto">
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
                  <td key={cell.id} className="h-14">
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
