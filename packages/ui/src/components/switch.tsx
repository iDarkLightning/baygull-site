import React, { ComponentProps } from "react";
import { Switch as AriaSwitch } from "react-aria-components";
import { cn } from "../cn";

type SwitchProps = Omit<
  ComponentProps<typeof AriaSwitch>,
  "className" | "children"
>;

export const Switch: React.FC<React.PropsWithChildren<SwitchProps>> = (
  props
) => (
  <AriaSwitch
    className="group inline-flex touch-none items-center gap-1.5"
    style={{ WebkitTapHighlightColor: "transparent" }}
    {...props}
  >
    {({ isSelected, isPressed, isFocusVisible }) => (
      <>
        <span
          className={cn(
            "flex shadow-inner justify-start p-0.5 w-9 rounded-full border-[0.0125rem] border-zinc-300/70 bg-zinc-100 transition-colors",
            isSelected && "bg-sky-600 border-transparent",
            isPressed && "bg-sky-300",
            isFocusVisible && "ring-[1.25px] ring-offset-0 ring-sky-800"
          )}
        >
          <span
            className={cn(
              "size-4 rounded-full bg-white block shadow-sm transition-all will-change-transform",
              isPressed ? "w-5" : "w-4",
              isSelected &&
                (isPressed
                  ? "translate-x-[calc(100%-0.5rem)]"
                  : "translate-x-[calc(100%)]")
            )}
          />
        </span>
        {props.children}
      </>
    )}
  </AriaSwitch>
);
