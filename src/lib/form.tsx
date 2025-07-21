import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { TextField } from "~/components/ui/form-field";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
  },
  formComponents: {},
  fieldContext,
  formContext,
});
