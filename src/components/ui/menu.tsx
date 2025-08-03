import React from "react";
import {
  MenuItem as AriaMenuItem,
  SubmenuTrigger,
} from "react-aria-components";
import { cn } from "~/lib/cn";
import { ChevronRightIcon } from "./icons";
import { createLink } from "@tanstack/react-router";

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

export const MenuItemLink = createLink(MenuItem);

MenuItem.displayName = "MenuItem";

export const SubmenuItem: React.FC<
  Omit<
    React.ComponentProps<typeof SubmenuTrigger>,
    "className" | "children"
  > & {
    icon: React.ReactNode;
    label: React.ReactNode;
    children: React.ComponentProps<typeof SubmenuTrigger>["children"][number];
  }
> = ({ icon, label, children, ...props }) => (
  <SubmenuTrigger {...props}>
    <MenuItem>
      <div className="flex justify-between gap-2 items-center">
        <div className="flex gap-2 items-center">
          {icon}
          <p className="text-xs">{label}</p>
        </div>
        <ChevronRightIcon />
      </div>
    </MenuItem>
    {children}
  </SubmenuTrigger>
);

export { MenuTrigger } from "react-aria-components";
