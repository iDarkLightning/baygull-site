import { IndentPlugin } from "@platejs/indent/react";
import { LineHeightPlugin, TextAlignPlugin } from "@platejs/basic-styles/react";
import { KEYS, TrailingBlockPlugin } from "platejs";

export const StructureKit = [
  IndentPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.img],
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
