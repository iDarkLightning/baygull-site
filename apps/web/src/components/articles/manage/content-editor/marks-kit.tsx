import {
  BoldPlugin,
  CodePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react";
import { Key } from "platejs/react";

const BASE_SHORTCUT_KEYS = [Key.Mod];

export const MarksKit = [
  BoldPlugin.configure({
    node: {
      props: {
        className: "font-semibold",
      },
    },
  }),
  ItalicPlugin,
  UnderlinePlugin,
  StrikethroughPlugin,
  CodePlugin,
  SuperscriptPlugin.configure({
    shortcuts: {
      toggle: {
        keys: [[...BASE_SHORTCUT_KEYS, "period"]],
      },
    },
  }),
  SubscriptPlugin.configure({
    shortcuts: {
      toggle: {
        keys: [[...BASE_SHORTCUT_KEYS, "comma"]],
      },
    },
  }),
];
