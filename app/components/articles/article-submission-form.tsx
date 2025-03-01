import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { TextArea } from "../ui/textarea";
import { create } from "zustand";

type TArticleSubmissionFormStore = {
  step: number;
  incrementStep: () => void;
  decrementStep: () => void;
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
  })
);

export const ArticleSubmissionForm = () => {
  const step = useArticleSubmissionFormStore((s) => s.step);

  if (step === 0) return <InitialInfoForm />;

  return null;
};

function InitialInfoForm() {
  const incrementStep = useArticleSubmissionFormStore((s) => s.incrementStep);

  return (
    <div className="flex flex-col gap-4">
      <Label>Artice Name</Label>
      <Input fullWidth />
      <Label>Artice Description</Label>
      <TextArea />
      <Label>Article Google Doc Link</Label>
      <Input fullWidth />
      <div className="self-end">
        <Button
          onPress={() => incrementStep()}
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
    </div>
  );
}

function CoverImageForm() {
  return <div>Select a Cover Image or skip</div>;
}
