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
import { UploadButton, UploadDropzone } from "~/lib/uploadthing/client";
import { FileUpload } from "../ui/file-upload";
import { formatBytes } from "~/lib/format-bytes";
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from "../ui/icons";

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

  // Cover Image
  coverImg: File | null;
  setCoverImg: (file: File | null) => void;
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

    coverImg: null,
    setCoverImg: (file) => set({ coverImg: file }),
  })
);

export const ArticleSubmissionForm = () => {
  const step = useArticleSubmissionFormStore((s) => s.step);

  return (
    <MultiStepForm>
      {step === 0 && <InitialInfoForm />}
      {step === 1 && <CoverImageForm />}
      {step === 2 && <PreviewForm />}
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
        <Button type="submit" trailingVisual={<ChevronRightIcon />}>
          Next
        </Button>
      </div>
    </form>
  );
}

function CoverImageForm() {
  const incrementStep = useArticleSubmissionFormStore((s) => s.incrementStep);
  const decrementStep = useArticleSubmissionFormStore((s) => s.decrementStep);

  const coverImg = useArticleSubmissionFormStore((s) => s.coverImg);
  const setCoverImg = useArticleSubmissionFormStore((s) => s.setCoverImg);

  const { moveBackward, moveForward } = useMultiStepForm();

  return (
    <div>
      {!coverImg && (
        <FileUpload
          onDrop={(files) => {
            if (files.length === 0) return;

            if (files.length > 1)
              throw new Error("Articles can only have 1 cover image!");

            setCoverImg(files[0]);
          }}
        />
      )}
      {coverImg && (
        <div className="flex items-center justify-between gap-4 p-4 bg-neutral-50 border-neutral-200/50 border-[0.0125rem] rounded-sm my-4">
          <div className="flex items-center gap-4">
            <img
              src={URL.createObjectURL(coverImg)}
              alt="Cover Image"
              className="h-16 aspect-video rounded-md object-scale-down"
            />
            <div className="flex flex-col gap-0">
              <p className="font-medium text-neutral-800">{coverImg.name}</p>
              <p className="text-neutral-600 text-sm">
                {formatBytes(coverImg.size, 0)}
              </p>
            </div>
          </div>
          <Button size="icon" onPress={() => setCoverImg(null)}>
            <TrashIcon />
          </Button>
        </div>
      )}
      <div className="flex items-center justify-between my-4">
        <Button
          variant="secondary"
          onPress={() => {
            moveBackward(decrementStep);
          }}
          leadingVisual={<ChevronLeftIcon />}
        >
          Back
        </Button>
        <div className="flex gap-2">
          {!coverImg && <Button variant="secondary">Skip</Button>}
          <Button
            onPress={() => {
              moveForward(incrementStep);
            }}
            trailingVisual={<ChevronRightIcon />}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function PreviewForm() {
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
        leadingVisual={<ChevronLeftIcon />}
      >
        Back
      </Button>
    </div>
  );
}
