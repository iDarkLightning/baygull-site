import { TArticleContent, TArticlesList } from "@baygull/api/trpc/types";
import { createStaticEditor, PlateStatic } from "platejs";
import React from "react";
import { StaticHeadingKit } from "./manage/content-editor/static/static-heading-kit";
import { StaticHorizontalRuleKit } from "./manage/content-editor/static/static-horizontal-rule-kit";
import { StaticLinkKit } from "./manage/content-editor/static/static-link-kit";
import { StaticMarksKit } from "./manage/content-editor/static/static-marks-kit";
import { StaticMediaKit } from "./manage/content-editor/static/static-media-kit";
import { StaticParagraphKit } from "./manage/content-editor/static/static-paragraph-kit";
import { StaticStructureKit } from "./manage/content-editor/static/static-structure-kit";

type DefaultArticleRendererProps = {
  content: TArticleContent;
};

export const DefaultArticleRenderer: React.FC<DefaultArticleRendererProps> = (
  props
) => {
  if (props.content.type === "html") {
    return (
      <div
        className="flex flex-col gap-4 text-lg leading-relaxed text-[#363636] pb-8 break-words ![&>img]:w-full parent"
        dangerouslySetInnerHTML={{
          __html: props.content.content as string,
        }}
      />
    );
  }

  const editor = createStaticEditor({
    plugins: [
      ...StaticHeadingKit,
      ...StaticHorizontalRuleKit,
      ...StaticLinkKit,
      ...StaticMarksKit,
      ...StaticMediaKit,
      ...StaticParagraphKit,
      ...StaticStructureKit,
    ],
    value: JSON.parse(props.content.content as string),
  });

  return (
    <PlateStatic
      className="flex flex-col gap-4 text-lg leading-relaxed text-[#363636] pb-8 break-words ![&>img]:w-full parent"
      editor={editor}
    />
  );
};
