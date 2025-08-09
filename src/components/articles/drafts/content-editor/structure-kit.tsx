import { TextAlignPlugin } from "@platejs/basic-styles/react";
import { IndentPlugin } from "@platejs/indent/react";
import { ExitBreakPlugin, KEYS, TrailingBlockPlugin } from "platejs";

export const StructureKit = [
  IndentPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.img],
    },
  }),
  TrailingBlockPlugin,
  ExitBreakPlugin.configure({
    shortcuts: {
      insert: { keys: "mod+enter" },
      insertBefore: { keys: "mod+shift+enter" },
    },
  }),
  TextAlignPlugin.configure({
    inject: {
      nodeProps: {
        defaultNodeValue: "start",
        nodeKey: "align",
        styleKey: "textAlign",
        validNodeValues: ["start", "left", "center", "right", "end", "justify"],
      },
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.img],
    },
  }),
];
