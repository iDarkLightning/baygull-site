import { BaseH1Plugin, BaseH2Plugin, BaseH3Plugin } from "@platejs/basic-nodes";
import { VariantProps } from "class-variance-authority";
import { SlateElement, SlateElementProps } from "platejs";
import React from "react";
import { plateHeading } from "../node-styles";

const HeadingElement: React.FC<
  SlateElementProps & VariantProps<typeof plateHeading>
> = ({ variant, ...props }) => {
  return <SlateElement className={plateHeading({ variant })} {...props} />;
};

const H1Element: React.FC<SlateElementProps> = (props) => (
  <HeadingElement variant="h1" {...props} />
);

const H2Element: React.FC<SlateElementProps> = (props) => (
  <HeadingElement variant="h2" {...props} />
);

const H3Element: React.FC<SlateElementProps> = (props) => (
  <HeadingElement variant="h3" {...props} />
);

export const StaticHeadingKit = [
  BaseH1Plugin.withComponent(H1Element),
  BaseH2Plugin.withComponent(H2Element),
  BaseH3Plugin.withComponent(H3Element),
];
