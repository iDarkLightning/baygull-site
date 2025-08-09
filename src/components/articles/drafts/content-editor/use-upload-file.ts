import * as React from "react";

import type { UploadRouter } from "~/lib/uploadthing";
import type {
  ClientUploadedFileData,
  UploadFilesOptions,
} from "uploadthing/types";

import { generateReactHelpers } from "@uploadthing/react";
// import { toast } from "sonner";
import { z } from "zod";
import { uploadFiles } from "~/lib/uploadthing/client";

export type UploadedFile<T = unknown> = ClientUploadedFileData<T>;

interface UseUploadFileProps
  extends Pick<
    UploadFilesOptions<UploadRouter["imageUploader"]>,
    "headers" | "onUploadBegin" | "onUploadProgress" | "skipPolling"
  > {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
}

export function useUploadFile({
  onUploadComplete,
  onUploadError,
  ...props
}: UseUploadFileProps = {}) {
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
  const [uploadingFile, setUploadingFile] = React.useState<File>();
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadThing(file: File) {
    setIsUploading(true);
    setUploadingFile(file);

    try {
      const res = await uploadFiles("imageUploader", {
        ...props,
        files: [file],
        onUploadProgress: ({ progress }) => {
          setProgress(Math.min(progress, 100));
        },
      });

      setUploadedFile(res[0]);

      onUploadComplete?.(res[0]);

      return uploadedFile;
    } catch (error) {
      throw error;
    } finally {
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile: uploadThing,
    uploadingFile,
  };
}

export function getErrorMessage(err: unknown) {
  const unknownError = "Something went wrong, please try again later.";

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message;
    });

    return errors.join("\n");
  } else if (err instanceof Error) {
    return err.message;
  } else {
    return unknownError;
  }
}
