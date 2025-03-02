import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "~/lib/cn";
import { Button } from "./button";

type FileUploadProps = {
  onDrop: (files: File[]) => void;
};

export const FileUpload: React.FC<FileUploadProps> = (props) => {
  const onDrop = useCallback((acceptedFiles) => {
    props.onDrop(acceptedFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-[0.125rem] border-dotted border-neutral-300/80 rounded-md p-8 flex flex-col items-center justify-center transition-colors",
        isDragActive && "bg-sky-300/40 border-sky-500"
      )}
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

      <input {...getInputProps()} accept="image/*" />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <div className="text-center">
          <p className="text-sm text-neutral-800">
            Drag and Drop an Image here
          </p>
          <p className="text-sm text-neutral-600">Max Size 4 MB</p>
          <div className="my-2">
            <Button onPress={open}>Browse Files</Button>
          </div>
        </div>
      )}
    </div>
  );
};
