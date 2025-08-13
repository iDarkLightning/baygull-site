import {
  CalendarDate,
  endOfMonth,
  endOfWeek,
  endOfYear,
  getLocalTimeZone,
  parseDate,
  startOfMonth,
  startOfWeek,
  startOfYear,
  today,
} from "@internationalized/date";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useEffect } from "react";
import { Menu, TextField } from "@baygull/ui/aria";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@baygull/ui/button";
import {
  ClockIcon,
  FunnelIcon,
  PeopleIcon,
  StatusIcon,
  TextIcon,
} from "@baygull/ui/icons";
import { Input } from "@baygull/ui/input";
import { MenuTrigger, SubmenuItem } from "@baygull/ui/menu";
import { ModalPopover } from "@baygull/ui/modal-popover";
import {
  MultiSelect,
  MultiSelectBody,
  MultiSelectItem,
} from "@baygull/ui/multi-select";
import { RangeCalendar } from "@baygull/ui/range-calendar";
import {
  FilterAttribute,
  FilterClear,
  FilterDescription,
  FilterDisplay,
  FilterMenu,
  FilterMenuButton,
} from "@baygull/ui/table-filter";
import { useDraftFilterStore } from "~/lib/articles/draft-filter-store";
import { cn } from "@baygull/ui/cn";
import { useTRPC } from "~/lib/trpc-client";

const typesDisplay = {
  default: {
    className: "w-2 h-2 bg-sky-400 rounded-full",
    display: "Default",
  },
  headline: {
    className: "w-2 h-2 bg-purple-400 rounded-full",
    display: "Headline",
  },
  graphic: {
    className: "w-2 h-2 bg-green-400 rounded-full",
    display: "Graphic",
  },
};

export const submissionRangePresets = {
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
    getRange: () => {
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
    },
  },
  academic: {
    display: "This Academic Year",
    getRange: () => {
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
    },
  },
};

export type TDatePresets = keyof typeof submissionRangePresets | "none";

const routeApi = getRouteApi("/manage/_admin-layout/a/$status");

