import { type VariantProps, cva } from "class-variance-authority";
import React, { type CSSProperties } from "react";
import {
  Input as AriaInput,
  type InputProps as AriaInputProps,
} from "react-aria-components";
import { cn } from "~/lib/cn";
import useMeasure from "react-use-measure";

export const inputBase = cva([
  "h-8 px-2 py-2 text-xs",
  "rounded-md border-[0.0125rem] bg-white border-zinc-300/70 hover:border-zinc-400/80 placeholder:text-neutral-500 placeholder:text-xs shadow-xs",
  "focus:outline-none focus-visible:ring-[1.25px] focus-visible:ring-offset-0",
  "disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-neutral-100",
]);

const input = cva(inputBase(), {
  variants: {
    fullWidth: {
      true: "w-full",
      false: "w-auto",
    },
    visual: {
      leading: "pl-[var(--input-padding-left)]",
      trailing: "pr-[var(--input-padding-right)]",
      "leading-trailing": "pl-8 pr-[var(--input-padding-right)]",
    },
    invalid: {
      true: "!border-red-700 focus-visible:ring-red-700",
      false: "focus-visible:ring-sky-800",
    },
  },
  defaultVariants: {
    fullWidth: false,
    invalid: false,
  },
});

export type InputProps = Omit<AriaInputProps, "className" | "disabled"> &
  Omit<VariantProps<typeof input>, "visual" | "invalid"> & {
    leadingVisual?: React.ReactNode;
    trailingVisual?: React.ReactNode;
    isDisabled?: boolean;
    ref?: React.Ref<HTMLInputElement>;
  };

export const Input: React.FC<InputProps> = ({
  fullWidth,
  leadingVisual,
  trailingVisual,
  isDisabled,
  ...props
}) => {
  const [leadingVisualRef, leadingBounds] = useMeasure();
  const [trailingVisualRef, trailingBounds] = useMeasure();
  const visual = (() => {
    if (leadingVisual && trailingVisual) {
      return "leading-trailing";
    } else if (leadingVisual) {
      return "leading";
    } else if (trailingVisual) {
      return "trailing";
    }

    return undefined;
  })();

  return (
    <div
      className={cn("relative select-none", fullWidth ? "w-full" : "w-max")}
      style={
        {
          "--input-padding-left": `max(${leadingBounds.width}px, 2rem)`,
          "--input-padding-right": `max(${trailingBounds.width}px, 2rem)`,
        } as CSSProperties
      }
    >
      {leadingVisual && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 pt-0.5"
          ref={leadingVisualRef}
        >
          {leadingVisual}
        </div>
      )}
      <AriaInput
        className={({ isInvalid }) =>
          input({
            fullWidth,
            visual,
            invalid: isInvalid,
          })
        }
        disabled={isDisabled}
        {...props}
        ref={props.ref}
      />
      {trailingVisual && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 pt-0.5"
          ref={trailingVisualRef}
        >
          {trailingVisual}
        </div>
      )}
    </div>
  );
};

Input.displayName = "Input";
