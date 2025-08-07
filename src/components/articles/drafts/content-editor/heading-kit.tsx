import { H1Plugin, H2Plugin, H3Plugin } from "@platejs/basic-nodes/react";
import { cva, VariantProps } from "class-variance-authority";
import { BreakRules } from "platejs";
import { Key, PlateElement, PlateElementProps } from "platejs/react";
import React from "react";
import { BASE_RULES } from "./editor-utils";

const BASE_SHORTCUT_KEYS = [Key.Mod, Key.Alt];

const plateHeading = cva("relative text-zinc-800", {
  variants: {
    variant: {
      h1: "font-semibold text-2xl my-1",
      h2: "font-medium text-xl my-0.5",
      h3: "font-medium text-lg my-0.5",
    },
  },
});

const HeadingElement: React.FC<
  PlateElementProps & VariantProps<typeof plateHeading>
> = ({ variant, ...props }) => {
  return <PlateElement className={plateHeading({ variant })} {...props} />;
};

const H1Element: React.FC<PlateElementProps> = (props) => (
  <HeadingElement variant="h1" {...props} />
);

const H2Element: React.FC<PlateElementProps> = (props) => (
  <HeadingElement variant="h2" {...props} />
);

const H3Element: React.FC<PlateElementProps> = (props) => (
  <HeadingElement variant="h3" {...props} />
);

export const HeadingKit = [
  H1Plugin.configure({
    node: {
      component: H1Element,
    },
    rules: BASE_RULES,
    shortcuts: {
      toggle: {
        keys: [[...BASE_SHORTCUT_KEYS, "1"]],
      },
    },
  }),
  H2Plugin.configure({
    node: {
      component: H2Element,
    },
    rules: BASE_RULES,
    shortcuts: {
      toggle: {
        keys: [[...BASE_SHORTCUT_KEYS, "2"]],
      },
    },
  }),
  H3Plugin.configure({
    node: {
      component: H3Element,
    },
    rules: BASE_RULES,
    shortcuts: {
      toggle: {
        keys: [[...BASE_SHORTCUT_KEYS, "3"]],
      },
    },
  }),
];
