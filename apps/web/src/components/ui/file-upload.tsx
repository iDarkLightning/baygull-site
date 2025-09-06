import React, { useMemo } from "react";
import { DropZone, FileTrigger, Text } from "@baygull/ui/aria";
import { z } from "zod";
import { cn } from "@baygull/ui/cn";
import { formatBytes } from "~/lib/format-bytes";
import type { ArticleMedia } from "@baygull/db/schema";
import { Button } from "@baygull/ui/button";
import { TrashIcon } from "@baygull/ui/icons";

const mimeTypes = ["image/png", "image/jpeg"];

export type Media =
  | {
      __type: "uploaded-media";
      file: {
        id: string;
        url: string;
        fileName: string;
        size: number;
      };
    }
  | {
      __type: "file";
      file: File;
    };

export const mediaSchema = z.object({
  __type: z.literal("file"),
  file: z.instanceof(File),
});

export type ImageUploadProps = {
  maxSize: number;
  files: Media[];
  setFiles: React.Dispatch<React.SetStateAction<Media[]>>;
  allowMultiple?: boolean;
  isInvalid?: boolean;
};

export const ImageUpload: React.FC<ImageUploadProps> = (props) => {
  // ignore that this basically has no effect atm
  const imageUrls = useMemo(() => {
    return props.files.map((file) => {
      if (file.__type === "uploaded-media") return file.file.url;

      return URL.createObjectURL(file.file);
    });
  }, [props.files]);

  return (
    <>
      {(props.allowMultiple || props.files.length === 0) && (
        <DropZone
          className={({ isDropTarget }) =>
            cn(
              "gap-2 border-[0.0125rem] shadow-xs border-zinc-300/70 rounded-md p-8 flex flex-col items-center justify-center transition-colors",
              props.isInvalid && "border-red-700",
              isDropTarget && "bg-sky-300/40 border-sky-500"
            )
          }
          onDrop={async (e) => {
            if (e.items.length === 0) return;
            if (!props.allowMultiple && e.items.length > 1) return;

            const files = await Promise.all(
              e.items
                .filter((file) => file.kind === "file")
                .filter((file) => mimeTypes.includes(file.type))
                .map((file) => file.getFile())
            ).then((files) =>
              files.map((f) => ({ file: f, __type: "file" as const }))
            );

            props.setFiles((oldFiles) => [...oldFiles, ...files]);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-16 text-neutral-600"
          >
            <path
              fillRule="evenodd"
              d="M10.5 3.75a6 6 0 0 0-5.98 6.496A5.25 5.25 0 0 0 6.75 20.25H18a4.5 4.5 0 0 0 2.206-8.423 3.75 3.75 0 0 0-4.133-4.303A6.001 6.001 0 0 0 10.5 3.75Zm2.03 5.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v4.94a.75.75 0 0 0 1.5 0v-4.94l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-center">
            <Text
              slot="label"
              className="block text-sm text-neutral-800 font-medium"
            >
              Drag and Drop {props.allowMultiple ? "Images" : "an Image"} here
            </Text>
            <p className="text-sm text-neutral-600">
              Max Size {formatBytes(props.maxSize, 0)}
            </p>
          </div>

          <FileTrigger
            acceptedFileTypes={mimeTypes}
            allowsMultiple={props.allowMultiple}
            onSelect={(e) => {
              if (e === null || e.length === 0) return;
              props.setFiles((files) => [
                ...files,
                ...[...e].map((f) => ({ file: f, __type: "file" as const })),
              ]);
            }}
          >
            <Button>Browse Files</Button>
          </FileTrigger>
        </DropZone>
      )}

      {props.files.map((file, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center justify-between gap-2 p-4 bg-zinc-5 border-zinc-300/70 border-[0.0125rem] rounded-md shadow-xs text-sm",
            props.isInvalid && "border-red-700"
          )}
        >
          <div className="flex items-center gap-4">
            <img
              src={imageUrls[index]}
              alt="Cover Image"
              className="h-16 aspect-video rounded-md object-scale-down bg-zinc-50"
            />
            <div className="flex flex-col gap-0">
              <p className="font-medium text-neutral-800 wrap-anywhere">
                {file.__type === "file" ? file.file.name : file.file.fileName}
              </p>
              <p className="text-neutral-600 text-sm">
                {formatBytes(file.file.size, 0)}
              </p>
            </div>
          </div>
          <Button
            size="icon"
            onPress={() =>
              props.setFiles((files) =>
                files.filter((oldFile) => oldFile !== file)
              )
            }
          >
            <TrashIcon />
          </Button>
        </div>
      ))}
    </>
  );
};
