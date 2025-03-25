import {
  queryOptions,
  useQuery,
  useSuspenseQuery
} from "@tanstack/react-query";
import { useEffect } from "react";
import { TextField } from "react-aria-components";
import { Controller } from "react-hook-form";
import slugify from "slugify";
import { z } from "zod";
import { useArticlePublishFormStore } from "~/lib/articles/article-publish-store";
import { formatBytes } from "~/lib/format-bytes";
import { useZodForm } from "~/lib/hooks/use-zod-form";
import { useTRPC } from "~/lib/trpc/client";
import { useUploadThing } from "~/lib/uploadthing/client";
import { ClientOnly } from "../client-only";
import { useMultiStepForm } from "../ui/animated-multistep-form";
import { Button } from "../ui/button";
import { FieldError } from "../ui/field-error";
import { FileUpload } from "../ui/file-upload";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  TrashIcon,
} from "../ui/icons";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { RemirrorEditor } from "../ui/markdown-editor";
import { TextArea } from "../ui/textarea";

const fetchCoverImgQuery = (
  articleName: string,
  coverImg: string | File | null
) =>
  queryOptions({
    queryKey: ["article-fetch-cover-img", coverImg],
    queryFn: async () => {
      if (coverImg === null || typeof coverImg !== "string") return coverImg;

      const blob = await fetch(coverImg).then((res) => res.blob());

      return new File([blob], `${articleName}-cover-img`);
    },
  });

export const ArticlePublishForm: React.FC = () => {
  const { step } = useArticlePublishFormStore((s) => s);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex justify-between items-center p-4 rounded-md border-[0.0125rem] border-zinc-300 shadow-xs">
        <p>Publish Article Nirjhor Nath</p>
        <div className="space-x-2 flex items-center">
          <Button variant="secondary" leadingVisual={<EyeIcon />}>
            Preview
          </Button>
          <Button>Publish</Button>
        </div>
      </div>
      <div className="flex gap-8 flex-col lg:flex-row">
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-zinc-50/40 border-[0.0125rem] border-zinc-100 shadow-xs p-6 rounded-md">
            <InfoForm />
          </div>
          <CoverImageForm />
        </div>
        <div className="flex-1">
          <ContentForm />
        </div>
      </div>
    </div>
    // <MultiStepForm>
    //   {step === 0 && <InfoForm />}
    //   {step === 1 && <CoverImageForm />}
    //   {step === 2 && <ContentForm />}
    //   {step === 3 && <PreviewForm />}
    // </MultiStepForm>
  );
};

