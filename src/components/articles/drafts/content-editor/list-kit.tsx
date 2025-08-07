import { ListPlugin } from "@platejs/list/react";
import { KEYS } from "platejs";

import type { TListElement } from "platejs";

import { isOrderedList } from "@platejs/list";
import { type PlateElementProps, type RenderNodeWrapper } from "platejs/react";
import React from "react";

const List: React.FC<PlateElementProps> = (props: PlateElementProps) => {
  const { listStart, listStyleType } = props.element as TListElement;
  const List = isOrderedList(props.element) ? "ol" : "ul";

  return (
    <List className="relative" style={{ listStyleType }} start={listStart}>
      <li>{props.children}</li>
    </List>
  );
};

const BlockList: RenderNodeWrapper = (props) => {
  if (!props.element.listStyleType) return;

  return (props) => <List {...props} />;
};

export const ListKit = [
  ListPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.img],
    },
    rules: {
      delete: {
        empty: "reset",
      },
      break: {
        empty: "default",
      },
    },
    render: {
      belowNodes: BlockList,
    },
  }),
];
