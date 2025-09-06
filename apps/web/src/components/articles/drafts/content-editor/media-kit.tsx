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
import { cn } from "@baygull/ui/cn";

import {
  CaptionPlugin,
  useCaptionTextarea,
  useCaptionTextareaState,
} from "@platejs/caption/react";
import { KEYS } from "platejs";
import { createTRPCClient, useTRPC } from "~/lib/trpc-client";
import { DraftStorePlugin } from "./draft-store";

import {
  Caption as CaptionPrimitive,
  CaptionTextarea as CaptionTextareaPrimitive,
  useCaptionButton,
  useCaptionButtonState,
} from "@platejs/caption/react";
import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { TextArea } from "@baygull/ui/aria";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@baygull/ui/button";
import { TextIcon, TrashIcon } from "@baygull/ui/icons";

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
    trpc.article.manage.updateContentImage.mutationOptions()
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
): node is TCustomImage => node && "type" in node && node.type === imgType;

type TCustomImage = {
  mediaId: string;
  ufsId: string;
} & TImageElement;

const ImagePlugin = PlateImagePlugin.extend({
  options: {
    imageDataMap: new Map<string, string>(),
  },
}).overrideEditor(({ editor, tf: { apply, setNodes } }) => {
  return {
    transforms: {
      apply: (op) => {
        if (op.type === "insert_node") {
          apply(op);
          if (!isImageNode(op.node, editor.getType(KEYS.img))) return;

          const { setIsUpdating, draftId } =
            editor.getOptions(DraftStorePlugin);

          const trpcClient = createTRPCClient();

          setIsUpdating(true);
          trpcClient.article.manage.uploadExternalContentImage
            .mutate({
              id: draftId,
              url: op.node.url,
            })
            .then((data) => {
              setNodes(
                {
                  ...op.node,
                  mediaId: data.id,
                  url: data.url,
                  ufsId: data.ufsId,
                },
                {
                  at: op.path,
                }
              );

              setIsUpdating(false);
            });
        } else if (op.type === "remove_node") {
          if (!isImageNode(op.node, editor.getType(KEYS.img))) return apply(op);

          if (!op.node.mediaId) return;

          apply(op);
          const setIsUpdating = editor.getOption(
            DraftStorePlugin,
            "setIsUpdating"
          );

          setIsUpdating(true);

          const trpcClient = createTRPCClient();
          trpcClient.article.manage.updateContentImage
            .mutate({
              mediaId: op.node.mediaId,
              markForDeletion: true,
            })
            .then(() => setIsUpdating(false))
            .catch(() => setIsUpdating(false));
        } else {
          apply(op);
        }
      },
    },
  };
});

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

  useEffect(() => {
    if (!isOpen && isEditing) {
      FloatingMediaStore.set("isEditing", false);
    }
  }, [isOpen]);

  const element = useElement<TCustomImage>();

  const captionBtnState = useCaptionButtonState();

  const captionBtnProps = useCaptionButton(captionBtnState);
  const removeBtnProps = useRemoveNodeButton({ element });

  if (!element.mediaId) {
    return (
      <figure className="group relative m-0 mx-auto">
        <Image
          referrerPolicy="no-referrer"
          className={cn("block object-cover left-0 rounded-md opacity-70")}
          alt={props.attributes.alt as string | undefined}
        />
      </figure>
    );
  }

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
