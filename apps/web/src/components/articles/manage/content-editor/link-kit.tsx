import {
  getLinkAttributes,
  unwrapLink,
  upsertLink,
  validateUrl,
} from "@platejs/link";
import {
  LinkPlugin,
  triggerFloatingLinkEdit,
  triggerFloatingLinkInsert,
  useFloatingLinkEscape,
} from "@platejs/link/react";
import { KEYS, TLinkElement } from "platejs";
import {
  PlateElement,
  PlateElementProps,
  useEditorPlugin,
  useEditorVersion,
  useFocused,
  useHotkeys,
  useOnClickOutside,
  usePluginOption,
  usePluginOptions,
} from "platejs/react";
import React, {
  ComponentProps,
  ComponentRef,
  useEffect,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import { Button } from "@baygull/ui/button";
import {
  ExternalLinkIcon,
  LinkIcon,
  LinkSlashIcon,
  PencilSquareIcon,
  TextIcon,
} from "@baygull/ui/icons";
import { Input } from "@baygull/ui/input";
import { Popover } from "@baygull/ui/popover";
import { useAppForm } from "~/lib/form";

const getCursorPixelOffsetWithin = (
  element: HTMLElement | null | undefined
) => {
  if (!element) return { x: 0, y: 0 };

  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return { x: 0, y: 0 };

  const range = selection.getRangeAt(0).cloneRange();
  const rect = range.getClientRects()[0];
  const containerRect = element.getBoundingClientRect();

  if (!rect) return { x: 0, y: 0 };

  return {
    x: rect.left - containerRect.left,
    y: rect.top - containerRect.top,
  };
};

export function LinkElement(props: PlateElementProps<TLinkElement>) {
  return (
    <PlateElement
      {...props}
      as="a"
      className="font-medium underline text-sky-800 decoration-primary underline-offset-4"
      attributes={{
        ...props.attributes,
        ...getLinkAttributes(props.editor, props.element),
        onMouseOver: (e) => {
          e.stopPropagation();
        },
      }}
    >
      {props.children}
    </PlateElement>
  );
}

const EditLinkInput = () => {
  const { getOptions, setOption, editor } = useEditorPlugin(LinkPlugin);

  const form = useAppForm({
    defaultValues: {
      url: getOptions().url,
    },
    onSubmit: ({ value }) => {
      const { forceSubmit, newTab, text, transformInput } = getOptions();

      const url = transformInput ? transformInput(value.url) ?? "" : value.url;
      if (!forceSubmit && !validateUrl(editor, url)) return;

      const target = newTab ? "_blank" : undefined;

      upsertLink(editor, {
        skipValidation: true,
        target,
        text,
        url,
      });

      setOption("url", value.url);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField
        name="url"
        children={(field) => (
          <field.TextField
            inputProps={{
              leadingVisual: <PencilSquareIcon />,
            }}
            autoFocus
            aria-label="Edit Link"
            isTextArea={false}
          />
        )}
      />
    </form>
  );
};

const InsertPopover: React.FC = () => {
  const { getOptions, setOption, editor, api } = useEditorPlugin(LinkPlugin);

  const form = useAppForm({
    defaultValues: {
      name: getOptions().text,
      url: getOptions().isUrl?.(getOptions().text) ? getOptions().text : "",
    },
    onSubmit: ({ value }) => {
      const { forceSubmit, newTab, transformInput } = getOptions();

      const url = transformInput ? transformInput(value.url) ?? "" : value.url;
      if (!forceSubmit && !validateUrl(editor, url)) return;

      const target = newTab ? "_blank" : undefined;

      upsertLink(editor, {
        skipValidation: true,
        target,
        text: value.name,
        url,
      });

      setOption("url", value.url);

      api.floatingLink.hide();
      editor.tf.focus({ at: editor.selection! });
    },
  });

  const ref = useRef<ComponentRef<typeof Input>>(null);

  useEffect(() => {
    if (!ref.current) return;
    setTimeout(() => ref.current?.focus());
  }, [ref]);

  return (
    <div className="min-w-3xs p-4">
      <p className="mb-2 text-sm font-semibold">Add a Link</p>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.AppField
          name="url"
          validators={{
            onSubmit: z.string().url({ message: "Please enter a valid URL!" }),
          }}
          children={(field) => (
            <field.TextField
              onKeyDown={(e) => {
                if (e.key.toLowerCase() === "escape") {
                  api.floatingLink.hide();
                  editor.tf.focus({ at: editor.selection! });
                }
              }}
              label="Link"
              inputProps={{
                placeholder: "Paste a Link...",
                leadingVisual: <LinkIcon />,
                ref,
              }}
              aria-label="Edit Link"
              isTextArea={false}
            />
          )}
        />
        <form.AppField
          name="name"
          children={(field) => (
            <field.TextField
              onKeyDown={(e) => {
                if (e.key.toLowerCase() === "escape") {
                  api.floatingLink.hide();
                  editor.tf.focus({ at: editor.selection! });
                }
              }}
              label="Text"
              aria-label="Edit Link"
              inputProps={{
                leadingVisual: <TextIcon />,
              }}
              isTextArea={false}
            />
          )}
        />
        <div className="self-end text-sky-600">
          <Button type="submit" variant="ghost" fullWidth>
            Apply
          </Button>
        </div>
      </form>
    </div>
  );
};

const EditingPopover: React.FC<ComponentProps<"div">> = (props) => {
  const { editor } = useEditorPlugin(LinkPlugin);
  const isEditing = usePluginOptions(LinkPlugin, (s) => s.isEditing);

  return (
    <div className="flex items-center gap-1 py-1 px-2">
      {isEditing ? (
        <EditLinkInput />
      ) : (
        <Button
          leadingVisual={<PencilSquareIcon />}
          variant="ghost"
          onPress={() => triggerFloatingLinkEdit(editor)}
          isCircular={false}
        >
          Edit Link
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onPress={() => {
          const entry = editor.api.node<TLinkElement>({
            match: { type: editor.getType(KEYS.link) },
          });
          if (!entry) return;
          window.open(entry[0].url, "_blank");
        }}
        isCircular={false}
      >
        <ExternalLinkIcon />
      </Button>
      <Button
        variant="danger"
        onPress={() => unwrapLink(editor)}
        size="icon"
        isCircular={false}
      >
        <LinkSlashIcon />
      </Button>
    </div>
  );
};

const LinkFloatingToolbar = () => {
  const { editor, api, getOptions } = useEditorPlugin(LinkPlugin);
  const version = useEditorVersion();

  useFloatingLinkEscape();

  const { triggerFloatingLinkHotkeys } = getOptions();
  const focused = useFocused();

  useHotkeys(
    triggerFloatingLinkHotkeys!,
    (e) => {
      if (triggerFloatingLinkInsert(editor, { focused })) {
        e.preventDefault();
      }
    },
    {
      enableOnContentEditable: true,
    },
    [focused]
  );

  useEffect(() => {
    if (
      editor.selection &&
      editor.api.some({
        match: { type: editor.getType(KEYS.link) },
      })
    ) {
      api.floatingLink.show("edit", editor.id);
      return;
    }
  }, [editor, version]);

  const isOpen = usePluginOption(LinkPlugin, "isOpen", editor.id);

  const clickOutside = useOnClickOutside(() => {
    api.floatingLink.hide();
  });

  const { mode } = getOptions();

  const node =
    mode === "insert"
      ? api.node({
          at: editor.selection?.focus.path,
          block: true,
        })
      : api.node({
          at: editor.selection?.focus.path,
          match: { type: editor.getType(KEYS.link) },
        });

  const triggerDOMNode = node ? api.toDOMNode(node[0]) : null;

  const [cursorPixelOffset, setCursorPixelOffset] = useState(() =>
    getCursorPixelOffsetWithin(triggerDOMNode)
  );

  useEffect(() => {
    setCursorPixelOffset(getCursorPixelOffsetWithin(triggerDOMNode));
  }, [triggerDOMNode]);

  useEffect(() => {
    if (!triggerDOMNode) {
      api.floatingLink.hide();
    }
  }, [triggerDOMNode]);

  return (
    <Popover
      placement="top left"
      offset={-cursorPixelOffset.y}
      crossOffset={cursorPixelOffset.x - 64}
      isOpen={isOpen}
      ref={clickOutside}
      isNonModal
      triggerRef={{ current: triggerDOMNode! }}
    >
      {mode === "edit" && <EditingPopover />}
      {mode === "insert" && <InsertPopover />}
    </Popover>
  );
};

export const LinkKit = [
  LinkPlugin.configure({
    rules: {
      break: {
        default: "exit",
      },
    },

    render: {
      node: LinkElement,
      afterEditable: () => {
        return <LinkFloatingToolbar />;
      },
    },
  }),
];