export const DraftFilterMenu = () => {
  const state = useDraftFilterStore(
    useShallow((s) => ({
      types: s.types,
      authors: s.authors,
      titleDesc: s.titleDesc,
      submissionTime: s.submissionTime,
      presetSelected: s.presetSelected,
    }))
  );
  const navigate = routeApi.useNavigate();
  const search = routeApi.useSearch();

  useEffect(() => {
    const typesChanged =
      state.types.size !== search.types.length ||
      [...state.types].some((type) => !search.types.includes(type));
    const authorsChanged =
      state.authors.size !== search.authors.length ||
      [...state.authors].some((author) => !search.authors.includes(author));
    const titleDescChanged = state.titleDesc !== search.titleDesc;
    const submissionTimeChanged = (() => {
      if (state.submissionTime === null) return search.submissionTime !== null;
      if (search.submissionTime === null) return state.submissionTime !== null;

      const startEqual =
        state.submissionTime.start.compare(
          parseDate(search.submissionTime.start)
        ) === 0;
      const endEqual =
        state.submissionTime.end.compare(
          parseDate(search.submissionTime.end)
        ) === 0;

      return !startEqual || !endEqual;
    })();
    const presetChanged = state.presetSelected !== search.preset;

    if (
      ![
        typesChanged,
        authorsChanged,
        titleDescChanged,
        submissionTimeChanged,
        presetChanged,
      ].includes(true)
    )
      return;

    navigate({
      replace: true,
      search: {
        types: [...state.types],
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
            <SubmenuItem
              delay={10}
              icon={<TextIcon />}
              label="Title & Description"
            >
              <TitleDescFilterPopover />
            </SubmenuItem>
            <SubmenuItem delay={10} icon={<StatusIcon />} label="Type">
              <TypesMultiSelect />
            </SubmenuItem>
            <SubmenuItem delay={10} icon={<PeopleIcon />} label="Author">
              <AuthorMultiSelect />
            </SubmenuItem>
            <SubmenuItem
              delay={10}
              icon={<ClockIcon />}
              label="Submission Time"
            >
              <SubmissionTimeFilterPopover />
            </SubmenuItem>
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
      <FilterDisplay isActive={state.types.size > 0}>
        <FilterAttribute icon={<StatusIcon />}>Types</FilterAttribute>
        <FilterDescription>
          {state.types.size === 1 ? "is" : "is any of"}
        </FilterDescription>
        <FilterMenu>
          <FilterMenuButton>
            {[...state.types].map((type) => (
              <div
                key={type}
                className={cn(typesDisplay[type].className, "-ml-0.5")}
              />
            ))}
            <p className="ml-1">
              {state.types.size === 1
                ? typesDisplay[[...state.types][0]].display
                : `${state.types.size} types`}
            </p>
          </FilterMenuButton>
          <TypesMultiSelect />
        </FilterMenu>
        <FilterClear onPress={() => state.setTypes(new Set())} />
      </FilterDisplay>
      <FilterDisplay isActive={state.authors.size > 0}>
        <FilterAttribute icon={<PeopleIcon />}>Author</FilterAttribute>
        <FilterDescription>
          {state.authors.size === 1 ? "is" : "is any of"}
        </FilterDescription>
        <FilterMenu>
          <FilterMenuButton>
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
                    referrerPolicy="no-referrer"
                  />
                ))}
            <p className="ml-1">
              {state.authors.size === 1
                ? authors.data?.find((a) => a.id === [...state.authors][0])!
                    .name
                : `${state.authors.size} authors`}
            </p>
          </FilterMenuButton>
          <AuthorMultiSelect />
        </FilterMenu>
        <FilterClear onPress={() => state.setAuthors(new Set())} />
      </FilterDisplay>
      <FilterDisplay isActive={state.submissionTime !== null}>
        <FilterAttribute icon={<ClockIcon />}>Submitted</FilterAttribute>
        {state.presetSelected !== "today" && (
          <FilterDescription>
            {state.presetSelected !== "none"
              ? "during"
              : state.submissionTime?.start.compare(
                  state.submissionTime?.end
                ) === 0
              ? "on"
              : "between"}
          </FilterDescription>
        )}
        <FilterMenu>
          <FilterMenuButton>
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
          </FilterMenuButton>
          <SubmissionTimeFilterPopover />
        </FilterMenu>
        <FilterClear
          onPress={() => {
            state.setSubmissionTime(null);
            state.setPresetSelected("none");
          }}
        />
      </FilterDisplay>
      <FilterDisplay isActive={state.titleDesc !== ""}>
        <FilterAttribute icon={<TextIcon />}>
          Title or Description
        </FilterAttribute>
        <FilterDescription>contains</FilterDescription>
        <FilterMenu>
          <FilterMenuButton>{state.titleDesc}</FilterMenuButton>
          <TitleDescFilterPopover />
        </FilterMenu>
        <FilterClear
          onPress={() => {
            state.setTitleDesc("");
          }}
        />
      </FilterDisplay>
    </div>
  );
};

function TitleDescFilterPopover() {
  const [titleDesc, setTitleDesc] = useDraftFilterStore(
    useShallow((s) => [s.titleDesc, s.setTitleDesc])
  );

  return (
    <ModalPopover>
      <div className="flex flex-col gap-2 p-4 outline-none">
        <p className="text-xs font-semibold">Search by Title or Description</p>
        <TextField
          autoFocus
          value={titleDesc}
          onChange={setTitleDesc}
          aria-label="Search by Title or Description"
        >
          <Input fullWidth placeholder="Contains..." />
        </TextField>
      </div>
    </ModalPopover>
  );
}

function TypesMultiSelect() {
  const [keys, setKeys] = useDraftFilterStore(
    useShallow((s) => [s.types, s.setTypes])
  );

  return (
    <MultiSelect selectedKeys={keys} setSelectedKeys={setKeys}>
      <MultiSelectBody>
        {Object.entries(typesDisplay).map(([key, value]) => (
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
    </MultiSelect>
  );
}

function AuthorMultiSelect() {
  const [keys, setKeys] = useDraftFilterStore(
    useShallow((s) => [s.authors, s.setAuthors])
  );

  const trpc = useTRPC();
  const authors = useQuery(trpc.article.draft.getAuthorList.queryOptions());

  return (
    <MultiSelect selectedKeys={keys} setSelectedKeys={setKeys}>
      <MultiSelectBody>
        {authors.status === "success" &&
          authors.data.map((author) => (
            <MultiSelectItem
              key={author.id}
              id={author.id}
              value={author.id}
              textValue={author.name}
            >
              {author.image && (
                <img
                  src={author.image}
                  className="size-4 rounded-full"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex flex-col">
                <p>{author.name}</p>
                <p className="text-[10px] text-neutral-500">{author.email}</p>
              </div>
            </MultiSelectItem>
          ))}
      </MultiSelectBody>
    </MultiSelect>
  );
}

function SubmissionTimeFilterPopover() {
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
    <ModalPopover>
      <div className="flex flex-col gap-2 p-4 outline-none">
        <p className="text-sm font-semibold">Choose a Submission Range</p>
        <div className=" gap-2">
          <div className=" flex flex-col gap-2">
            {Object.entries(submissionRangePresets).map(([key, value]) => (
              <Button
                key={key}
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
    </ModalPopover>
  );
}
