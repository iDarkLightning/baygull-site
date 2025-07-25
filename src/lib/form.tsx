import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { ImageUploadField, TextField } from "~/components/ui/form-field";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    ImageUploadField,
  },
  formComponents: {},
  fieldContext,
  formContext,
});
