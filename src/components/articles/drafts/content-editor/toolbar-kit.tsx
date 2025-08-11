import {
  createPlatePlugin,
  useEditorPlugin,
  useEditorRef,
  useEditorSelector,
  useMarkToolbarButton,
  useMarkToolbarButtonState,
  useSelectionFragmentProp,
} from "platejs/react";
import type { Alignment } from "@platejs/basic-styles";

import {
  Button as AriaButton,
  FileTrigger,
  Key,
  Menu,
  MenuTrigger,
  ToggleButtonGroup,
} from "react-aria-components";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  BulletedListIcon,
  H1Icon,
  H2Icon,
  H3Icon,
  ImageIcon,
  ItalicIcon,
  NumberedListIcon,
  StrikeThroughIcon,
  UnderlineIcon,
} from "./editor-icons";
import { Button, ToggleButton } from "~/components/ui/button";
import { Tooltip, TooltipTrigger } from "~/components/ui/tooltip";
import {
  FunnelIcon,
  TextIcon,
  StatusIcon,
  PeopleIcon,
  ClockIcon,
  LinkIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "~/components/ui/icons";
import { MenuItem, SubmenuItem } from "~/components/ui/menu";
import { ModalPopover } from "~/components/ui/modal-popover";
import { TextAlignPlugin } from "@platejs/basic-styles/react";
import { useMemo, useState } from "react";
import { ListStyleType, someList, toggleList } from "@platejs/list";
import {
  useLinkToolbarButtonState,
  useLinkToolbarButton,
} from "@platejs/link/react";
import { KEYS, TElement } from "platejs";
import { getBlockType, setBlockType } from "./editor-transforms";
import { insertImageFromFiles } from "@platejs/media";

// import { FixedToolbar } from "@/components/ui/fixed-toolbar";
// import { FixedToolbarButtons } from "@/components/ui/fixed-toolbar-buttons";
// import { FloatingToolbar } from "@/components/ui/floating-toolbar";
// import { FloatingToolbarButtons } from "@/components/ui/floating-toolbar-buttons";

export function MarkToolbarButton({
  clear,
  nodeType,
  tooltip,
  ...props
}: React.ComponentProps<typeof ToggleButton> & {
  nodeType: string;
  tooltip: string;
  clear?: string[] | string;
}) {
  const state = useMarkToolbarButtonState({ clear, nodeType });
  const { props: buttonProps } = useMarkToolbarButton(state);

  return (
    <TooltipTrigger>
      <ToggleButton
        {...props}
        {...buttonProps}
        isSelected={buttonProps.pressed}
      />
      <Tooltip placement="bottom">{tooltip}</Tooltip>
    </TooltipTrigger>
  );
}

const marks = [
  {
    id: "bold-mark",
    nodeType: "bold",
    tooltip: "Bold (Cmd+B)",
    icon: <BoldIcon />,
  },
  {
    id: "italic-mark",
    nodeType: "italic",
    tooltip: "Italic (Cmd+I)",
    icon: <ItalicIcon />,
  },
  {
    id: "underline-mark",
    nodeType: "underline",
    tooltip: "Underline (Cmd+U)",
    icon: <UnderlineIcon />,
  },
  {
    id: "strikethrough-mark",
    nodeType: "strikethrough",
    tooltip: "Strike Through",
    icon: <StrikeThroughIcon />,
  },
];

const MarkButtons = () => {
  return (
    <div className="gap-1 flex items-center">
      {marks.map((mark) => (
        <MarkToolbarButton
          key={mark.id}
          nodeType={mark.nodeType}
          tooltip={mark.tooltip}
        >
          {mark.icon}
        </MarkToolbarButton>
      ))}
    </div>
  );
};

const alignments = [
  {
    id: "left",
    tooltip: "Align Left",
    icon: <AlignLeftIcon />,
  },
  {
    id: "center",
    tooltip: "Align Center",
    icon: <AlignCenterIcon />,
  },
  {
    id: "right",
    tooltip: "Align Right",
    icon: <AlignRightIcon />,
  },
  {
    id: "justify",
    tooltip: "Justify",
    icon: <AlignJustifyIcon />,
  },
];

const AlignMenu = () => {
  const { editor, tf } = useEditorPlugin(TextAlignPlugin);
  const value =
    useSelectionFragmentProp({
      defaultValue: "start",
      getProp: (node) => node.align,
    }) ?? "left";

  const icon = alignments.find((item) => item.id === value)?.icon ?? (
    <AlignLeftIcon />
  );

  const [selectedKeys, setSelectedKeys] = useState<Iterable<Key>>(
    new Set<Key>()
  );

  return (
    <MenuTrigger>
      <Button variant="ghost" size="icon" isCircular={false}>
        {icon}
      </Button>
      <ModalPopover
        popoverProps={{
          placement: "bottom",
        }}
      >
        <Menu
          className="focus:outline-none"
          selectionMode="single"
          selectedKeys={selectedKeys}
          onSelectionChange={(value) => {
            if (typeof value === "string") return;
            const [entry] = [...value];

            tf.textAlign.setNodes(entry as Alignment);
            editor.tf.focus();

            setSelectedKeys(value);
          }}
        >
          {alignments.map((alignment) => (
            <MenuItem key={`${alignment.id}-align`}>
              <TooltipTrigger>
                <AriaButton id={alignment.id}>
                  <div className="">{alignment.icon}</div>
                </AriaButton>
                <Tooltip placement="right">{alignment.tooltip}</Tooltip>
              </TooltipTrigger>
            </MenuItem>
          ))}
        </Menu>
      </ModalPopover>
    </MenuTrigger>
  );
};

const ListButtons = () => {
  const editor = useEditorRef();

  const ulSelected = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Disc,
        ListStyleType.Circle,
        ListStyleType.Square,
      ]),
    []
  );

  const olSelected = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Decimal,
        ListStyleType.LowerAlpha,
        ListStyleType.LowerRoman,
      ]),
    []
  );

  return (
    <div className="gap-1 flex items-center">
      <ToggleButton
        isSelected={ulSelected}
        onPress={() => {
          toggleList(editor, {
            listStyleType: ListStyleType.Disc,
          });

          editor.tf.focus();
        }}
      >
        <BulletedListIcon />
      </ToggleButton>
      <ToggleButton
        isSelected={olSelected}
        onPress={() => {
          toggleList(editor, {
            listStyleType: ListStyleType.Decimal,
          });

          editor.tf.focus();
        }}
      >
        <NumberedListIcon />
      </ToggleButton>
    </div>
  );
};

