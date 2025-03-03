// import ReactMde from "react-mde";
// import ReactMarkdown from "react-markdown";
// import { useState } from "react";
// import "react-mde/lib/styles/css/react-mde-all.css";

// export const MarkdownEditorA = () => {
//   const [value, setValue] = useState("**Hello world!!!**");
//   const [selectedTab, setSelectedTab] = useState<
//     "write" | "preview" | undefined
//   >("write");

//   return (
//     <ReactMde
//       value={value}
//       onChange={setValue}
//       selectedTab={selectedTab}
//       onTabChange={setSelectedTab}
//       generateMarkdownPreview={(markdown) =>
//         Promise.resolve(<ReactMarkdown>{markdown}</ReactMarkdown>)
//       }
//       childProps={{
//         writeButton: {
//           tabIndex: -1,
//         },
//       }}
//     />
//   );
// };

import "remirror/styles/all.css";

import {
  BlockquoteExtension,
  BoldExtension,
  BulletListExtension,
  CodeBlockExtension,
  CodeExtension,
  HardBreakExtension,
  HeadingExtension,
  ImageExtension,
  ItalicExtension,
  LinkExtension,
  ListItemExtension,
  MarkdownExtension,
  OrderedListExtension,
  StrikeExtension,
  TableExtension,
  TrailingNodeExtension,
  WhitespaceExtension,
} from "remirror/extensions";
import {
  Remirror,
  useExtensionEvent,
  useHelpers,
  useRemirror,
} from "@remirror/react";
import { DocChangedExtension, ExtensionPriority } from "remirror";
import { CSSProperties, useEffect } from "react";

const extensions = () => [
  new LinkExtension({ autoLink: true }),
  new BoldExtension({}),
  new StrikeExtension(),
  new ItalicExtension(),
  new HeadingExtension({}),
  new BlockquoteExtension(),
  new BulletListExtension({ enableSpine: true }),
  new OrderedListExtension(),
  new ListItemExtension({
    priority: ExtensionPriority.High,
    enableCollapsible: true,
  }),
  new CodeExtension(),
  new TrailingNodeExtension({}),
  new TableExtension({}),
  new ImageExtension({
    extraAttributes: {
      referrerPolicy: "no-referrer",
    },
  }),
  new DocChangedExtension({}),
  // new WhitespaceExtension({}),
  new MarkdownExtension({ copyAsMarkdown: true }),
  /**
   * `HardBreakExtension` allows us to create a newline inside paragraphs.
   * e.g. in a list item
   */
  new HardBreakExtension(),
];

type TUpdateHandler =
  | ((text: string) => Promise<void>)
  | ((text: string) => void);

const OnChangeMd: React.FC<{
  handleUpdate: TUpdateHandler;
}> = ({ handleUpdate }) => {
  const { getHTML } = useHelpers();

  useEffect(() => {
    handleUpdate(getHTML());
  }, []);

  useExtensionEvent(DocChangedExtension, "docChanged", () =>
    handleUpdate(getHTML())
  );

  return null;
};

export const RemirrorEditor: React.FC<{
  value: string;
  setValue: TUpdateHandler;
}> = (props) => {
  const { manager, state } = useRemirror({
    extensions,
    content: props.value,
    selection: "start",
    stringHandler: "html",
  });

  return (
    <div
      className="remirror-theme"
      style={
        {
          "--rmr-color-border": "var(--color-neutral-300)",
          "--rmr-color-outline": "var(--color-neutral-400)",
        } as CSSProperties
      }
    >
      {/* the className is used to define css variables necessary for the editor */}
      <Remirror manager={manager} initialContent={state} autoRender>
        <OnChangeMd handleUpdate={props.setValue} />
      </Remirror>
    </div>
  );
};
