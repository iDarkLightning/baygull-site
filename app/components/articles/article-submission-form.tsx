import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { TextField } from "react-aria-components";
import { Controller } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { z } from "zod";
import { create } from "zustand";
import { getGoogleDocFromUrlQuery } from "~/lib/articles/article-api";
import { createArticleDraft } from "~/lib/articles/article-fns";
import { getUserQuery } from "~/lib/auth/auth-api";
import { formatBytes } from "~/lib/format-bytes";
import { getGreeting } from "~/lib/get-greeting";
import { useZodForm } from "~/lib/hooks/use-zod-form";
import { useUploadThing } from "~/lib/uploadthing/client";
import { MultiStepForm, useMultiStepForm } from "../ui/animated-multistep-form";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field-error";
import { FileUpload } from "../ui/file-upload";
import {
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GoogleDocsIcon,
  TrashIcon,
} from "../ui/icons";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { TextArea } from "../ui/textarea";
import Confetti from "react-confetti";
import useWindowSize from "~/lib/hooks/use-window-size";
import { Link } from "@tanstack/react-router";

type TArticleSubmissionFormStore = {
  // Step Controls
  step: number;
  incrementStep: () => void;
  decrementStep: () => void;

  // Initial Info
  name: string;
  description: string;
  docsUrl: string;

  docId: string;

  submitInitialInfo: (data: {
    name: string;
    description: string;
    docsUrl: string;
    docId: string;
  }) => void;

  // Cover Image
  coverImg: File | null;
  setCoverImg: (file: File | null) => void;

  // Additional Info
  keyIdeas: string;
  message: string;
  submitAdditionalInfo: (data: { keyIdeas: string; message: string }) => void;
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
    docId: "",
    submitInitialInfo: (data) =>
      set({
        name: data.name,
        description: data.description,
        docsUrl: data.docsUrl,
        docId: data.docId,
      }),

    coverImg: null,
    setCoverImg: (file) => set({ coverImg: file }),

    keyIdeas: "",
    message: "",
    submitAdditionalInfo: (data) =>
      set({
        keyIdeas: data.keyIdeas,
        message: data.message,
      }),
  })
);

export const ArticleSubmissionForm = () => {
  const step = useArticleSubmissionFormStore((s) => s.step);

  return (
    <MultiStepForm>
      {step === 0 && <SplashScreen />}
      {step === 1 && <InitialInfoForm />}
      {step === 2 && <CoverImageForm />}
      {step === 3 && <AdditionalInfoForm />}
      {step === 4 && <PreviewForm />}
      {step === 5 && <ConfirmationScreen />}
    </MultiStepForm>
  );
};

function SplashScreen() {
  const incrementStep = useArticleSubmissionFormStore((s) => s.incrementStep);
  const { moveForward } = useMultiStepForm();

  const userQuery = useSuspenseQuery(getUserQuery());

  return (
    <div className="flex flex-col gap-0.5 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-500 my-1">
            {getGreeting()}, {userQuery.data?.name}!
          </h1>
          <h2 className="text-3xl font-black text-neutral-700 tracking-wide">
            Let's submit an article!
          </h2>
          <div className="flex flex-col gap-2 my-2">
            <p className="text-neutral-700">
              Submitted articles will be reviewed and edited by the editing team
              1PM on Wednesdays. You will receive your edited work via email in
              3-5 days after the editing meeting, and we'll talk then about
              changes as needed.
            </p>
            <p className="text-neutral-700">
              Interested in joining the editing team? Fill out the form to
              request to join in our LinkTree, or reach out to an executive
              member through Discord.
            </p>
          </div>
        </div>
      </div>
      <Button
        fullWidth
        onPress={() => {
          moveForward(incrementStep);
        }}
        trailingVisual={<ChevronRightIcon />}
      >
        Start
      </Button>
    </div>
  );
}

