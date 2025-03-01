"use client";

import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import {
  TextArea as AriaTextArea,
  type TextAreaProps as AriaTextAreaProps,
} from "react-aria-components";

const textArea = cva(
  [
    "rounded-sm bg-neutral-50 border-[0.0125rem] border-neutral-300/70 hover:bg-neutral-100/80 placeholder:text-neutral-50 placeholder:text-xs",
    "focus:outline-none focus-visible:ring-[1.25px] focus-visible:ring-sky-800 focus-visible:ring-offset-0",
    "disabled:opacity-70 disabled:cursor-not-allowed disabled:bg-neutral-100",
    "px-2 py-1 text-sm",
  ],
  {
    variants: {
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      fullWidth: false,
    },
  }
);

type TextAreaProps = Omit<AriaTextAreaProps, "className"> &
  VariantProps<typeof textArea> & { ref?: React.Ref<HTMLTextAreaElement> };

export const TextArea: React.FC<TextAreaProps> = ({
  fullWidth,
  ref,
  ...props
}) => {
  return (
    <AriaTextArea {...props} ref={ref} className={textArea({ fullWidth })} />
  );
};

TextArea.displayName = "TextArea";
