import { BaseListPlugin, isOrderedList } from "@platejs/list";
import {
  KEYS,
  RenderStaticNodeWrapper,
  SlateRenderElementProps,
  TListElement,
} from "platejs";

const List: React.FC<SlateRenderElementProps> = (props) => {
  const { listStart, listStyleType } = props.element as TListElement;
  const List = isOrderedList(props.element) ? "ol" : "ul";

  return (
    <List
      className="relative"
      style={{ listStyleType: listStyleType || "disc" }}
      start={listStart}
    >
      <li>{props.children}</li>
    </List>
  );
};

const BlockList: RenderStaticNodeWrapper = (props) => {
  if (!props.element.listStyleType) return;

  return (props) => <List {...props} />;
};

export const StaticListKit = [
  BaseListPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.img],
    },
    render: {
      belowNodes: BlockList,
    },
  }),
];
