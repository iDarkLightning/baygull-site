import { BaseHorizontalRulePlugin } from "@platejs/basic-nodes";
import { SlateElement, SlateElementProps } from "platejs";
import { plateHr } from "../node-styles";

const HRElement: React.FC<SlateElementProps> = (props) => (
  <SlateElement {...props} />
);

export const StaticHorizontalRuleKit = [
  BaseHorizontalRulePlugin.configure({
    node: {
      props: {
        className: plateHr(),
      },
    },
    render: {
      node: HRElement,
    },
  }),
];
