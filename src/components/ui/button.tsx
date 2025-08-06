import { cva, type VariantProps } from "class-variance-authority";
import React, { useId } from "react";
import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";
import { cn } from "~/lib/cn";
import { ThreeDotsLoading } from "./three-dots";
import { FocusRing } from "react-aria";

export const button = cva(
  [
    "text-sm font-medium transition-colors transition-[width] whitespace-nowrap relative touch-none select-none",
    "focus:outline-none",
    "disabled:scale-100 active:scale-95",
    "disabled:opacity-70 disabled:bg-neutral-200 disabled:cursor-not-allowed disabled:active:scale-100",
    "data-[loading=true]:!cursor-wait",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-neutral-800 hover:bg-neutral-800/85 text-white disabled:hover:bg-neutral-300",
        outline:
          "border-[0.0125rem] border-zinc-300/70 hover:border-zinc-400/80 disabled:hover:bg-transparent shadow-xs",
        secondary:
          "bg-sky-100 text-sky-900 border-[0.0125rem] border-sky-700/60 hover:bg-sky-200/70",
        ghost:
          "border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:hover:bg-transparent",
        danger:
          "bg-neutral-400 text-feedback-error-primary border-feedback-error-primary hover:bg-neutral-300",
        disabled: "border-neutral-300 bg-neutral-400",
        none: "border-transparent",
      },
      size: {
        base: "h-8 px-4 py-1 text-sm",
        icon: "h-8 w-8 p-1 aspect-square",
        max: "h-max w-max px-4 py-1",
        fit: "h-fit w-fit",
      },
      fullWidth: {
        true: "w-full",
        false: "w-max",
      },
      isCircular: {
        true: "rounded-full",
        false: "rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "base",
      fullWidth: false,
      isCircular: true,
    },
  }
);

export type ButtonProps = Omit<AriaButtonProps, "className" | "children"> &
  VariantProps<typeof button> & {
    isLoading?: boolean;
    children: React.ReactNode;
    leadingVisual?: React.ReactNode;
    trailingVisual?: React.ReactNode;
    align?: "start" | "center";
    ref?: React.Ref<HTMLButtonElement>;
  };

export const Button: React.FC<ButtonProps> = ({
  children,
  variant,
  size,
  fullWidth,
  isLoading,
  isCircular,
  leadingVisual,
  trailingVisual,
  align = "center",
  ref,
  ...props
}) => {
  const id = useId();
  const disabled = props.isDisabled || isLoading;

  return (
    <FocusRing focusRingClass="ring-[1.25px] ring-offset-0 ring-sky-800">
      <AriaButton
        className={cn(
          button({
            variant: props.isDisabled ? "disabled" : variant,
            size,
            fullWidth,
            isCircular,
          })
        )}
        ref={ref}
        isDisabled={disabled}
        data-loading={isLoading}
        aria-describedby={id}
        {...props}
      >
        {isLoading && (
          <ThreeDotsLoading
            role="status"
            aria-live="polite"
            aria-atomic
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        )}

        <span
          id={id}
          aria-hidden={isLoading}
          className={cn(
            "flex items-center gap-2",
            align === "center" ? "justify-center" : "justify-start",
            isLoading ? "opacity-0" : "opacity-100"
          )}
        >
          {leadingVisual && leadingVisual}
          <span className="flex flex-col gap-1">{children}</span>
          {trailingVisual && trailingVisual}
        </span>
      </AriaButton>
    </FocusRing>
  );
};

Button.displayName = "Button";
