import { formOptions, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import React, { useMemo } from "react";
import { Key, TextField } from "react-aria-components";
import Confetti from "react-confetti";
import useMeasure from "react-use-measure";
import { z } from "zod";
import { cn } from "~/lib/cn";
import { useAppForm, withForm } from "~/lib/form";
import { formatBytes } from "~/lib/format-bytes";
import { getGreeting } from "~/lib/get-greeting";
import { useTRPC } from "~/lib/trpc/client";
import { useUploadThing } from "~/lib/uploadthing/client";
import {
  MultiStepForm,
  MultiStepFormProgress,
  useMultiStepFormControl,
} from "../ui/animated-multistep-form";
import { BarLoading } from "../ui/bar-loading";
import { Button } from "../ui/button";
import { FileUpload } from "../ui/file-upload";
import { FieldError } from "../ui/form-field";
import {
  AnimatedCheckIcon,
  AnimatedXMarkIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GoogleDocsIcon,
  LinkIcon,
  TrashIcon,
} from "../ui/icons";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Modal } from "../ui/modal";
import {
  MultiSelect,
  MultiSelectBody,
  MultiSelectItem,
  MultiSelectTrigger,
} from "../ui/multi-select";

const steps = [
  "splash",
  "initial",
  "coverImg",
  "additionalInfo",
  "preview",
] as const;

const defaultValues = {
  initial: {
    name: "",
    description: "",
    docsUrl: "",
    docId: "",
    docName: "",
    collaborators: new Set<Key>(),
  },
  coverImg: {
    coverImg: null as File | null,
  },
  additionalInfo: {
    keyIdeas: "",
    message: "",
  },
};

const formOpts = formOptions({
  defaultValues,
});

const FormSectionHeading: React.FC<{
  title: string;
  description: string;
}> = (props) => (
  <div className="flex flex-col gap-1 py-4">
    <h1 className="text-4xl font-bold text-neutral-800">{props.title}</h1>
    <p className="text-neutral-700">{props.description}</p>
  </div>
);

const SplashScreen = () => {
  const trpc = useTRPC();
  const userQuery = useSuspenseQuery(trpc.user.me.queryOptions());

  return (
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
            Interested in joining the editing team? Fill out the form to request
            to join in our LinkTree, or reach out to an executive member through
            Discord.
          </p>
        </div>
      </div>
    </div>
  );
};

