import { TextField as AriaTextField } from "react-aria-components";
import { useFieldContext } from "~/lib/form";
import { Label } from "./label";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "./input";
import { TextArea } from "./textarea";
import { ImageUpload, ImageUploadProps } from "./file-upload";
import { formatBytes } from "~/lib/format-bytes";

type TextFieldProps = (React.ComponentProps<typeof AriaTextField> & {
  label: string;
}) &
  (
    | {
        isTextArea: true;
        inputProps?: React.ComponentProps<typeof TextArea>;
      }
    | {
        isTextArea: false;
        inputProps?: React.ComponentProps<typeof Input>;
      }
  );

export const TextField: React.FC<TextFieldProps> = ({
  label,
  isTextArea,
  inputProps,
  ...props
}) => {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <AriaTextField
      isInvalid={errors.length > 0}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
      {...props}
    >
      <Label>{label}</Label>
      {isTextArea ? (
        <TextArea fullWidth {...inputProps} />
      ) : (
        <Input fullWidth {...inputProps} />
      )}
      {errors.map(({ message }: { message: string }) => (
        <FieldError key={message} message={message} />
      ))}
    </AriaTextField>
  );
};

export const ImageUploadField: React.FC<ImageUploadProps> = (props) => {
  const field = useFieldContext<File[]>();
  const errors = useStore(field.store, (state) => state.meta.errors);

  return (
    <div>
      <ImageUpload isInvalid={errors.length > 0} {...props} />
      {errors.map(({ message }: { message: string }) => (
        <FieldError key={message} message={message} />
      ))}
      {/* {errors.map((err, index) =>
        err ? (
          <FieldError
            key={index}
            message={`Cover Images cannot be larger than ${formatBytes(
              props.maxSize,
              0
            )}`}
          />
        ) : null
      )} */}
    </div>
  );
};

type FieldErrorProps = {
  message?: string;
};

export const FieldError: React.FC<FieldErrorProps> = (props) => (
  <div className="flex items-center gap-2 my-2 text-red-700">
    <p className="font-medium text-sm">{props.message}</p>
  </div>
);
