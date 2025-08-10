import {
  FloatingMediaStore,
  ImagePlugin as PlateImagePlugin,
  useFloatingMediaValue,
  useImagePreviewValue,
} from "@platejs/media/react";

import * as React from "react";

import type { TElement, TImageElement, TText } from "platejs";
import type { PlateElementProps } from "platejs/react";

import { Image, useMediaState } from "@platejs/media/react";
import {
  PlateElement,
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocusedLast,
  useReadOnly,
  useRemoveNodeButton,
} from "platejs/react";
import { cn } from "~/lib/cn";

import {
  CaptionPlugin,
  useCaptionTextarea,
  useCaptionTextareaState,
} from "@platejs/caption/react";
import { KEYS, nanoid } from "platejs";
import { createTRPCClient, useTRPC } from "~/lib/trpc/client";
import { DraftStorePlugin } from "./draft-store";

import {
  Caption as CaptionPrimitive,
  CaptionTextarea as CaptionTextareaPrimitive,
  useCaptionButton,
  useCaptionButtonState,
} from "@platejs/caption/react";
import { TextArea } from "react-aria-components";
import { Button } from "~/components/ui/button";
import { TextIcon, TrashIcon } from "~/components/ui/icons";
import { useMutation } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";

export function Caption({
  className,
  ...props
}: React.ComponentProps<typeof CaptionPrimitive>) {
  return <CaptionPrimitive {...props} className="mr-auto" />;
}

export function CaptionTextarea(
  props: React.ComponentProps<typeof CaptionTextareaPrimitive>
) {
  const element = useElement<TCustomImage>();

  const state = useCaptionTextareaState();
  const control = useCaptionTextarea(state);

  const trpc = useTRPC();
  const { mutate } = useMutation(
    trpc.article.draft.updateContentImage.mutationOptions()
  );

  const updateContentImage = useDebouncedCallback(mutate, 300);

  return (
    <TextArea
      {...control.props}
      ref={control.ref}
      onChange={(e) => {
        control.props.onChange?.(e);

        updateContentImage({
          mediaId: element.mediaId,
          caption: e.target.value,
        });
      }}
      className={cn(
        "mt-2 text-xs text-zinc-500 w-full resize-none border-none bg-inherit p-0 font-serif",
        "focus:outline-none focus:[&::placeholder]:opacity-0",
        "print:placeholder:text-transparent",
        props.className
      )}
    />
  );
}

const isImageNode = (
  node: TElement | TText,
  imgType: string
): node is TImageElement => node && "type" in node && node.type === imgType;

type TCustomImage = {
  mediaId: string;
  ufsId: string;
} & TImageElement;

const ImagePlugin = PlateImagePlugin.extend({
  options: {
    imageDataMap: new Map<string, string>(),
  },
}).overrideEditor(
  ({ editor, api, tf: { insertNodes, removeNodes, setNodes } }) => {
    return {
      transforms: {
        removeNodes: (options) => {
          if (!options) return removeNodes(options);

          const nodeEntry = api.node<TCustomImage>({
            at: options.at,
            match: (n) => n.type === editor.getType(KEYS.img),
          });

          if (!nodeEntry) return removeNodes(options);
          const [node] = nodeEntry;

          const trpcClient = createTRPCClient();
          trpcClient.article.draft.updateContentImage.mutate({
            mediaId: node.mediaId,
            markForDeletion: true,
          });

          removeNodes(options);
        },
        insertNodes: (nodes, options) => {
          const normalizedNodes = Array.isArray(nodes) ? nodes : [nodes];

          const taggedNodes = normalizedNodes.map((n) => ({
            ...n,
            children: (n.children as TElement[])?.map((child) =>
              isImageNode(child, editor.getType(KEYS.img))
                ? { ...child, tempId: nanoid() }
                : child
            ),
            ...(isImageNode(n, editor.getType(KEYS.img))
              ? {
                  tempId: nanoid(),
                }
              : {}),
          }));

          insertNodes(taggedNodes, options);

          const draftId = editor.getOption(DraftStorePlugin, "draftId");

          taggedNodes
            .flatMap(
              (node) =>
                [
                  node,
                  ...(Array.isArray(node.children)
                    ? node.children
                    : [node.children]),
                ] as TElement[]
            )
            .filter((node) => isImageNode(node, editor.getType(KEYS.img)))
            .forEach((node) => {
              const trpcClient = createTRPCClient();

              trpcClient.article.draft.uploadExternalContentImage
                .mutate({
                  id: draftId,
                  url: node.url,
                })
                .then((data) => {
                  const matchedNodeEntry = api.node<TCustomImage>({
                    at: [],
                    match: (n) =>
                      n.type === editor.getType(KEYS.img) &&
                      n.tempId === node.tempId,
                  });

                  if (!matchedNodeEntry) return;
                  const [matchedNode] = matchedNodeEntry;

                  delete matchedNode.tempId;

                  setNodes(
                    {
                      ...matchedNode,
                      mediaId: data.id,
                      url: data.url,
                      ufsId: data.ufsId,
                    },
                    {
                      at: api.findPath(matchedNode),
                    }
                  );
                });
            });
        },
      },
    };
  }
);