function InfoForm() {
  const trpc = useTRPC();
  const { incrementStep, submitInfo, name, description, coverImg } =
    useArticlePublishFormStore((s) => s);
  // const { moveForward } = useMultiStepForm();
  const coverImgQuery = useQuery(fetchCoverImgQuery(name, coverImg));
  const topicsQuery = useSuspenseQuery(trpc.topic.getAll.queryOptions());

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
      slug: z
        .string()
        .min(1, "The slug cannot be empty!")
        .refine(
          (val) => {
            return val !== "submit" && val !== "publish";
          },
          {
            message: "That is a restricted path, please provide another slug!",
          }
        ),
      // topics: z.set(z.string()),
    }),
    defaultValues: {
      name: name,
      description: description,
      slug: slugify(name, {
        lower: true,
        strict: true,
        trim: true,
      }),
      // topics: new Set<Key>(),
    },
  });

  useEffect(() => {
    const { unsubscribe } = form.watch((values, { name }) => {
      if (name !== "name") return;

      if (values.name !== undefined && !form.getFieldState("slug").isDirty) {
        form.setValue(
          "slug",
          slugify(values.name, {
            lower: true,
            strict: true,
            trim: true,
          })
        );
      }
    });
    return () => unsubscribe();
  }, [form.watch]);

  return (
    <div>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit((data) => {
          // moveForward(() => {
          // console.log(data.topics);
          submitInfo(data);
          incrementStep();
          // });
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
          name="slug"
          render={({ field, formState }) => (
            <TextField
              isInvalid={!!formState.errors.slug}
              {...field}
              onChange={(val) => {
                field.onChange(
                  slugify(val, {
                    lower: true,
                    strict: true,
                    trim: false,
                  })
                );
              }}
            >
              <Label>Article Slug</Label>
              <Input fullWidth />
              {formState.errors.slug && (
                <FieldError message={formState.errors.slug.message} />
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
        {/* <Controller
          control={form.control}
          name="topics"
          render={({ field }) => (
            <MultiSelect
              selectedKeys={field.value}
              setSelectedKeys={field.onChange}
            >
              <Label>Article Topics</Label>

              <MultiSelectTrigger>
                <MultiSelectBody>
                  {topicsQuery.data.map((topic) => (
                    <MultiSelectItem
                      textValue={topic.name}
                      id={topic.name}
                      key={topic.id}
                    >
                      {topic.name}
                    </MultiSelectItem>
                  ))}
                </MultiSelectBody>
              </MultiSelectTrigger>
            </MultiSelect>
          )}
        /> */}
        {/* <div className="self-end">
          <Button
            type="submit"
            trailingVisual={<ChevronRightIcon />}
            isDisabled={coverImgQuery.isLoading}
          >
            Next
          </Button>
        </div> */}
      </form>
    </div>
  );
}

function ContentForm() {
  const incrementStep = useArticlePublishFormStore((s) => s.incrementStep);
  const decrementStep = useArticlePublishFormStore((s) => s.decrementStep);
  const content = useArticlePublishFormStore((s) => s.content);
  const setContent = useArticlePublishFormStore((s) => s.setContent);

  return (
    <div>
      {/* <div className="mb-8 flex flex-col gap-1 border-b py-4 border-b-neutral-300">
        <h1 className="text-4xl font-bold text-neutral-800">Article Content</h1>
        <p className="text-neutral-700">
          Make any final changes to the article content before publishing.
          Please limit these edits to alterations such as removing the article
          name, etc. Any meaningful changes should happen in the editing
          document.
        </p>
      </div> */}
      <ClientOnly>
        <RemirrorEditor
          value={content}
          setValue={(value) => setContent(value)}
        />
      </ClientOnly>
      <div className="flex items-center justify-between my-4">
        {/* <Button
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
          Next
        </Button> */}
      </div>
    </div>
  );
}

function CoverImageForm() {
  const incrementStep = useArticlePublishFormStore((s) => s.incrementStep);
  const decrementStep = useArticlePublishFormStore((s) => s.decrementStep);
  // const { moveBackward, moveForward } = useMultiStepForm();

  const name = useArticlePublishFormStore((s) => s.name);
  const coverImgRaw = useArticlePublishFormStore((s) => s.coverImg);
  const setCoverImg = useArticlePublishFormStore((s) => s.setCoverImg);

  const { data: coverImg } = useQuery(fetchCoverImgQuery(name, coverImgRaw));

  return (
    <div>
      {/* <div className="mb-8 flex flex-col gap-1 border-b py-4 border-b-neutral-300">
        <h1 className="text-4xl font-bold text-neutral-800">
          Now let's add a cover image...
        </h1>
        <p className="text-neutral-700">
          Add a cover image to add some visual intrigue to your article! If you
          don't have an image, feel free to ask (nicely) in the art team for
          some art! If you would like to submit without a cover image, you can
          skip this step.
        </p>
      </div> */}
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
      {/* <div className="flex items-center justify-between my-4">
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
      </div> */}
    </div>
  );
}

function PreviewForm() {
  const data = useArticlePublishFormStore((s) => s);
  const { moveForward, moveBackward } = useMultiStepForm();

  const { startUpload } = useUploadThing("imageUploader");

  // const publish = useMutation({
  //   mutationKey: ["article-publish"],
  //   mutationFn: async () => {
  //     let coverImgUrl: string | undefined = undefined;

  //     if (data.coverImg && typeof data.coverImg !== "string") {
  //       const uploadResult = await startUpload([data.coverImg]);

  //       if (!uploadResult) throw new Error("Image Upload Failed!");

  //       coverImgUrl = uploadResult[0].ufsUrl;
  //     }

  //     await publishArticle({
  //       data: {
  //         title: data.name,
  //         description: data.description,
  //         coverImg: coverImgUrl,
  //         content: data.content,
  //         slug: slugify(data.slug, {
  //           lower: true,
  //           strict: true,
  //           trim: true,
  //         }),
  //       },
  //     });
  //   },
  //   // onSuccess: () => moveForward(data.incrementStep),
  //   onError: (err) => {
  //     console.error(err);
  //   },
  // });

  return (
    <div className="">
      <div className="mb-8 flex flex-col gap-1 border-b py-4 border-b-neutral-300">
        <h1 className="text-4xl font-bold text-neutral-800">
          Does everything look okay?
        </h1>
        <p className="text-neutral-700">
          Below is a preview of how the published article will look. If
          everything looks okay, you can hit publish!
        </p>
      </div>
      <h2 className="text-2xl font-semibold leading-[1.4]">{data.name}</h2>
      <p className="py-4 text-lg text-neutral-700">{data.description}</p>
      <div className="flex items-center gap-3">
        <div className="flex items-center group">
          {data.users.map(({ user }) => (
            <img
              key={user.id}
              src={user.image || ""}
              width="48"
              height="48"
              className="rounded-full"
              referrerPolicy="no-referrer"
            />
          ))}
        </div>
        <p className="font-medium">
          By{" "}
          {data.users.map(({ user }) => (
            <a key={user.id} className="text-sky-700 underline">
              {user.name}
            </a>
          ))}
        </p>
      </div>
      {data.coverImg && (
        <img
          src={
            typeof data.coverImg === "string"
              ? data.coverImg
              : URL.createObjectURL(data.coverImg)
          }
          width="1600"
          height="768"
          className="my-4"
          referrerPolicy="no-referrer"
        />
      )}
      <div className="flex items-center justify-between mt-4">
        {/* <div className="flex flex-wrap gap-2">
          {article.topics.map(({ topic }) => (
            <div
              key={topic.id}
              className="p-1 px-3 border w-fit border-neutral-400 rounded-full font-sans font-medium"
            >
              <p>{topic.name}</p>
            </div>
          ))}
        </div> */}
        <p className="text-neutral-600">
          {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
            new Date()
          )}
        </p>
      </div>
      <hr className="my-4 text-neutral-300" />
      <div
        className="flex flex-col gap-4 text-lg leading-relaxed text-[#363636] pb-8 break-words ![&>img]:w-full parent"
        dangerouslySetInnerHTML={{ __html: data.content }}
      />
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
            // publish.mutate();
          }}
          trailingVisual={<ChevronRightIcon />}
          // isDisabled={publish.isPending}
        >
          Publish
        </Button>
      </div>
    </div>
  );
}
