import {
  BaseBoldPlugin,
  BaseCodePlugin,
  BaseItalicPlugin,
  BaseStrikethroughPlugin,
  BaseSubscriptPlugin,
  BaseSuperscriptPlugin,
  BaseUnderlinePlugin,
} from "@platejs/basic-nodes";

export const StaticMarksKit = [
  BaseBoldPlugin.configure({
    node: {
      props: {
        className: "font-semibold",
      },
    },
  }),
  BaseItalicPlugin,
  BaseUnderlinePlugin,
  BaseStrikethroughPlugin,
  BaseCodePlugin,
  BaseSuperscriptPlugin,
  BaseSubscriptPlugin,
];
