import { BaseLinkPlugin, getLinkAttributes } from "@platejs/link";
import { SlateElement, SlateElementProps, TLinkElement } from "platejs";
import { plateLink } from "../node-styles";

const LinkElement = (props: SlateElementProps<TLinkElement>) => {
  return (
    <SlateElement
      {...props}
      as="a"
      className={plateLink()}
      attributes={{
        ...props.attributes,
        ...getLinkAttributes(props.editor, props.element),
        onMouseOver: (e) => {
          e.stopPropagation();
        },
      }}
    >
      {props.children}
    </SlateElement>
  );
};

export const StaticLinkKit = [
  BaseLinkPlugin.configure({
    render: {
      node: LinkElement,
    },
  }),
];
