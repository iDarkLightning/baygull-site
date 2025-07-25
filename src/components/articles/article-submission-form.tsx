import { formOptions, useStore } from "@tanstack/react-form";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo } from "react";
import { Key, Radio, RadioGroup, TextField } from "react-aria-components";
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
import { FieldError } from "../ui/form-field";
import {
  AnimatedCheckIcon,
  AnimatedXMarkIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GoogleDocsIcon,
  LinkIcon,
  PeopleIcon,
  PhotoIcon,
  TextIcon,
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
  "type",
  "initial",
  "imgs",
  "additionalInfo",
  "preview",
] as const;

const articleTypes = [
  {
    value: "default" as const,
    label: "Default",
    graphic: (
      <div className="flex flex-col w-full gap-2">
        <div className="w-full bg-zinc-200 h-2 rounded-xs" />
        <div className="flex gap-2">
          <div className="w-full bg-zinc-200 h-[32] rounded-xs flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 text-neutral-300"
            >
              <path
                fillRule="evenodd"
                d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="w-full bg-zinc-200 h-2 rounded-xs" />
            <div className="w-full bg-zinc-200 h-2 rounded-xs" />
            <div className="w-full bg-zinc-200 h-2 rounded-xs" />
          </div>
        </div>
        <div className="w-full bg-zinc-200 h-2 rounded-xs" />
      </div>
    ),
    description:
      "A standard article with primarily text content with some multimedia content thrown in the mix. If you're uncertain, start with a default article.",
  },
  {
    value: "headline" as const,
    label: "Headline",
    graphic: (
      <>
        <div className="flex flex-col w-full gap-2">
          <div className="w-full bg-zinc-200 h-2 rounded-xs" />
        </div>
      </>
    ),
    description:
      "Have a funny pitch but not quite enough to write a full article? We can publish just a headline without any content.",
  },
  {
    value: "graphic" as const,
    label: "Graphic",
    graphic: (
      <div className="flex flex-col w-full gap-2">
        <div className="w-full bg-zinc-200 h-2 rounded-xs" />
        <div className="w-full bg-zinc-200 h-18 rounded-xs flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-8 text-neutral-300"
          >
            <path
              fillRule="evenodd"
              d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    ),
    description:
      "Created a piece of art? Have a funny drawing, comic, or meme? We can publish your art ",
  },
];

type ArticleType = (typeof articleTypes)[number]["value"];

const excludedFieldsByType = {
  default: [] as string[],
  headline: [
    "initial.description",
    "initial.docsUrl",
    "initial.docId",
    "initial.docName",
  ],
  graphic: [
    "initial.docsUrl",
    "initial.docId",
    "initial.docName",
    // "imgs.coverImg.coverImg",
  ],
} satisfies Record<ArticleType, string[]>;

const defaultValues = {
  type: {
    type: "default" as ArticleType,
  },
  initial: {
    name: "",
    description: "",
    docsUrl: "",
    docId: "",
    docName: "",
    collaborators: new Set<Key>(),
  },
  imgs: {
    media: [] as File[],
  },
  additionalInfo: {
    keyIdeas: "",
    message: "",
  },
};

type FormFields =
  | `type.${keyof (typeof defaultValues)["type"]}`
  | `initial.${keyof (typeof defaultValues)["initial"]}`
  | `imgs.${keyof (typeof defaultValues)["imgs"]}`
  | `additionalInfo.${keyof (typeof defaultValues)["additionalInfo"]}`;

const RenderIfNotExcluded: React.FC<
  React.PropsWithChildren<{
    type: ArticleType;
    name: FormFields;
  }>
