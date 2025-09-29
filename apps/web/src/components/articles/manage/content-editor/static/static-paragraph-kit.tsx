import { BaseParagraphPlugin } from "platejs";
import { plateParagraph } from "../node-styles";

export const StaticParagraphKit = [
  BaseParagraphPlugin.configure({
    node: {
      props: {
        className: plateParagraph(),
      },
    },
  }),
];
