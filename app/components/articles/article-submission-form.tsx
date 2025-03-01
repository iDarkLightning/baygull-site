import {
  useAnimationControls,
  motion,
  animationControls,
  AnimationControls,
} from "framer-motion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { TextArea } from "../ui/textarea";
import { create } from "zustand";
import { string, z } from "zod";
import { useZodForm } from "~/lib/hooks/use-zod-form";
import { MultiStepForm, useMultiStepForm } from "../ui/animated-multistep-form";

type TArticleSubmissionFormStore = {
  // Step Controls
  step: number;
  incrementStep: () => void;
  decrementStep: () => void;

  // Initial Info
  name: string;
  description: string;
  docsUrl: string;
  submitInitialInfo: (data: {
    name: string;
    description: string;
    docsUrl: string;
  }) => void;
};

const useArticleSubmissionFormStore = create<TArticleSubmissionFormStore>(
  (set) => ({
    step: 0,
    incrementStep: () =>
      set((state) => ({
        step: state.step + 1,
      })),
    decrementStep: () =>
      set((state) => ({
        step: state.step - 1,
      })),
    name: "",
    description: "",
    docsUrl: "",
    submitInitialInfo: (data) =>
      set({
        name: data.name,
        description: data.description,
        docsUrl: data.docsUrl,
      }),
  })
);

export const ArticleSubmissionForm = () => {
  const step = useArticleSubmissionFormStore((s) => s.step);

  return (
    <MultiStepForm>
      {step === 0 && <InitialInfoForm />}
      {step === 1 && <CoverImageForm />}
    </MultiStepForm>
  );
};

function InitialInfoForm() {
  const { incrementStep, submitInitialInfo, name, description, docsUrl } =
    useArticleSubmissionFormStore();
  const { moveForward } = useMultiStepForm();

  const form = useZodForm({
    schema: z.object({
      name: z.string(),
      description: z.string(),
      docsUrl: z.string().url(),
    }),
    defaultValues: {
      name,
      description,
      docsUrl,
    },
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={form.handleSubmit((data) => {
        moveForward(() => {
          submitInitialInfo(data);
          incrementStep();
        });
      })}
    >
      <fieldset>
        <Label>Article Name</Label>
        <Input fullWidth {...form.register("name")} />
      </fieldset>
      <fieldset>
        <Label>Article Description</Label>
        <TextArea {...form.register("description")} fullWidth />
      </fieldset>
      <fieldset>
        <Label>Article Google Doc Link</Label>
        <Input fullWidth {...form.register("docsUrl")} />
      </fieldset>
      <div className="self-end">
        <Button
          type="submit"
          trailingVisual={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5"
            >
              <path
                fillRule="evenodd"
                d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          Next
        </Button>
      </div>
    </form>
  );
}

function CoverImageForm() {
  const decrementStep = useArticleSubmissionFormStore((s) => s.decrementStep);
  const docsUrl = useArticleSubmissionFormStore((s) => s.docsUrl);

  const { moveBackward } = useMultiStepForm();

  return (
    <div>
      <iframe className="w-full h-96" src={`${docsUrl}/preview`}></iframe>
      <Button
        onPress={() => {
          moveBackward(decrementStep);
        }}
        leadingVisual={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5"
          >
            <path
              fillRule="evenodd"
              d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        }
      >
        Back
      </Button>
    </div>
  );
}