function InitialInfoForm() {
  const { incrementStep, submitInitialInfo, name, description, docsUrl } =
    useArticleSubmissionFormStore();
  const { moveForward } = useMultiStepForm();

  const [docsUrl_, setDocsUrl_] = useState<string | undefined>(docsUrl);
  const [debouncedDocsUrl] = useDebounce(docsUrl_, 1_000);

  const docInfoQuery = useQuery({
    ...getGoogleDocFromUrlQuery(debouncedDocsUrl),
    enabled: true,
  });

  const form = useZodForm({
    schema: z.object({
      name: z
        .string()
        .min(5, "Please make sure the name is at least 5 characters long!"),
      description: z
        .string()
        .min(
          30,
          "Please make sure the description is at least 30 characters long!"
        ),
      docsUrl: z
        .string()
        .url({
          message: "Please provide a Google Doc URL with link sharing enabled!",
        })
        .refine(
          async (val) => {
            if (val !== "") {
              const data = await docInfoQuery.refetch();
              return !data.isError;
            }
          },
          {
            message:
              "We can't find the Google Doc you provided! Please make sure you're using a valid Google Doc link with link sharing enabled!",
          }
        ),
    }),
    defaultValues: {
      name,
      description,
      docsUrl,
    },
  });
  useEffect(() => {
    const { unsubscribe } = form.watch((value) => {
      setDocsUrl_(value.docsUrl);
    });
    return () => unsubscribe();
  }, [form.watch]);

  useEffect(() => {
    if (docInfoQuery.status === "error") {
      form.setError("docsUrl", {
        type: "required",
        message:
          "We can't find the Google Doc you provided! Please make sure you're using a valid Google Doc link with link sharing enabled!",
      });
    } else if (docInfoQuery.status === "success") {
      form.clearErrors("docsUrl");
    }
  }, [docInfoQuery.status]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-1 border-b py-4 border-b-neutral-300">
        <h1 className="text-4xl font-bold text-neutral-800">
          Let's start off with the basics...
        </h1>
        <p className="text-neutral-700">
          Give us your vision for a title and a description, and most
          importantly, a link to your article! Please note that all of this will
          be worked on during the editing process.
        </p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          moveForward(() => {
            submitInitialInfo({
              ...data,
              docId: docInfoQuery.data?.id as string,
            });
            incrementStep();
          });
        })}
      >
        <Controller
          control={form.control}
          name="name"
          render={({ field, formState }) => (
            <TextField isInvalid={!!formState.errors.name} {...field}>
              <Label>Article Name</Label>
              <Input fullWidth />
              {formState.errors.name && (
                <FieldError message={formState.errors.name.message} />
              )}
            </TextField>
          )}
        />
        <Controller
          control={form.control}
          name="description"
          render={({ field, formState }) => (
            <TextField isInvalid={!!formState.errors.name} {...field}>
              <Label>Article Description</Label>
              <TextArea fullWidth />
              {formState.errors.description && (
                <FieldError message={formState.errors.description.message} />
              )}
            </TextField>
          )}
        />
        <Controller
          control={form.control}
          name="docsUrl"
          render={({ field, formState }) => (
            <TextField isInvalid={!!formState.errors.docsUrl} {...field}>
              <Label>Article Google Doc Link</Label>
              <p className="text-sm text-neutral-600 mb-2">
                Please ensure that link sharing is enabled for your article,
                otherwise we cannot access it!
              </p>
              <Input fullWidth />
              {formState.errors.docsUrl && (
                <FieldError message={formState.errors.docsUrl.message} />
              )}
            </TextField>
          )}
        />

        {docInfoQuery.status === "success" && !!docInfoQuery.data && (
          <div className="flex items-center justify-between gap-4 p-2 bg-neutral-50 border-neutral-300/70 border-[0.0125rem] rounded-sm my-4">
            <div className="flex items-center gap-4">
              <GoogleDocsIcon />
              <div className="flex flex-col gap-0">
                <p className="font-medium text-neutral-800">
                  {docInfoQuery.data.name}
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="self-end">
          <Button
            type="submit"
            trailingVisual={<ChevronRightIcon />}
            isDisabled={docInfoQuery.isPending || docsUrl_ !== debouncedDocsUrl}
          >
            Next
          </Button>
        </div>
      </form>
    </div>
  );
}

