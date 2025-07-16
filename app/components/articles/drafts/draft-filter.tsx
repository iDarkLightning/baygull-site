import {
  CalendarDate,
  endOfMonth,
  endOfWeek,
  endOfYear,
  getLocalTimeZone,
  startOfMonth,
  startOfWeek,
  startOfYear,
  today,
} from "@internationalized/date";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import React, { useEffect } from "react";
import {
  Button as AriaButton,
  DateRange,
  DialogTrigger,
  Key,
  Menu,
  SubmenuTrigger,
  TextField,
} from "react-aria-components";
import { useShallow } from "zustand/react/shallow";
import { Button } from "~/components/ui/button";
import {
  ChevronRightIcon,
  ClockIcon,
  FunnelIcon,
  PeopleIcon,
  XMarkIcon,
} from "~/components/ui/icons";
import { Input } from "~/components/ui/input";
import { MenuItem, MenuTrigger } from "~/components/ui/menu";
import { ModalPopover } from "~/components/ui/modal-popover";
import {
  MultiSelect,
  MultiSelectBody,
  MultiSelectItem,
} from "~/components/ui/multi-select";
import { RangeCalendar } from "~/components/ui/range-calendar";
import { useDraftFilterStore } from "~/lib/articles/draft-filter-store";
import { cn } from "~/lib/cn";
import { useTRPC } from "~/lib/trpc/client";

const statusDisplay = {
  active: {
    id: 0,
    className: "w-2 h-2 bg-sky-400 rounded-full",
    display: "Active",
  },
  published: {
    id: 1,
    className: "w-2 h-2 bg-green-400 rounded-full",
    display: "Published",
  },
  archived: {
    id: 2,
    className: "w-2 h-2 bg-neutral-400 rounded-full",
    display: "Archived",
  },
};

const submissionRangePresets = {
  today: {
    display: "Today",
    getRange: () => ({
      start: today(getLocalTimeZone()),
      end: today(getLocalTimeZone()),
    }),
  },
  week: {
    display: "This Week",
    getRange: () => ({
      start: startOfWeek(today(getLocalTimeZone()), "en-US"),
      end: endOfWeek(today(getLocalTimeZone()), "en-US"),
    }),
  },
  month: {
    display: "This Month",
    getRange: () => {
      const date = today(getLocalTimeZone());
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
    },
  },
  year: {
    display: "This Year",
    getRange: () => {
      const date = today(getLocalTimeZone());

      return {
        start: startOfYear(date),
        end: endOfYear(date),
      };
    },
  },
  sem: {
    display: "This Semester",
    getRange: getSemesterRange,
  },
  academic: {
    display: "This Academic Year",
    getRange: getAcademicYearRange,
  },
};

type TDatePresets = keyof typeof submissionRangePresets | "none";

const routeApi = getRouteApi("/manage/_admin-layout/drafts/");

export const DraftFilterMenu = () => {
  const state = useDraftFilterStore((s) => s);
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();

  useEffect(() => {
    navigate({
      replace: true,
      search: {
        statuses: [...state.statuses],
        authors: [...state.authors],
        titleDesc: state.titleDesc,
        submissionTime:
          state.submissionTime === null
            ? null
            : {
                start: state.submissionTime.start.toString(),
                end: state.submissionTime.end.toString(),
              },
        preset: state.presetSelected,
      },
    });

    console.log("SEARCH TIME", state.submissionTime);
  }, [state]);

  return (
    <div className="flex flex-col-reverse items-center gap-4">
      <MenuTrigger>
        <Button leadingVisual={<FunnelIcon />}>Filter</Button>
        <ModalPopover
          popoverProps={{
            placement: "bottom right",
          }}
        >
          <Menu className="focus:outline-none min-w-42">
            <TitleDescFilter />
            <StatusFilter />
            <AuthorFilter />
            <SubmissionTimeFilter />
          </Menu>
        </ModalPopover>
      </MenuTrigger>
    </div>
  );
};