const InitialInfo = withForm({
  ...formOpts,

  render: ({ form }) => {
    const trpc = useTRPC();
    const docUrl = useStore(form.store, (s) => s.values.initial.docsUrl);

    const docInfoQuery = useQuery({
      ...trpc.article.getGoogleDocFromUrl.queryOptions({
        docUrl: docUrl,
      }),
      enabled: false,
      retry: false,
    });

    const usersQuery = useQuery(trpc.user.getUsers.queryOptions());

    const displayMap = useMemo(() => {
      if (usersQuery.status !== "success") return undefined;

      const map = new Map<string, string>();
      usersQuery.data.map((user) => map.set(user.id, user.name));

      return map;
    }, [usersQuery.status]);

    const [ref, { width }] = useMeasure();

    return (
      <div className="flex flex-col gap-2">
        <FormSectionHeading
          title="Let's start off with the basics..."
          description="Give us your vision for a title and a description, and most importantly, a link to your article! Please note that all of this will be worked on during the editing process."
        />
        <form.AppField
          name="initial.name"
          validators={{
            onChange: z
              .string()
              .min(
                5,
                "Please make sure the name is at least 5 characters long!"
              ),
          }}
          children={(field) => (
            <field.TextField label="Name" isTextArea={false} />
          )}
        />
        <form.AppField
          name="initial.description"
          validators={{
            onChange: z
              .string()
              .min(
                30,
                "Please make sure the description is at least 30 characters long!"
              ),
          }}
          children={(field) => (
            <field.TextField label="Description" isTextArea />
          )}
        />
        <form.AppField
          name="initial.docsUrl"
          validators={{
            onChange: z.string().url({
              message:
                "Please provide a Google Doc URL with link sharing enabled!",
            }),
            onChangeAsync: async (field) => {
              const errors = await field.fieldApi.parseValueWithSchemaAsync(
                z.string().refine(
                  async (val) => {
                    if (val !== "") {
                      const data = await docInfoQuery.refetch();

                      if (data.isSuccess && !!data.data) {
                        field.fieldApi.form.setFieldValue(
                          "initial.docId",
                          data.data?.id
                        );
                        field.fieldApi.form.setFieldValue(
                          "initial.docName",
                          data.data?.name
                        );
                      }

                      return !data.isError;
                    }
                  },
                  {
                    message:
                      "We can't find the Google Doc you provided! Please make sure you're using a valid Google Doc link with link sharing enabled!",
                  }
                )
              );

              if (errors) return errors;
            },
          }}
          asyncDebounceMs={1_000}
          children={(field) => {
            const isInputDisplayed = !(
              field.state.meta.isBlurred &&
              !field.state.meta.isValidating &&
              docInfoQuery.isSuccess &&
              !!docInfoQuery.data
            );

            return (
              <TextField
                isInvalid={field.state.meta.errors.length > 0}
                value={field.state.value}
                onChange={field.handleChange}
                onBlur={field.handleBlur}
              >
                <Label>Google Docs Link</Label>
                <p className="text-sm text-neutral-600 mb-2">
                  Please ensure that link sharing is enabled for your article,
                  otherwise we cannot access it!
                </p>
                <div className="flex items-center gap-2">
                  {isInputDisplayed && (
                    <Input fullWidth autoFocus={field.state.meta.isDirty} />
                  )}
                  {field.state.meta.isDirty && (
                    <Button
                      variant="outline"
                      fullWidth={!isInputDisplayed}
                      onPress={() =>
                        field.setMeta((m) => ({
                          ...m,
                          isBlurred: false,
                        }))
                      }
                      isCircular={false}
                    >
                      <motion.div
                        animate={{
                          width: width || "auto",
                        }}
                        transition={{
                          duration: 0.35,
                          type: "spring",
                          bounce: 0.05,
                        }}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={
                              field.state.meta.isValidating
                                ? "validating"
                                : "result"
                            }
                            transition={{
                              duration: 0.2,
                              delay: isInputDisplayed ? undefined : 0.3,
                              ease: "easeInOut",
                              type: "spring",
                              bounce: 0.2,
                            }}
                            className="flex items-center gap-2 font-sans"
                          >
                            <div
                              ref={ref}
                              className="flex items-center gap-2 text-neutral-700"
                            >
                              {field.state.meta.isValidating ||
                              docInfoQuery.status !== "success" ? (
                                <>
                                  <BarLoading />
                                </>
                              ) : docInfoQuery.isSuccess ? (
                                <>
                                  {!isInputDisplayed ? (
                                    <GoogleDocsIcon />
                                  ) : (
                                    <AnimatedCheckIcon className="size-4 text-sky-600" />
                                  )}
                                  {!isInputDisplayed && (
                                    <p className="text-xs">
                                      {docInfoQuery.data?.name}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <AnimatedXMarkIcon className="size-4 text-rose-600" />
                              )}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </motion.div>
                    </Button>
                  )}
                </div>
                {field.state.meta.errors.map(
                  ({ message }: { message: string }) => (
                    <FieldError key={message} message={message} />
                  )
                )}
              </TextField>
            );
          }}
        />
        <form.AppField
          name="initial.collaborators"
          children={(field) => (
            <MultiSelect
              selectedKeys={field.state.value}
              setSelectedKeys={field.setValue}
            >
              <Label>Collaborators</Label>
              <p className="text-sm text-neutral-600 mb-2">
                If you worked with anyone else on this article, please add them
                here. If you do not see them in this list, they have not yet
                registered with The Bay Gull.
              </p>
              <MultiSelectTrigger
                keyDisplayMap={displayMap}
                btnProps={{
                  placeholder: "Add Collaborators...",
                }}
              >
                <MultiSelectBody>
                  {usersQuery.data?.map((user) => (
                    <MultiSelectItem
                      value={user.id}
                      textValue={user.name}
                      id={user.id}
                      key={user.id}
                    >
                      {user.image && (
                        <img
                          src={user.image}
                          className="size-4 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <p className="text-xs font-medium">{user.name}</p>
                    </MultiSelectItem>
                  ))}
                </MultiSelectBody>
              </MultiSelectTrigger>
            </MultiSelect>
          )}
        />
      </div>
    );
  },
});

const CoverImage = withForm({
  ...formOpts,
  render: ({ form }) => {
    return (
      <form.AppField
        name="coverImg.coverImg"
        validators={{
          onChange: ({ value }) => {
            if (value === null) return false;
            return value.size > 1024 * 1000 * 4;
          },
        }}
        children={(field) => {
          return (
            <div>
              <FormSectionHeading
                title="Now let's add a cover image..."
                description="Add a cover image to add some visual intrigue to your article! If you don't have an image, feel free to ask (nicely) in the art team for some art! If you would like to submit without a cover image, you can skip this step."
              />
              <div>
                {!field.state.value && (
                  <FileUpload
                    onDrop={(files) => {
                      if (files.length === 0) return;

                      if (files.length > 1)
                        throw new Error(
                          "Articles can only have 1 cover image!"
                        );

                      field.handleChange(files[0]);
                    }}
                  />
                )}
                {field.state.value && (
                  <div
                    className={cn(
                      "flex items-center justify-between gap-4 p-4 bg-zinc-50 border-zinc-300/70 border-[0.0125rem] rounded-sm my-4",
                      !field.state.meta.isValid && "!border-red-700"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={URL.createObjectURL(field.state.value)}
                        alt="Cover Image"
                        className="h-16 aspect-video rounded-md object-scale-down"
                      />
                      <div className="flex flex-col gap-0">
                        <p className="font-medium text-neutral-800">
                          {field.state.value.name}
                        </p>
                        <p className="text-neutral-600 text-sm">
                          {formatBytes(field.state.value.size, 0)}
                        </p>
                      </div>
                    </div>
                    <Button size="icon" onPress={() => field.setValue(null)}>
                      <TrashIcon />
                    </Button>
                  </div>
                )}
                {field.state.meta.errors.map((err) =>
                  err ? (
                    <FieldError message="Cover Images cannot be larger than 4MB" />
                  ) : null
                )}
              </div>
            </div>
          );
        }}
      />
    );
    // }
  },
});

const AdditionalInfoForm = withForm({
  ...formOpts,
  render: ({ form }) => {
    return (
      <div className="flex flex-col gap-3">
        <FormSectionHeading
          title="One last step..."
          description="Please tell us a little bit about the message that   you wanted to portray with your article. These are the ideas that our editing team will try to ensure your article conveys well so we'd appreciate it if you took your time with this section!"
        />
        <form.AppField
          name="additionalInfo.keyIdeas"
          validators={{
            onChange: z
              .string()
              .min(10, "Please provide at least 10 characters"),
          }}
          children={(field) => (
            <field.TextField
              label="What ideas in your article are most important to preserve during editing?"
              isTextArea={true}
            />
          )}
        />
        <form.AppField
          name="additionalInfo.message"
          validators={{
            onChange: z
              .string()
              .min(30, "Please provide at least 30 characters"),
          }}
          children={(field) => (
            <field.TextField
              label="What message is your article meant to convey?"
              isTextArea={true}
            />
          )}
        />
      </div>
    );
  },
});

const FieldPreview: React.FC<React.PropsWithChildren<{ label: string }>> = (
  props
) => (
  <div className="border-[0.0125rem] rounded-md pb-1 border-zinc-300">
    <div className="text-zinc-800 font-sans font-semibold text-xs bg-zinc-50 p-2 rounded-t-md shadow-sm">
      {props.label}
    </div>
    {props.children}
  </div>
);

const PreviewForm = withForm({
  ...formOpts,
  render: ({ form }) => {
    const data = useStore(form.store, (s) => s.values);

    const trpc = useTRPC();
    const usersQuery = useQuery(trpc.user.getUsers.queryOptions());

    return (
      <div>
        <FormSectionHeading
          title="Does everything look okay?"
          description="If everything looks correct, you can now submit your article. Our editors will look them over and get back to you soon!"
        />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-sm">
            <FieldPreview label="Name">
              <p className="text-zinc-700 text-sm px-2 my-1 wrap-break-word">
                {data.initial.name}
              </p>
            </FieldPreview>
            <FieldPreview label="Description">
              <p className="text-zinc-700 text-sm px-2 my-1 wrap-break-word">
                {data.initial.description}
              </p>
            </FieldPreview>
            <FieldPreview label="Google Doc Link">
              <a
                href={`https://docs.google.com/document/d/${data.initial.docId}/preview`}
                target="_blank"
                className="group"
              >
                <div className="flex items-center justify-between gap-2 px-2 my-2">
                  <div className="flex items-center gap-2">
                    <GoogleDocsIcon />

                    <p className="text-zinc-700 text-sm px-2 -ml-2 group-hover:underline">
                      {data.initial.docName}
                    </p>
                  </div>

                  <div className="invisible group-hover:visible transition-all">
                    <LinkIcon />
                  </div>
                </div>
              </a>
            </FieldPreview>
            {data.initial.collaborators.size > 0 && (
              <FieldPreview label="Collaborators">
                <div className="flex flex-row gap-2 my-2.5 mx-2">
                  {usersQuery.data
                    ?.filter((user) => data.initial.collaborators.has(user.id))
                    .map((user) => (
                      <div
                        key={user.id}
                        className="py-1 px-3 flex items-center gap-1 border-[0.0125rem] border-sky-200 bg-sky-50 text-sky-800 rounded-full"
                      >
                        {user.image && (
                          <img
                            src={user.image}
                            className="size-4 rounded-full"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <p className="text-sm">{user.name}</p>
                      </div>
                    ))}
                </div>
              </FieldPreview>
            )}

            {data.coverImg.coverImg && (
              <FieldPreview label="Cover Image">
                <div className="flex items-center gap-2 px-2 py-4">
                  <img
                    src={URL.createObjectURL(data.coverImg.coverImg)}
                    alt="Cover Image"
                    className="h-16 aspect-video rounded-md object-scale-down"
                  />
                  <div className="flex flex-col gap-0">
                    <p className="font-medium text-neutral-800 text-sm">
                      {data.coverImg.coverImg.name}
                    </p>
                    <p className="text-neutral-600 text-xs">
                      {formatBytes(data.coverImg.coverImg.size, 0)}
                    </p>
                  </div>
                </div>
              </FieldPreview>
            )}
            <FieldPreview label="Key Ideas">
              <p className="text-zinc-700 text-sm px-2 my-1 wrap-break-word">
                {data.additionalInfo.keyIdeas}
              </p>
            </FieldPreview>
            <FieldPreview label="Message">
              <p className="text-zinc-700 text-sm px-2 my-1 wrap-break-word">
                {data.additionalInfo.message}
              </p>
            </FieldPreview>
          </div>
        </div>
      </div>
    );
  },
});

export const ArticleSubmissionForm = () => {
  const multiStepControl = useMultiStepFormControl();

  const { startUpload } = useUploadThing("imageUploader");
  const trpc = useTRPC();

  const submit = useMutation(
    trpc.article.draft.create.mutationOptions({
      onError: (err) => {
        console.error(err);
      },
    })
  );

  const form = useAppForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      let coverImgUrl: string | undefined = undefined;
      if (value.coverImg.coverImg) {
        const uploadResult = await startUpload([value.coverImg.coverImg]);
        if (!uploadResult) throw new Error("Image Upload Failed!");
        coverImgUrl = uploadResult[0].ufsUrl;
      }

      await submit.mutateAsync({
        title: value.initial.name,
        description: value.initial.description,
        keyIdeas: value.additionalInfo.keyIdeas,
        message: value.additionalInfo.message,
        coverImg: coverImgUrl,
        docId: value.initial.docId,
        collaborators: [...(value.initial.collaborators as Set<string>)],
      });
    },
  });

  const next = async () => {
    if (steps[multiStepControl.step] === "splash")
      return multiStepControl.moveForward();
    if (steps[multiStepControl.step] === "preview") return form.handleSubmit();

    const fieldData = Object.keys(defaultValues[steps[multiStepControl.step]])
      .map((field) => `${steps[multiStepControl.step]}.${field}`)
      .map((field) => {
        const fieldInfo = form.getFieldInfo(field as any);
        if (!fieldInfo.instance) return null;

        const fieldMeta = fieldInfo.instance.getMeta();

        return {
          id: fieldInfo.instance.name,
          isValid: fieldMeta.isValid,
          isPristine: fieldMeta.isPristine,
        };
      });

    if (
      fieldData
        .filter((field) => field !== null)
        .some((field) => !field.isValid)
    )
      return;

    const validateResult = await Promise.all(
      fieldData
        .filter((field) => field !== null)
        .filter((field) => field.isPristine)
        .map((field) => form.validateField(field.id, "submit"))
    ).then((res) => res.flat());

    if (validateResult.length === 0) {
      multiStepControl.moveForward();
    }
  };

  const prev = async () => {
    if (multiStepControl.step === 0) return;

    multiStepControl.moveBackward();
  };

  return (
    <div>
      {multiStepControl.step > 0 && (
        <MultiStepFormProgress
          steps={steps.slice(1)}
          currentStep={multiStepControl.step - 1}
        />
      )}
      <MultiStepForm multiStepControl={multiStepControl}>
        {steps[multiStepControl.step] === "splash" && <SplashScreen />}
        {steps[multiStepControl.step] === "initial" && (
          <InitialInfo form={form} />
        )}
        {steps[multiStepControl.step] === "coverImg" && (
          <CoverImage form={form} />
        )}
        {steps[multiStepControl.step] === "additionalInfo" && (
          <AdditionalInfoForm form={form} />
        )}
        {steps[multiStepControl.step] === "preview" && (
          <PreviewForm form={form} />
        )}
      </MultiStepForm>

      <form.Subscribe
        selector={(state) =>
          [
            state.isSubmitting,
            state.isFieldsValidating,
            state.values.coverImg.coverImg,
          ] as const
        }
        children={([isSubmitting, isValidating, coverImg]) => (
          <div className="w-full flex items-center justify-between my-4 font-sans">
            <span className={cn(multiStepControl.step === 0 && "hidden")}>
              <Button
                onPress={prev}
                leadingVisual={<ChevronLeftIcon />}
                variant="ghost"
                isDisabled={isSubmitting || isValidating}
              >
                Back
              </Button>
            </span>
            <Button
              fullWidth={multiStepControl.step === 0}
              onPress={next}
              trailingVisual={<ChevronRightIcon />}
              isLoading={isSubmitting}
              isDisabled={isSubmitting || isValidating}
            >
              {steps[multiStepControl.step] === "coverImg" && !coverImg
                ? "Skip"
                : steps[multiStepControl.step] === "preview"
                ? "Submit"
                : "Next"}
            </Button>
          </div>
        )}
      />

      <Modal isOpen={submit.isSuccess} size="sm">
        <div className="flex items-center justify-center flex-col px-8 py-6">
          <div className="text-emerald-600">
            <CheckCircleIcon />
          </div>
          <p className="text-center font-semibold text-lg mb-1 mt-2">
            Congratulations your article has been submitted!
          </p>
          <p className="text-xs text-zinc-500 text-center">
            We look forward to reading your work. You can expect an email within
            a week with updates about the editing process and updates on being
            published!
          </p>
          <div className="mt-4 w-full flex flex-col gap-2">
            <Link to="/">
              <Button fullWidth>Return Home</Button>
            </Link>
            <Link to="/articles/submit">
              <Button fullWidth variant="ghost">
                Submit Another
              </Button>
            </Link>
          </div>
        </div>
        <Confetti />
      </Modal>
    </div>
  );
};