> = (props) => {
  if (excludedFieldsByType[props.type].includes(props.name)) return null;

  return props.children;
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

const TypeRadio: React.FC<
  React.PropsWithChildren<{
    value: string;
    graphic: React.ReactNode;
    label: string;
    description: string;
  }>
> = (props) => (
  <Radio
    value={props.value}
    className={({ isSelected }) =>
      cn(
        "relative flex items-center gap-4 px-4 py-3 rounded-md border-[0.0125rem] border-zinc-300/70 transition-colors shadow-xs",
        isSelected && "border-transparent text-white"
      )
    }
  >
    <div className="flex-1 z-20 flex items-center justify-center">
      {props.graphic}
    </div>
    <div className="flex-[3]">
      <p className="font-semibold z-20 relative">{props.label}</p>
      <p className="text-sm z-20 relative">{props.description}</p>
    </div>
    {props.children}
  </Radio>
);

const Type = withForm({
  ...formOpts,
  render: ({ form }) => {
    return (
      <div className="flex flex-col gap-2">
        <FormSectionHeading
          title="Let's start with the type of article..."
          description="Lorem ipsum dolor sit amet I need a description here to make it make sense"
        />
        <form.AppField
          name="type.type"
          validators={{
            onChange: z.enum(["default", "headline", "graphic"], {
              message: "Please select what kind of article you are submitting",
            }),
          }}
          children={(field) => (
            <RadioGroup
              aria-label="Article Type Radio"
              className="flex flex-col gap-2"
              onChange={(value) => field.handleChange(value as ArticleType)}
              onBlur={field.handleBlur}
              value={field.state.value}
            >
              {articleTypes.map((type) => (
                <TypeRadio key={type.value} {...type}>
                  {field.state.value === type.value && (
                    <motion.span
                      layoutId="bubble"
                      className="absolute inset-0 z-10 bg-sky-600 rounded-md transition-colors"
                      transition={{
                        type: "spring",
                        bounce: 0.4,
                        duration: 0.4,
                      }}
                    />
                  )}
                </TypeRadio>
              ))}
              <FieldError message={field.state.meta.errors[0]?.message} />
            </RadioGroup>
          )}
        />
      </div>
    );
  },
});

const InitialInfo = withForm({
  ...formOpts,

  render: ({ form }) => {
    const trpc = useTRPC();
    const type = useStore(form.store, (s) => s.values.type.type);
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
          title="Now let's get the basics..."
          description="Give us your vision for a title and a description, and most importantly, a link to your article! Please note that all of this will be worked on during the editing process."
        />
        <RenderIfNotExcluded type={type} name="initial.name">
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
        </RenderIfNotExcluded>
        <RenderIfNotExcluded name="initial.description" type={type}>
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
        </RenderIfNotExcluded>
        <RenderIfNotExcluded name="initial.docsUrl" type={type}>
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
        </RenderIfNotExcluded>

        <RenderIfNotExcluded name="initial.collaborators" type={type}>
          <form.AppField
            name="initial.collaborators"
            children={(field) => (
              <MultiSelect
                selectedKeys={field.state.value}
                setSelectedKeys={field.setValue}
              >
                <Label>Collaborators</Label>
                <p className="text-sm text-neutral-600 mb-2">
                  If you worked with anyone else on this article, please add
                  them here. If you do not see them in this list, they have not
                  yet registered with The Bay Gull.
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
        </RenderIfNotExcluded>
      </div>
    );
  },
});

const CoverImage = withForm({
  ...formOpts,
  render: ({ form }) => {
    const type = useStore(form.store, (s) => s.values.type.type);

    return (
      <div>
        <FormSectionHeading
          title="Now let's add a cover image..."
          description="Add a cover image to add some visual intrigue to your article! If you don't have an image, feel free to ask (nicely) in the art team for some art! If you would like to submit without a cover image, you can skip this step."
        />
        <RenderIfNotExcluded type={type} name="imgs.media">
          <form.AppField
            name="imgs.media"
            validators={{
              onChange: ({ value }) => {
                if (value.length === 0) return false;
                if (value.length > 1) return false;

                const [image] = value;
                return image.size > 1024 * 1000 * 4;
              },
            }}
            children={(field) => (
              <field.ImageUploadField
                maxSize={1_024 * 4 * 1_000}
                files={field.state.value}
                setFiles={field.setValue}
              />
            )}
          />
        </RenderIfNotExcluded>
      </div>
    );
    // }
  },
});

const GraphicImages = withForm({
  ...formOpts,
  render: ({ form }) => {
    const type = useStore(form.store, (s) => s.values.type.type);

    return (
      <div>
        <FormSectionHeading
          title="Now upload your graphics..."
          description="You can upload the images you would like to be used for your graphic article below. Our editing team will work with you to decide how the images will be presented during the publishing process."
        />
        <RenderIfNotExcluded name="imgs.media" type={type}>
          <form.AppField
            name="imgs.media"
            validators={{
              onChange: ({ value }) => {
                if (value.length === 0) return true;

                const totalSize = value.reduce(
                  (acc, curr) => acc + curr.size,
                  0
                );
                return totalSize > 1024 * 1000 * 20;
              },
            }}
            children={(field) => (
              <field.ImageUploadField
                maxSize={1_024 * 20 * 1_000}
                files={field.state.value}
                setFiles={field.setValue}
                allowMultiple
              />
            )}
          />
        </RenderIfNotExcluded>
      </div>
    );
  },
});

const AdditionalInfoForm = withForm({
  ...formOpts,
  render: ({ form }) => {
    const type = useStore(form.store, (s) => s.values.type.type);

    return (
      <div className="flex flex-col gap-3">
        <FormSectionHeading
          title="One last step..."
          description="Please tell us a little bit about the message that   you wanted to portray with your article. These are the ideas that our editing team will try to ensure your article conveys well so we'd appreciate it if you took your time with this section!"
        />
        <RenderIfNotExcluded type={type} name="additionalInfo.keyIdeas">
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
        </RenderIfNotExcluded>

        <RenderIfNotExcluded type={type} name="additionalInfo.message">
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
        </RenderIfNotExcluded>
      </div>
    );
  },
});

const FieldPreview: React.FC<
  React.PropsWithChildren<{ label: string; icon: React.ReactNode }>
> = (props) => (
  <div className="border-[0.0125rem] rounded-md pb-1 border-zinc-300">
    <div className="text-zinc-800 font-sans font-semibold text-xs bg-zinc-50 p-2 rounded-t-md shadow-sm flex items-center gap-2">
      <div className="bg-zinc-200 rounded-sm p-1">{props.icon}</div>
      <p>{props.label}</p>
    </div>
    {props.children}
  </div>
);

const PreviewForm = withForm({
  ...formOpts,
  render: ({ form }) => {
    const data = useStore(form.store, (s) => s.values);
    const type = useStore(form.store, (s) => s.values.type.type);

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
            <RenderIfNotExcluded type={type} name="initial.name">
              <FieldPreview label="Name" icon={<TextIcon />}>
                <p className="text-zinc-700 text-sm px-3 my-1 wrap-break-word">
                  {data.initial.name}
                </p>
              </FieldPreview>
            </RenderIfNotExcluded>
            <RenderIfNotExcluded type={type} name="initial.description">
              <FieldPreview label="Description" icon={<TextIcon />}>
                <p className="text-zinc-700 text-sm px-3 my-1 wrap-break-word">
                  {data.initial.description}
                </p>
              </FieldPreview>
            </RenderIfNotExcluded>
            <RenderIfNotExcluded type={type} name="initial.docsUrl">
              <FieldPreview label="Google Doc Link" icon={<LinkIcon />}>
                <a
                  href={`https://docs.google.com/document/d/${data.initial.docId}/preview`}
                  target="_blank"
                  className="group"
                >
                  <div className="flex items-center justify-between gap-2 px-3 my-2">
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
            </RenderIfNotExcluded>

            <RenderIfNotExcluded type={type} name="initial.collaborators">
              {data.initial.collaborators.size > 0 && (
                <FieldPreview label="Collaborators" icon={<PeopleIcon />}>
                  <div className="flex flex-row gap-2 my-2.5 mx-2">
                    {usersQuery.data
                      ?.filter((user) =>
                        data.initial.collaborators.has(user.id)
                      )
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
            </RenderIfNotExcluded>
            <RenderIfNotExcluded type={type} name="imgs.media">
              {data.imgs.media.length > 0 && (
                <FieldPreview label="Cover Image" icon={<PhotoIcon />}>
                  {data.imgs.media.map((img) => (
                    <div className="flex items-center gap-2 px-3 py-4">
                      <img
                        src={URL.createObjectURL(img)}
                        alt="Cover Image"
                        className="h-16 aspect-video rounded-md object-scale-down"
                      />
                      <div className="flex flex-col gap-0">
                        <p className="font-medium text-neutral-800 text-sm">
                          {img.name}
                        </p>
                        <p className="text-neutral-600 text-xs">
                          {formatBytes(img.size, 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </FieldPreview>
              )}
            </RenderIfNotExcluded>

            <RenderIfNotExcluded type={type} name="additionalInfo.keyIdeas">
              <FieldPreview label="Key Ideas" icon={<TextIcon />}>
                <p className="text-zinc-700 text-sm px-3 my-1 wrap-break-word">
                  {data.additionalInfo.keyIdeas}
                </p>
              </FieldPreview>
            </RenderIfNotExcluded>
            <RenderIfNotExcluded type={type} name="additionalInfo.message">
              <FieldPreview label="Message" icon={<TextIcon />}>
                <p className="text-zinc-700 text-sm px-3 my-1 wrap-break-word">
                  {data.additionalInfo.message}
                </p>
              </FieldPreview>
            </RenderIfNotExcluded>
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
      const media = await startUpload(value.imgs.media);
      if (!media) throw new Error("Image Upload Failed!");

      await submit.mutateAsync({
        title: value.initial.name,
        type: value.type.type,
        description: value.initial.description,
        keyIdeas: value.additionalInfo.keyIdeas,
        message: value.additionalInfo.message,
        docId: value.initial.docId,
        collaborators: [...(value.initial.collaborators as Set<string>)],
        media: media.map((m) => ({
          size: m.size,
          url: m.ufsUrl,
        })),
      });
    },
  });

  const type = useStore(form.store, (s) => s.values.type.type);

  useEffect(() => {
    const mediaField = form.getFieldInfo("imgs.media");
    if (!mediaField.instance) return;

    if (!mediaField.instance.getMeta().isValid) {
      form.resetField("imgs.media");
    }
  }, [type]);

  const next = async () => {
    if (steps[multiStepControl.step] === "splash")
      return multiStepControl.moveForward();
    if (steps[multiStepControl.step] === "preview") return form.handleSubmit();

    const fieldData = Object.keys(defaultValues[steps[multiStepControl.step]])
      .map((field) => `${steps[multiStepControl.step]}.${field}`)
      .filter((field) => !excludedFieldsByType[type].includes(field))
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
        {steps[multiStepControl.step] === "type" && <Type form={form} />}
        {steps[multiStepControl.step] === "initial" && (
          <InitialInfo form={form} />
        )}
        {steps[multiStepControl.step] === "imgs" &&
          (type === "graphic" ? (
            <GraphicImages form={form} />
          ) : (
            <CoverImage form={form} />
          ))}
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
            state.values.imgs.media,
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
              {steps[multiStepControl.step] === "imgs" &&
              coverImg.length === 0 &&
              type !== "graphic"
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
          <div className="text-emerald-600 border-4 rounded-full p-2 flex items-center justify-center">
            <AnimatedCheckIcon className="size-16" />
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
