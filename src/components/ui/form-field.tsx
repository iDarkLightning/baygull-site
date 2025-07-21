import { TextField as AriaTextField } from "react-aria-components";
import { useFieldContext } from "~/lib/form";
import { Label } from "./label";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { Input } from "./input";
import { TextArea } from "./textarea";

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

type FieldErrorProps = {
  message?: string;
};

export const FieldError: React.FC<FieldErrorProps> = (props) => (
  <div className="flex items-center gap-2 my-2 text-red-700">
    <p className="font-medium text-sm">{props.message}</p>
  </div>
);
