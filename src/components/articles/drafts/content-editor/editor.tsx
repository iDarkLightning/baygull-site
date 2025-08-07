import { DocxPlugin } from "@platejs/docx";
import { JuicePlugin } from "@platejs/juice";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { HeadingKit } from "./heading-kit";
import { MarksKit } from "./marks-kit";
import { ParagraphKit } from "./paragraph-kit";
import { StructureKit } from "./structure-kit";
import { ListKit } from "./list-kit";
import { LinkKit } from "./link-kit";
import { HorizontalRuleKit } from "./horizontal-rule-kit";
import { AutoFormatKit } from "./autoformat-kit";

/**
 *
 * Configure heading plugins with components
 * blockquote plugin
 *
 */

export default function DraftContentEditor() {
  const editor = usePlateEditor({
    plugins: [
      DocxPlugin,
      JuicePlugin,
      ...HeadingKit,
      ...ParagraphKit,
      ...MarksKit,
      ...StructureKit,
      ...ListKit,
      ...LinkKit,
      ...HorizontalRuleKit,
      ...AutoFormatKit,
    ],
    value: [
      { type: "h1", children: [{ text: "Test H1" }] },
      { type: "h2", children: [{ text: "Test H2" }] },
      { type: "h3", children: [{ text: "Test H3" }] },
      { type: "p", children: [{ text: "Test Paragraph" }] },
    ],
  });

  return (
    <Plate editor={editor}>
      <PlateContent
        className="focus-visible:outline-none h-full"
        placeholder="Type your amazing content here..."
      />
    </Plate>
  );
}
