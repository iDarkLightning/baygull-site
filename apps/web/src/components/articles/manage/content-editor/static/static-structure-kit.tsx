import { BaseTextAlignPlugin } from "@platejs/basic-styles";
import { BaseIndentPlugin } from "@platejs/indent";
import { ExitBreakPlugin, KEYS, TrailingBlockPlugin } from "platejs";

export const StaticStructureKit = [
  BaseIndentPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.img],
    },
  }),
  TrailingBlockPlugin,
  ExitBreakPlugin,
  BaseTextAlignPlugin.configure({
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
