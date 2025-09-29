import { cva } from "class-variance-authority";
import { ParagraphPlugin } from "platejs/react";

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