function CoverImageForm() {
  const incrementStep = useArticleSubmissionFormStore((s) => s.incrementStep);
  const decrementStep = useArticleSubmissionFormStore((s) => s.decrementStep);
  const { moveBackward, moveForward } = useMultiStepForm();

  const coverImg = useArticleSubmissionFormStore((s) => s.coverImg);
  const setCoverImg = useArticleSubmissionFormStore((s) => s.setCoverImg);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-1 border-b py-4 border-b-neutral-300">
        <h1 className="text-4xl font-bold text-neutral-800">
          Now let's add a cover image...
        </h1>
        <p className="text-neutral-700">
          Add a cover image to add some visual intrigue to your article! If you
          don't have an image, feel free to ask (nicely) in the art team for
          some art! If you would like to submit without a cover image, you can
          skip this step.
        </p>
      </div>
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
        <Button
          onPress={() => {
            moveForward(incrementStep);
          }}
          trailingVisual={<ChevronRightIcon />}
        >
          {coverImg ? "Next" : "Skip"}
        </Button>
      </div>
    </div>
  );
}

function AdditionalInfoForm() {
  const {
    incrementStep,
    decrementStep,
    submitAdditionalInfo,
    keyIdeas,
    message,
  } = useArticleSubmissionFormStore();
  const { moveBackward, moveForward } = useMultiStepForm();

  const form = useZodForm({
    schema: z.object({
      keyIdeas: z.string().min(10, "Please provide at least 10 characters"),
      message: z.string().min(30, "Please provide at least 30 characters"),
    }),
    defaultValues: {
      keyIdeas,
      message,
    },
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-1 border-b py-4 border-b-neutral-300">
        <h1 className="text-4xl font-bold text-neutral-800">
          One last step...
        </h1>
        <p className="text-neutral-700">
          Please tell us a little bit about the message that you wanted to
          portray with your article. These are the ideas that our editing team
          will try to ensure your article conveys well so we'd appreciate it if
          you took your time with this section!
        </p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          moveForward(() => {
            submitAdditionalInfo(data);
            incrementStep();
          });
        })}
      >
        <Controller
          control={form.control}
          name="keyIdeas"
          render={({ field, formState }) => (
            <TextField isInvalid={!!formState.errors.keyIdeas} {...field}>
              <Label>
                What ideas in your article are most important to preserved
                during editing?
              </Label>
              <TextArea fullWidth />
              {formState.errors.keyIdeas && (
                <FieldError message={formState.errors.keyIdeas.message} />
              )}
            </TextField>
          )}
        />
        <Controller
          control={form.control}
          name="message"
          render={({ field, formState }) => (
            <TextField isInvalid={!!formState.errors.message} {...field}>
              <Label>What message is your article meant to convey?</Label>
              <TextArea fullWidth />
              {formState.errors.message && (
                <FieldError message={formState.errors.message.message} />
              )}
            </TextField>
          )}
        />
        <div className="flex items-center justify-between my-4">
          <Button
            type="button"
            variant="secondary"
            onPress={() => {
              moveBackward(decrementStep);
            }}
            leadingVisual={<ChevronLeftIcon />}
          >
            Back
          </Button>
          <Button type="submit" trailingVisual={<ChevronRightIcon />}>
            Next
          </Button>
        </div>
      </form>
    </div>
  );
}

