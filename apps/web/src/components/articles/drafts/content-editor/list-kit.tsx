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
    <List
      className="relative"
      style={{ listStyleType: listStyleType || "disc" }}
      start={listStart}
    >
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
    parsers: {
      html: {
        deserializer: {
          parse: ({ editor, element, getOptions }) => {
            const resolveIndent = () => {
              // copy pasting from google docs uses aria-level
              const ariaLevel = element.getAttribute("aria-level");
              if (ariaLevel) return Number(ariaLevel);

              const classList = element.parentElement?.classList;
              if (!classList) return 0;

              return Number(classList[0]?.charAt(classList[0].length - 1)) + 1;
            };

            const resolveListStyleType = () => {
              const listStyleType = getOptions().getListStyleType?.(element);
              if (listStyleType) return listStyleType;

              if (element.parentElement?.tagName === "OL") {
                const styleTypes = ["decimal", "lower-alpha", "lower-roman"];
                const indent = resolveIndent();

                return styleTypes[(indent - 1) % 3];
              } else {
                const styleTypes = ["disc", "circle", "square"];
                const indent = resolveIndent();

                return styleTypes[(indent - 1) % 3];
              }
            };

            return {
              indent: resolveIndent(),
              listStyleType: resolveListStyleType(),
              type: editor.getType(KEYS.p),
            };
          },
        },
      },
    },
    render: {
      belowNodes: BlockList,
    },
  }),
];
