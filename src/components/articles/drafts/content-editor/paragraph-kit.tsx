import { cva } from "class-variance-authority";
import { ParagraphPlugin } from "platejs/react";
import { BASE_RULES } from "./editor-utils";

const plateParagraph = cva("relative text-sm text-zinc-700 font-serif");

export const ParagraphKit = [
  ParagraphPlugin.configure({
    node: {
      props: {
        className: plateParagraph(),
      },
    },
  }),
];
