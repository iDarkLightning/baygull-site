import React from "react";
import { MenuItem as AriaMenuItem } from "react-aria-components";
import { cn } from "~/lib/cn";

export const MenuItem: React.FC<
  Omit<React.ComponentProps<typeof AriaMenuItem>, "className">
> = (props) => (
  <AriaMenuItem
    className={({ isSelected, isDisabled, isFocused, isHovered }) =>
      cn(
        " flex text-start cursor-default flex-col rounded-md px-4 py-2 text-sm text-neutral-700 font-medium outline-none transition-[background-color]",
        {
          "bg-neutral-100": isFocused,
          "bg-neutral-100 outline-none": isHovered && !isDisabled,
          "bg-sky-800/80 text-white": isSelected,
          "bg-sky-900/80 text-white": isSelected && (isHovered || isFocused),
          "cursor-not-allowed opacity-70": isDisabled,
        }
      )
    }
    {...props}
  />
);

export { MenuTrigger } from "react-aria-components";