export const DraftFilterDisplay = () => {
  const state = useDraftFilterStore((s) => s);

  const trpc = useTRPC();
  const authors = useQuery(trpc.article.draft.getAuthorList.queryOptions());

  return (
    <div className="flex gap-2 mt-2 items-center flex-wrap">
      <MultiSelectFilterDisplay
        keys={state.statuses}
        setKeys={state.setStatuses}
        attr="Status"
        icon={
          <div className="size-3 border-[0.125rem] border-dashed rounded-full" />
        }
        buttonContent={
          <>
            {[...state.statuses].map((status) => (
              <div
                key={status}
                className={cn(statusDisplay[status].className, "-ml-0.5")}
              />
            ))}
            <p className="ml-1">
              {state.statuses.size === 1
                ? statusDisplay[[...state.statuses][0]].display
                : `${state.statuses.size} statuses`}
            </p>
          </>
        }
      >
        <StatusMultiSelectBody />
      </MultiSelectFilterDisplay>
      <MultiSelectFilterDisplay
        keys={state.authors}
        setKeys={state.setAuthors}
        attr="Author"
        icon={<PeopleIcon />}
        buttonContent={
          <>
            {authors.isSuccess &&
              authors.data
                .filter((a) => state.authors.has(a.id))
                .filter((a) => a.image !== null)
                .map((a) => (
                  <img
                    key={a.id}
                    className="size-3 rounded-full -ml-0.5"
                    src={a.image!}
                    alt={a.name}
                  />
                ))}
            <p className="ml-1">
              {state.authors.size === 1
                ? authors.data?.find((a) => a.id === [...state.authors][0])!
                    .name
                : `${state.authors.size} authors`}
            </p>
          </>
        }
      >
        <AuthorMultiSelectBody />
      </MultiSelectFilterDisplay>
      <DateRangeFilterDisplay
        range={state.submissionTime}
        setRange={state.setSubmissionTime}
        attr={"Submitted"}
        buttonContent={
          <>
            {state.presetSelected !== "none" &&
              submissionRangePresets[state.presetSelected].display}
            {state.presetSelected === "none" &&
              state.submissionTime?.start &&
              state.submissionTime.end &&
              new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
              }).formatRange(
                state.submissionTime.start.toDate(getLocalTimeZone()),
                state.submissionTime.end.toDate(getLocalTimeZone())
              )}
          </>
        }
        presetSelected={state.presetSelected !== "none"}
      >
        <SubmissionTimeFilterPopoverBody />
      </DateRangeFilterDisplay>
      <TextFilterDisplay
        text={state.titleDesc}
        setText={state.setTitleDesc}
        attr={"Title or Description"}
      >
        <TitleDescFilterBody />
      </TextFilterDisplay>
    </div>
  );
};

function TitleDescFilter() {
  return (
    <SubmenuTrigger>
      <MenuItem>
        <div className="flex justify-between gap-2 items-center">
          <div className="flex gap-2 items-center">
            <div className="w-4 font-bold items-center justify-center text-center font-serif">
              T
            </div>
            <p className="text-xs">Title & Description</p>
          </div>
          <ChevronRightIcon />
        </div>
      </MenuItem>
      <ModalPopover>
        <TitleDescFilterBody />
      </ModalPopover>
    </SubmenuTrigger>
  );
}

function TitleDescFilterBody() {
  const [titleDesc, setTitleDesc] = useDraftFilterStore(
    useShallow((s) => [s.titleDesc, s.setTitleDesc])
  );

  return (
    <div className="flex flex-col gap-2 p-4 outline-none">
      <p className="text-xs font-semibold">Search by Title or Description</p>
      <TextField autoFocus value={titleDesc} onChange={setTitleDesc}>
        <Input fullWidth placeholder="Contains..." />
      </TextField>
    </div>
  );
}

function MultiSelectFilterDisplay(
  props: React.PropsWithChildren<{
    keys: Set<Key>;
    setKeys: (newSet: Set<Key>) => void;
    icon: React.ReactNode;
    buttonContent: React.ReactNode;
    attr: string;
  }>
) {
  return (
    <>
      {props.keys.size > 0 && (
        <div className="flex text-xs items-center">
          <div className="flex gap-2 items-center rounded-s-md h-8 px-4 py-1 border-s-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70">
            {props.icon}
            <p className="text-xs">{props.attr}</p>
          </div>
          <div className="h-8 px-2 py-1 items-center justify-center border-[0.0125rem] border-zinc-300/70">
            <p className="mt-1">{props.keys.size === 1 ? "is" : "is any of"}</p>
          </div>
          <MultiSelect
            selectedKeys={props.keys}
            setSelectedKeys={props.setKeys}
          >
            <DialogTrigger>
              <AriaButton className="items-center flex gap-2 hover:bg-zinc-300/30 transition-colors">
                <div className="flex items-center h-8 px-4 py-1 border-e-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70">
                  {props.buttonContent}
                </div>
              </AriaButton>
              {props.children}
            </DialogTrigger>
          </MultiSelect>
          <AriaButton
            className="flex gap-2 items-center rounded-e-md h-8 px-3 py-1 border-e-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70 hover:bg-zinc-300/30 transition-colors"
            onPress={() => props.setKeys(new Set())}
          >
            <span className="-mx-1.5">
              <XMarkIcon />
            </span>
          </AriaButton>
        </div>
      )}
    </>
  );
}

