import { cva } from "class-variance-authority";

export const plateParagraph = cva("relative text-sm text-zinc-700 font-serif");

export const plateLink = cva(
  "font-medium underline text-sky-800 decoration-primary underline-offset-4"
);

export const plateHr = cva("border-[0.0125rem] border-zinc-300/70");

export const plateHeading = cva("relative text-zinc-800 font-serif", {
  variants: {
    variant: {
      h1: "font-semibold text-2xl my-1",
      h2: "font-medium text-xl my-0.5",
      h3: "font-medium text-lg my-0.5",
    },
  },
});
