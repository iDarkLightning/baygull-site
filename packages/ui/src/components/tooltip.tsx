import {
  Tooltip as AriaTooltip,
  TooltipTrigger as AriaTooltipTrigger,
  type TooltipTriggerComponentProps,
} from "react-aria-components";
import { cn } from "../cn";

export const TooltipTrigger: React.FC<TooltipTriggerComponentProps> = ({
  delay = 250,
  ...props
}) => {
  return <AriaTooltipTrigger delay={delay} {...props} />;
};

TooltipTrigger.displayName = "TooltipTrigger";

export const Tooltip: React.FC<
  Omit<React.ComponentProps<typeof AriaTooltip>, "className">
> = ({ offset = 8, ref, ...props }) => (
  <AriaTooltip
    ref={ref}
    offset={offset}
    className={({ isEntering, isExiting, placement }) =>
      cn(
        "rounded-md border-[0.0125rem] border-neutral-300/40 bg-neutral-400 bg-opacity-40 px-2 py-1 text-sm font-medium backdrop-blur-lg",
        {
          "slide-in-from-top-2": placement === "bottom" && isEntering,
          "slide-in-from-bottom-2": placement === "top" && isEntering,
          "animate-in fade-in-0 fill-mode-forwards duration-150 ease-out":
            isEntering,
          "animate-out fade-out-0 fill-mode-forwards duration-150 ease-in":
            isExiting,
          "slide-out-to-bottom-2": placement === "top" && isExiting,
          "slide-out-to-top-2": placement === "bottom" && isExiting,
        }
      )
    }
    {...props}
  />
);

Tooltip.displayName = "Tooltip";