function DateRangeFilterDisplay(
  props: React.PropsWithChildren<{
    range: DateRange | null;
    setRange: (dateRange: DateRange | null) => void;
    presetSelected: boolean;
    attr: string;
    buttonContent: React.ReactNode;
  }>
) {
  return (
    <>
      {props.range !== null && (
        <div className="flex text-xs items-center">
          <div className="flex gap-2 items-center rounded-s-md h-8 px-4 py-1 border-s-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70">
            <ClockIcon />
            <p className="text-xs">{props.attr}</p>
          </div>
          <div className="h-8 px-2 py-1 items-center justify-center border-[0.0125rem] border-zinc-300/70">
            <p className="mt-1">
              {props.presetSelected
                ? "during"
                : props.range.start.compare(props.range.end) === 0
                ? "on"
                : "between"}
            </p>
          </div>
          <DialogTrigger>
            <AriaButton className="items-center flex gap-2 hover:bg-zinc-300/30 transition-colors">
              <div className="flex items-center h-8 px-4 py-1 border-e-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70">
                {props.buttonContent}
              </div>
            </AriaButton>
            <ModalPopover>{props.children}</ModalPopover>
          </DialogTrigger>
          <AriaButton
            className="flex gap-2 items-center rounded-e-md h-8 px-3 py-1 border-e-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70 hover:bg-zinc-300/30 transition-colors"
            onPress={() => props.setRange(null)}
          >
            <span className="-mx-1.5">
              <XMarkIcon />
            </span>
          </AriaButton>
        </div>
      )}
    </>
  );
}

function TextFilterDisplay(
  props: React.PropsWithChildren<{
    text: string;
    setText: (text: string) => void;
    attr: string;
  }>
) {
  return (
    <>
      {props.text !== "" && (
        <div className="flex text-xs items-center">
          <div className="flex gap-2 items-center rounded-s-md h-8 px-4 py-1 border-s-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70">
            <div className="w-4 font-bold items-center justify-center text-center font-serif">
              T
            </div>
            <p className="text-xs">{props.attr}</p>
          </div>
          <div className="h-8 px-2 py-1 items-center justify-center border-[0.0125rem] border-zinc-300/70">
            <p className="mt-1">contains</p>
          </div>
          <DialogTrigger>
            <AriaButton className="items-center flex gap-2 hover:bg-zinc-300/30 transition-colors">
              <div className="flex items-center h-8 px-4 py-1 border-e-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70 max-w-[8ch] truncate">
                {props.text}
              </div>
            </AriaButton>
            <ModalPopover>{props.children}</ModalPopover>
          </DialogTrigger>
          <AriaButton
            className="flex gap-2 items-center rounded-e-md h-8 px-3 py-1 border-e-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70 hover:bg-zinc-300/30 transition-colors"
            onPress={() => props.setText("")}
          >
            <span className="-mx-1.5">
              <XMarkIcon />
            </span>
          </AriaButton>
        </div>
      )}
    </>
  );
}

function StatusFilter() {
  const [selectedKeys, setSelectedKeys] = useDraftFilterStore(
    useShallow((s) => [s.statuses, s.setStatuses])
  );

  return (
    <SubmenuTrigger>
      <MenuItem>
        <div className="flex justify-between gap-2 items-center">
          <div className="flex gap-2 items-center">
            <div className="size-4 border-[0.125rem] border-dashed rounded-full" />
            <p className="text-xs">Status</p>
          </div>
          <ChevronRightIcon />
        </div>
      </MenuItem>
      <MultiSelect
        selectedKeys={selectedKeys}
        setSelectedKeys={setSelectedKeys}
      >
        <StatusMultiSelectBody />
      </MultiSelect>
    </SubmenuTrigger>
  );
}

function StatusMultiSelectBody() {
  return (
    <MultiSelectBody>
      {Object.entries(statusDisplay).map(([key, value]) => (
        <MultiSelectItem
          key={key}
          id={key}
          value={key}
          textValue={value.display}
        >
          <span className={value.className} />
          <p>{value.display}</p>
        </MultiSelectItem>
      ))}
    </MultiSelectBody>
  );
}

