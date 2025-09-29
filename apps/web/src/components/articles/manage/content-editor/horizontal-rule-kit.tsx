import { HorizontalRulePlugin } from "@platejs/basic-nodes/react";
import { PlateElement, PlateElementProps } from "platejs/react";
import { plateHr } from "./node-styles";

const HRElement: React.FC<PlateElementProps> = (props) => (
  <PlateElement {...props} />
);

export const HorizontalRuleKit = [
  HorizontalRulePlugin.configure({
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