export const ImageElement = (props: PlateElementProps<TImageElement>) => {
  const { focused, selected } = useMediaState();

  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const isFocusedLast = useFocusedLast();

  const selectionCollapsed = useEditorSelector(
    (editor) => !editor.api.isExpanded(),
    []
  );

  const isImagePreviewOpen = useImagePreviewValue("isOpen", editor.id);

  const isOpen =
    isFocusedLast &&
    !readOnly &&
    selected &&
    selectionCollapsed &&
    !isImagePreviewOpen;

  const isEditing = useFloatingMediaValue("isEditing");

  React.useEffect(() => {
    if (!isOpen && isEditing) {
      FloatingMediaStore.set("isEditing", false);
    }
  }, [isOpen]);

  const element = useElement<TCustomImage>();

  const captionBtnState = useCaptionButtonState();

  const captionBtnProps = useCaptionButton(captionBtnState);
  const removeBtnProps = useRemoveNodeButton({ element });

  return (
    <PlateElement {...props} className="py-1">
      <figure className="group relative m-0 mx-auto" contentEditable={false}>
        <div className="relative w-fit">
          <Image
            referrerPolicy="no-referrer"
            className={cn(
              "block  object-cover left-0 rounded-md",
              focused && selected && "ring-2 ring-sky-800 ring-offset-0"
            )}
            alt={props.attributes.alt as string | undefined}
          />
          <div
            className={cn(
              "absolute right-0 top-0 h-fit w-fit m-4 p-0.5 bg-zinc-50/70 border-[0.0125rem] border-zinc-300 rounded-md backdrop-blur-lg hidden group-hover:flex items-center gap-0.5 animate-in fade-in-0 duration-200 ease-in-out",
              isOpen && "flex"
            )}
          >
            <Button
              isCircular={false}
              variant="ghost"
              size="icon"
              onPress={captionBtnProps.props.onClick}
            >
              <TextIcon />
            </Button>
            <Button
              isCircular={false}
              variant="ghost"
              size="icon"
              onPress={() => {
                const nodeEntry = editor.api.node(element);
                if (!nodeEntry) return;

                const [_, nodePath] = nodeEntry;
                removeBtnProps.props.onClick();

                editor.tf.focus({
                  at: nodePath,
                });
              }}
            >
              <TrashIcon />
            </Button>
          </div>
        </div>

        <div className="col-span-full">
          <Caption>
            <CaptionTextarea
              readOnly={readOnly}
              onFocus={(e) => {
                e.preventDefault();
              }}
            />
          </Caption>
        </div>
      </figure>

      <div>{props.children}</div>
    </PlateElement>
  );
};

export const MediaKit = [
  ImagePlugin.configure({
    rules: {
      break: {
        default: "exit",
      },
    },
    render: {
      node: ImageElement,
    },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img],
      },
    },
  }),
];