function AuthorFilter() {
  const [selectedKeys, setSelectedKeys] = useDraftFilterStore(
    useShallow((s) => [s.authors, s.setAuthors])
  );

  return (
    <SubmenuTrigger>
      <MenuItem>
        <div className="flex justify-between gap-2 items-center">
          <div className="flex gap-2 items-center">
            <PeopleIcon />
            <p className="text-xs">Author</p>
          </div>
          <ChevronRightIcon />
        </div>
      </MenuItem>
      <MultiSelect
        selectedKeys={selectedKeys}
        setSelectedKeys={setSelectedKeys}
      >
        <AuthorMultiSelectBody />
      </MultiSelect>
    </SubmenuTrigger>
  );
}

function AuthorMultiSelectBody() {
  const trpc = useTRPC();
  const authors = useQuery(trpc.article.draft.getAuthorList.queryOptions());

  return (
    <MultiSelectBody>
      {authors.status === "success" &&
        authors.data.map((author) => (
          <MultiSelectItem
            id={author.id}
            value={author.id}
            textValue={author.name}
          >
            {author.image && (
              <img src={author.image} className="size-4 rounded-full" />
            )}
            <div className="flex flex-col">
              <p>{author.name}</p>
              <p className="text-[10px] text-neutral-500">{author.email}</p>
            </div>
          </MultiSelectItem>
        ))}
    </MultiSelectBody>
  );
}

function SubmissionTimeFilter() {
  return (
    <SubmenuTrigger>
      <MenuItem>
        <div className="flex justify-between gap-2 items-center">
          <div className="flex gap-2 items-center">
            <ClockIcon />
            <p className="text-xs">Submission Time</p>
          </div>
          <ChevronRightIcon />
        </div>
      </MenuItem>
      <ModalPopover>
        <SubmissionTimeFilterPopoverBody />
      </ModalPopover>
    </SubmenuTrigger>
  );
}

function SubmissionTimeFilterPopoverBody() {
  const [value, setValue, presetSelected, setPresetSelected] =
    useDraftFilterStore(
      useShallow((s) => [
        s.submissionTime,
        s.setSubmissionTime,
        s.presetSelected,
        s.setPresetSelected,
      ])
    );

  return (
    <div className="flex flex-col gap-2 p-4 outline-none">
      <p className="text-sm font-semibold">Choose a Submission Range</p>
      <div className=" gap-2">
        <div className=" flex flex-col gap-2">
          {Object.entries(submissionRangePresets).map(([key, value]) => (
            <Button
              variant={presetSelected !== key ? "outline" : "primary"}
              fullWidth
              onPress={() => {
                setPresetSelected(key as keyof typeof submissionRangePresets);
                setValue(value.getRange());
              }}
            >
              {value.display}
            </Button>
          ))}
        </div>
        <RangeCalendar
          value={value}
          onChange={(value) => {
            setPresetSelected("none");
            setValue({
              start: value.start,
              end: value.end,
            });
          }}
        />
      </div>
    </div>
  );
}

function getSemesterRange() {
  const date = today(getLocalTimeZone());

  const fallStart = startOfWeek(
    new CalendarDate(date.year, 8, 1).add({
      weeks: 4,
    }),
    "en-US"
  ).add({ days: 1 });

  const winterEnd = startOfWeek(
    new CalendarDate(date.year + 1, 1, 1).add({
      weeks: 4,
    }),
    "en-US"
  );

  // in fall or winter session
  if (date.compare(fallStart) > 0 && date.compare(winterEnd) < 0) {
    return { start: fallStart, end: winterEnd };
  } else {
    // in spring or summer session
    const springStart = startOfWeek(
      new CalendarDate(date.year, 1, 1).add({
        weeks: 4,
      }),
      "en-US"
    ).add({ days: 1 });
    const summerEnd = startOfWeek(
      new CalendarDate(date.year, 8, 1).add({
        weeks: 4,
      }),
      "en-US"
    );

    return { start: springStart, end: summerEnd };
  }
}

function getAcademicYearRange() {
  const date = today(getLocalTimeZone());

  const fallStart = startOfWeek(
    new CalendarDate(date.year, 8, 1).add({
      weeks: 4,
    }),
    "en-US"
  ).add({ days: 1 });

  if (date.compare(fallStart) > 0) {
    const nextSummerEnd = startOfWeek(
      new CalendarDate(date.year + 1, 8, 1).add({
        weeks: 4,
      }),
      "en-US"
    );

    return { start: fallStart, end: nextSummerEnd };
  } else {
    const lastFallStart = startOfWeek(
      new CalendarDate(date.year - 1, 8, 1).add({
        weeks: 4,
      }),
      "en-US"
    ).add({ days: 1 });

    return { start: lastFallStart, end: fallStart.subtract({ days: 1 }) };
  }
}
