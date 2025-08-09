import {
  PlaceholderPlugin,
  ImagePlugin as PlateImagePlugin,
} from "@platejs/media/react";

import * as React from "react";

import type { TElement, TImageElement, TText } from "platejs";
import type { PlateElementProps } from "platejs/react";

import { Image, useMediaState } from "@platejs/media/react";
import { PlateElement, useEditorPlugin, withHOC } from "platejs/react";
import { cn } from "~/lib/cn";

import { PlaceholderProvider, updateUploadHistory } from "@platejs/media/react";
import type { TPlaceholderElement } from "platejs";
import { KEYS, nanoid } from "platejs";
import { createTRPCClient } from "~/lib/trpc/client";
import { DraftStorePlugin } from "./draft-store";
import { useUploadFile } from "./use-upload-file";

const isImageNode = (
  node: TElement | TText,
  imgType: string
): node is TImageElement => node && "type" in node && node.type === imgType;

type TCustomImage = {
  mediaId: string;
  ufsId: string;
} & TImageElement;

const ImagePlugin = PlateImagePlugin.extend<{
  ufsKey: string;
}>({}).overrideEditor(
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
          trpcClient.article.draft.deleteContentImage.mutate({
            mediaId: node.mediaId,
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

const CONTENT: Record<
  string,
  {
    accept: string[];
    content: React.ReactNode;
    // icon: React.ReactNode;
  }
> = {
  [KEYS.img]: {
    accept: ["image/*"],
    content: "Add an image",
    // icon: <ImageIcon />,
  },
};

export const PlaceholderElement = withHOC(
  PlaceholderProvider,
  function PlaceholderElement(props: PlateElementProps<TPlaceholderElement>) {
    const { editor, element } = props;
    const { api } = useEditorPlugin(PlaceholderPlugin);

    const { isUploading, progress, uploadedFile, uploadFile, uploadingFile } =
      useUploadFile();

    const loading = isUploading && uploadingFile;
    const currentContent = CONTENT[element.mediaType];
    const isImage = element.mediaType === KEYS.img;
    const imageRef = React.useRef<HTMLImageElement>(null);

    // const { openFilePicker } = useFilePicker({
    //   accept: currentContent.accept,
    //   multiple: true,
    //   onFilesSelected: ({ plainFiles: updatedFiles }) => {
    //     const firstFile = updatedFiles[0];
    //     const restFiles = updatedFiles.slice(1);
    //     replaceCurrentPlaceholder(firstFile);
    //     if (restFiles.length > 0) {
    //       editor.getTransforms(PlaceholderPlugin).insert.media(restFiles);
    //     }
    //   },
    // });

    const replaceCurrentPlaceholder = React.useCallback(
      (file: File) => {
        void uploadFile(file);
        api.placeholder.addUploadingFile(element.id as string, file);
      },
      [api.placeholder, element.id, uploadFile]
    );

    React.useEffect(() => {
      if (!uploadedFile) return;
      const path = editor.api.findPath(element);

      editor.tf.withoutSaving(() => {
        editor.tf.removeNodes({ at: path });

        const node = {
          children: [{ text: "" }],
          initialHeight: imageRef.current?.height,
          initialWidth: imageRef.current?.width,
          isUpload: true,
          name: element.mediaType === KEYS.file ? uploadedFile.name : "",
          placeholderId: element.id as string,
          type: element.mediaType!,
          url: uploadedFile.ufsUrl,
        };

        editor.tf.insertNodes(node, { at: path });
        updateUploadHistory(editor, node);
      });

      api.placeholder.removeUploadingFile(element.id as string);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadedFile, element.id]);

    // React dev mode will call React.useEffect twice
    const isReplaced = React.useRef(false);

    /** Paste and drop */
    React.useEffect(() => {
      if (isReplaced.current) return;
      isReplaced.current = true;

      const currentFiles = api.placeholder.getUploadingFile(
        element.id as string
      );

      if (!currentFiles) return;
      replaceCurrentPlaceholder(currentFiles);

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReplaced]);

    return (
      <PlateElement className="my-1" {...props}>
        {/* {isImage && loading && (
          <ImageProgress
            file={uploadingFile}
            imageRef={imageRef}
            progress={progress}
          />
        )} */}
        {props.children}
        {JSON.stringify(isUploading)}
      </PlateElement>
    );
  }
);

export const ImageElement = (props: PlateElementProps<TImageElement>) => {
  const { focused, selected } = useMediaState();

  return (
    <PlateElement {...props} className="py-1">
      <figure className="group relative m-0" contentEditable={false}>
        <Image
          referrerPolicy="no-referrer"
          className={cn(
            "block cursor-pointer object-cover left-0",
            focused && selected && "ring-2 ring-sky-600 ring-offset-0"
          )}
          alt={props.attributes.alt as string | undefined}
        />
      </figure>

      <div>{props.children}</div>
    </PlateElement>
  );
};

export const MediaKit = [
  ImagePlugin.configure({
    render: {
      node: ImageElement,
    },
  }),
  // PlaceholderPlugin.configure({
  //   options: { disableEmptyPlaceholder: true },
  //   render: { node: PlaceholderElement },
  // }),
];
