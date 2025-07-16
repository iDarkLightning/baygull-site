import { CSSProperties, type ComponentProps } from "react";
import {
  Popover as AriaPopover,
  Dialog,
  DialogTrigger,
} from "react-aria-components";
import { cn } from "~/lib/cn";

type PopoverProps = Omit<ComponentProps<typeof AriaPopover>, "className"> & {
  triggerWidth?: number;
};

export const Popover: React.FC<PopoverProps> = ({
  children,
  triggerWidth,
  ...props
}) => {
  return (
    <AriaPopover
      style={
        {
          "--trigger-width": `${triggerWidth}px`,
        } as CSSProperties
      }
      className={({ isEntering, isExiting, placement }) =>
        cn(
          "min-w-[var(--trigger-width)] rounded-md border-[0.0125rem] border-neutral-300/70 bg-white text-neutral-700 shadow-sm",
          "focus:outline-none",
          {
            "slide-in-from-top-2": placement === "bottom" && isEntering,
            "slide-in-from-bottom-2": placement === "top" && isEntering,
            "slide-in-from-left-2": placement === "right" && isEntering,
            "slide-in-from-right-2": placement === "left" && isEntering,
            "animate-in fade-in-0 fill-mode-forwards duration-150 ease-out":
              isEntering,
            "animate-out fade-out-0 fill-mode-backwards duration-150 ease-in":
              isExiting,
            "slide-out-to-bottom-2": placement === "top" && isExiting,
            "slide-out-to-left-2": placement === "right" && isExiting,
            "slide-out-to-top-2": placement === "bottom" && isExiting,
            "slide-out-to-right-2": placement === "left" && isExiting,
          }
        )
      }
      {...props}
    >
      {children}
    </AriaPopover>
  );
};

Popover.displayName = "Popover";

type PopoverBodyProps = Omit<ComponentProps<typeof Dialog>, "className">;

export const PopoverBody: React.FC<PopoverBodyProps> = ({
  children,
  ...props
}) => {
  return (
    <Dialog
      role="dialog"
      className="flex flex-col gap-2 p-4 outline-none"
      {...props}
    >
      {children}
    </Dialog>
  );
};

PopoverBody.displayName = "PopoverBody";
