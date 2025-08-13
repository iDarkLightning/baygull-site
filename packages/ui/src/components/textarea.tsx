import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import {
  TextArea as AriaTextArea,
  type TextAreaProps as AriaTextAreaProps,
} from "react-aria-components";
import { inputBase } from "./input";
import { cn } from "../cn";

const textArea = cva(cn(inputBase(), "h-auto px-2 py-1"), {
  variants: {
    fullWidth: {
      true: "w-full",
      false: "w-auto",
    },
    invalid: {
      true: "!border-red-700 focus-visible:ring-red-700",
      false: "focus-visible:ring-sky-800",
    },
  },
  defaultVariants: {
    fullWidth: false,
  },
});

type TextAreaProps = Omit<AriaTextAreaProps, "className"> &
  Omit<VariantProps<typeof textArea>, "invalid"> & {
    ref?: React.Ref<HTMLTextAreaElement>;
  };

export const TextArea: React.FC<TextAreaProps> = ({
  fullWidth,
  ref,
  ...props
}) => {
  return (
    <AriaTextArea
      {...props}
      ref={ref}
      className={({ isInvalid }) => textArea({ invalid: isInvalid, fullWidth })}
    />
  );
};

TextArea.displayName = "TextArea";