export function LinkToolbarButton() {
  const state = useLinkToolbarButtonState();
  const { props: buttonProps } = useLinkToolbarButton(state);

  return (
    <TooltipTrigger>
      <ToggleButton
        {...buttonProps}
        isSelected={buttonProps.pressed}
        data-plate-focus
      >
        <LinkIcon />
      </ToggleButton>
      <Tooltip placement="bottom">Link (Cmd+K)</Tooltip>
    </TooltipTrigger>
  );
}

const textTypes = [
  {
    icon: <TextIcon />,
    keywords: ["paragraph", "normal text"],
    label: "Normal Text",
    id: KEYS.p,
  },
  {
    icon: <H1Icon />,
    keywords: ["title", "h1", "heading 1"],
    label: "Heading 1",
    id: "h1",
  },
  {
    icon: <H2Icon />,
    keywords: ["subtitle", "h2", "heading 2"],
    label: "Heading 2",
    id: "h2",
  },
  {
    icon: <H3Icon />,
    keywords: ["subtitle", "h3", "heading 3"],
    label: "Heading 3",
    id: "h3",
  },
];

const TextTypeMenu = () => {
  const editor = useEditorRef();

  const [selectedKeys, setSelectedKeys] = useState<Iterable<Key>>(
    new Set<Key>()
  );

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  });

  const selectedItem = useMemo(
    () =>
      textTypes.find((item) => item.id === (value ?? KEYS.p)) ?? textTypes[0],
    [value]
  );

  return (
    <MenuTrigger>
      <Button
        variant="ghost"
        leadingVisual={selectedItem.icon}
        trailingVisual={
          <div className="ml-2">
            <ChevronDownIcon />
          </div>
        }
        isCircular={false}
      >
        {selectedItem.label}
      </Button>
      <ModalPopover
        popoverProps={{
          placement: "bottom",
        }}
      >
        <Menu
          className="focus:outline-none min-w-42"
          selectionMode="single"
          selectedKeys={selectedKeys}
          onSelectionChange={(value) => {
            if (typeof value === "string") return;
            const [entry] = [...value];

            setBlockType(editor, entry as string);

            editor.tf.focus();

            setSelectedKeys(value);
          }}
        >
          {textTypes.map((type) => (
            <MenuItem
              textValue={type.keywords.join(" ")}
              id={type.id}
              key={type.id}
            >
              <div className="flex items-center gap-2 my-1 justify-between">
                <div className="flex items-center gap-2">
                  {type.icon}
                  <p className="text-xs">{type.label}</p>
                </div>
                <ChevronRightIcon />
              </div>
            </MenuItem>
          ))}
        </Menu>
      </ModalPopover>
    </MenuTrigger>
  );
};

const ImageUploadButton = () => {
  const editor = useEditorRef();

  return (
    <FileTrigger
      allowsMultiple
      onSelect={(e) => {
        if (e === null) return;

        insertImageFromFiles(editor, e);
        editor.tf.focus();
      }}
    >
      <TooltipTrigger>
        <Button size="icon" variant="ghost" isCircular={false}>
          <ImageIcon />
        </Button>
        <Tooltip placement="bottom">Image</Tooltip>
      </TooltipTrigger>
    </FileTrigger>
  );
};

const FixedToolbar = () => {
  return (
    <div className="sticky top-4 bg-white/80 backdrop-blur-3xl z-10 flex gap-1 w-full xl:w-3/4 mx-auto border-[0.0125rem] border-zinc-300/70 rounded-md shadow-xs py-1.5 px-2">
      <TextTypeMenu />
      <MarkButtons />
      <AlignMenu />
      <ListButtons />
      <LinkToolbarButton />
      <ImageUploadButton />
    </div>
  );
};

const FixedToolbarPlugin = createPlatePlugin({
  key: "fixed-toolbar",
  render: {
    beforeEditable: () => <FixedToolbar />,
  },
});

export const ToolbarKit = [FixedToolbarPlugin];
