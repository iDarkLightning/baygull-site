import { getLocalTimeZone, isToday } from "@internationalized/date";
import React from "react";
import {
  RangeCalendar as AriaRangeCalendar,
  CalendarCell,
  CalendarGrid,
  Heading,
} from "react-aria-components";
import { cn } from "../cn";
import { Button } from "./button";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export const RangeCalendar: React.FC<
  React.ComponentProps<typeof AriaRangeCalendar>
> = (props) => {
  return (
    <AriaRangeCalendar className="w-full" {...props}>
      <header className="flex items-center py-2 w-full justify-between relative">
        <Button size="icon" slot="previous" variant="ghost">
          <ChevronLeftIcon />
        </Button>
        <Heading className="text-sm font-semibold my-2 absolute left-1/2 -translate-x-1/2" />
        <Button size="icon" slot="next" variant="ghost">
          <ChevronRightIcon />
        </Button>
      </header>
      <CalendarGrid className="w-full">
        {(date) => (
          <CalendarCell
            date={date}
            className={({
              date,
              isSelected,
              isSelectionStart,
              isSelectionEnd,
              isHovered,
              isOutsideVisibleRange,
            }) =>
              cn(
                "p-2 text-center text-sm font-medium cursor-default my-0.5 [td:first-child_&]:rounded-s-md [td:last-child_&]:rounded-e-md",
                "focus:outline-none focus-visible:ring-[1.25px] focus-visible:ring-offset-0 focus-visible:ring-sky-800",
                {
                  "relative after:size-2 after:absolute after:bottom-[10px] after:left-1/2 after:-translate-x-1/2 after:text-sky-600 after:content-['•']":
                    isToday(date, getLocalTimeZone()),
                  "rounded-md": !isSelected,
                  "text-neutral-400": isOutsideVisibleRange,
                  "bg-sky-50": isSelected,
                  "rounded-s-md": isSelectionStart,
                  "rounded-e-md": isSelectionEnd,
                  "bg-black text-white after:text-white":
                    isSelectionStart || isSelectionEnd || isHovered,
                  "bg-neutral-100 text-black rounded-md":
                    isHovered &&
                    !(isSelectionStart || isSelectionEnd || isSelected),
                }
              )
            }
          />
        )}
      </CalendarGrid>
    </AriaRangeCalendar>
  );
};