function PreviewForm() {
  const data = useArticleSubmissionFormStore();
  const { moveBackward, moveForward } = useMultiStepForm();

  const { startUpload } = useUploadThing("imageUploader");

  const submit = useMutation({
    mutationKey: ["article-submit-draft"],
    mutationFn: async () => {
      let coverImgUrl: string | undefined = undefined;

      if (data.coverImg) {
        const uploadResult = await startUpload([data.coverImg]);

        if (!uploadResult) throw new Error("Image Upload Failed!");

        coverImgUrl = uploadResult[0].ufsUrl;
      }

      await createArticleDraft({
        data: {
          title: data.name,
          description: data.description,
          keyIdeas: data.keyIdeas,
          message: data.message,
          coverImg: coverImgUrl,
          docId: data.docId,
        },
      });
    },
    onSuccess: () => moveForward(data.incrementStep),
    onError: (err) => {
      console.error(err);
    },
  });

  return (
    <div>
      <div className="mb-8 flex flex-col gap-1 border-b py-4 border-b-neutral-300">
        <h1 className="text-4xl font-bold text-neutral-800">
          Does everything look okay?
        </h1>
        <p className="text-neutral-700">
          If everything looks correct, you can now submit your article. Our
          editors will look them over and get back to you soon!
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 p-4 bg-neutral-50 border-neutral-200/50 border-[0.0125rem] rounded-sm">
          <div>
            <p className="text-neutral-800 font-semibold">Article Name</p>
            <p className="text-neutral-700">{data.name}</p>
          </div>

          <div>
            <p className="text-neutral-800 font-semibold">
              Article Description
            </p>
            <p className="text-neutral-700">{data.description}</p>
          </div>

          <div>
            <p className="text-neutral-800 font-semibold">Key Ideas</p>
            <p className="text-neutral-700">{data.keyIdeas}</p>
          </div>

          <div>
            <p className="text-neutral-800 font-semibold">Message</p>
            <p className="text-neutral-700">{data.message}</p>
          </div>
        </div>

        {data.coverImg && (
          <div className="flex flex-col gap-4 p-4 bg-neutral-50 border-neutral-200/50 border-[0.0125rem] rounded-sm">
            <p className="text-neutral-800 font-semibold">
              Article Cover Image
            </p>
            <div className="flex items-center gap-4">
              <img
                src={URL.createObjectURL(data.coverImg)}
                alt="Cover Image"
                className="h-16 aspect-video rounded-md object-scale-down"
              />
              <div className="flex flex-col gap-0">
                <p className="font-medium text-neutral-800">
                  {data.coverImg.name}
                </p>
                <p className="text-neutral-600 text-sm">
                  {formatBytes(data.coverImg.size, 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 p-4 bg-neutral-50 border-neutral-200/50 border-[0.0125rem] rounded-sm">
          <div>
            <p className="text-neutral-800 font-semibold">
              Article Content Preview
            </p>
            <p className="text-neutral-600 text-sm">
              This will go through the editing process and then formatted for
              the website! Don't worry if it doesn't look perfect right now.
            </p>
          </div>
          <iframe
            className="w-full h-96"
            src={`https://docs.google.com/document/d/${data.docId}/preview`}
          />
        </div>
        <div className="flex items-center justify-between my-4">
          <Button
            variant="secondary"
            onPress={() => {
              moveBackward(data.decrementStep);
            }}
            leadingVisual={<ChevronLeftIcon />}
          >
            Back
          </Button>
          <Button
            onPress={() => {
              submit.mutate();
            }}
            trailingVisual={<ChevronRightIcon />}
            isDisabled={submit.isPending}
          >
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConfirmationScreen() {
  const { windowSize } = useWindowSize();

  return (
    <>
      <div className="flex flex-col gap-0.5 py-4">
        <div className="flex justify-between items-center">
          <div>
            <div>
              <div className="flex items-center gap-4">
                <div className="text-emerald-600">
                  <CheckCircleIcon />
                </div>
                <h2 className="text-3xl font-black text-neutral-700 tracking-wide">
                  Congratulations your article has been submitted!
                </h2>
              </div>
              <div className="flex flex-col gap-2 my-2">
                <p className="text-neutral-700">
                  We look forward to reading your work. You can expect an email
                  within a week with updates about the editing process and
                  updates on being published!
                  <span>
                    <Link to="/" className="mx-1 text-sky-700 underline">
                      Return Home
                    </Link>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Confetti width={windowSize.width} height={windowSize.height} />
    </>
  );
}
