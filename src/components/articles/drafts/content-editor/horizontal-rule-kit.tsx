import { HorizontalRulePlugin } from "@platejs/basic-nodes/react";
import { PlateElement, PlateElementProps } from "platejs/react";

const HRElement: React.FC<PlateElementProps> = (props) => (
  <PlateElement {...props} />
);

export const HorizontalRuleKit = [
  HorizontalRulePlugin.configure({
    node: {
      props: {
        className: "border-[0.0125rem] border-zinc-300/70",
      },
    },
    render: {
      node: HRElement,
    },
  }),
];
