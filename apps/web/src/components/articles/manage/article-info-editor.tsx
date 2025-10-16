import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import React, { Suspense, useMemo, useState } from "react";
import { Key, RadioGroup, TextField } from "@baygull/ui/aria";
import slugify from "slugify";
import { z } from "zod";
import { AnimatedCheckIcon, AnimatedXMarkIcon } from "~/components/ui/icons";
import { ClockIcon, InfoIcon } from "@baygull/ui/icons";
import { Input } from "@baygull/ui/input";
import { Label } from "@baygull/ui/label";
import {
  MultiSelect,
  MultiSelectBody,
  MultiSelectItem,
  MultiSelectTrigger,
} from "@baygull/ui/multi-select";
import { cn } from "@baygull/ui/cn";
import { useAppForm, withForm } from "~/lib/form";

import { FieldError } from "~/components/ui/form-field";

import { createId } from "@paralleldrive/cuid2";
import { formOptions, useStore } from "@tanstack/react-form";
import { BarLoading } from "@baygull/ui/bar-loading";
import { Button } from "@baygull/ui/button";
import { Media, mediaSchema } from "~/components/ui/file-upload";
import { SelectItem } from "@baygull/ui/select";
import { Switch } from "@baygull/ui/switch";
import { useDraft } from "~/lib/articles/use-draft";
import { useTRPC, useTRPCClient } from "~/lib/trpc-client";
import { useUploadThing } from "~/lib/uploadthing-client";
import { ArticleTypeRadio, TArticleType } from "../article-type-radio";
import { CollaboratorMultiSelect } from "../collaborator-multi-select";
import { asUTCDate } from "~/lib/as-utc-date";

const TOPIC_CREATE_KEY = "__topic_create_key";
const MUTATION_SCOPE_ID = "__article_info_editor_mutation";

const formOpts = formOptions({
  defaultValues: {
    title: "",
    type: "default" as "default" | "headline" | "graphic",
    slugDerivedFromTitle: false,
    slug: "",
    coverImg: [] as Media[],
    authors: new Set<Key>(),
    topics: new Set<Key>(),
    description: "" as string | null,
  },
});

const DataDisplay: React.FC<
  React.PropsWithChildren<{
    label: string;
  }>
> = (props) => {
  return (
    <div className="bg-zinc-50 px-4 py-3 rounded-xl border-[0.0125rem] border-zinc-300/70 shadow-xs grow lg:grow-0">
      <div className="flex items-center justify-between text-zinc-800 mb-2">
        <h3 className="font-medium text-xs">{props.label}</h3>
        <InfoIcon />
      </div>
      <div className="flex flex-col gap-1">{props.children}</div>
    </div>
  );
};

const TopicSelector = withForm({
  ...formOpts,
  render: ({ form }) => {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const { data, ...draft } = useDraft();

    const { data: topics, status } = useSuspenseQuery(
      trpc.topic.getAll.queryOptions()
    );

    const displayMap = useMemo(() => {
      if (status !== "success") return undefined;

      const map = new Map<string, string>();
      topics.forEach((topic) => map.set(topic.id, topic.name));

      return map;
    }, [status]);

    const [filterString, setFilterString] = useState("");
    const matchFound = topics.some(
      (topic) => topic.name.toLowerCase() === filterString.toLowerCase().trim()
    );

    const updateTopics = useMutation(
      trpc.article.manage.updateTopics.mutationOptions({
        onMutate: () => draft.getSnapshot(),
        onSettled: async () => {
          if (!draft.shouldRefetch()) return;
          return draft.refetch();
        },
        onError: (_err, _nC, context) => {
          if (!context) return;

          queryClient.setQueryData(draft.queryKey, context);
          form.setFieldValue(
            "topics",
            new Set<Key>(data.topics.map((topic) => topic.id))
          );
        },
      })
    );

    return (
      <form.AppField
        name="topics"
        listeners={{
          onChangeDebounceMs: 300,
          onChange: ({ value }) => {
            updateTopics.mutate({
              id: data.id,
              topics: ([...value] as string[]).map((id) => ({
                id,
                name: displayMap?.get(id) ?? "",
              })),
            });
          },
        }}
        children={(field) => (
          <MultiSelect
            selectedKeys={field.state.value}
            setSelectedKeys={field.setValue}
          >
            <div className="flex items-center gap-2 justify-between mb-1">
              <Label>Topics</Label>
            </div>
            <MultiSelectTrigger
              keyDisplayMap={displayMap}
              btnProps={{
                placeholder: "Add Topics...",
                isDisabled: data.status === "archived",
              }}
            >
              <MultiSelectBody
                onSelectionChange={({ keys, setSelectedKeys }) => {
                  if (typeof keys === "string")
                    throw new Error("Invalid Selection State!");

                  if (keys.has(TOPIC_CREATE_KEY)) {
                    const id = createId();
                    queryClient.setQueryData(
                      trpc.topic.getAll.queryKey(),
                      (old) =>
                        old
                          ? [
                              ...old,
                              {
                                id,
                                name: filterString,
                              },
                            ]
                          : []
                    );

                    displayMap?.set(id, filterString);

                    keys.delete(TOPIC_CREATE_KEY);
                    keys.add(id);
                    setSelectedKeys(keys);

                    setFilterString("");
                  } else {
                    setSelectedKeys(keys);
                  }
                }}
                autoCompleteProps={{
                  inputValue: filterString,
                  onInputChange: setFilterString,
                }}
              >
                {topics.map((topic) => (
                  <MultiSelectItem
                    value={topic.id}
                    key={topic.id}
                    id={topic.id}
                    textValue={topic.name}
                  >
                    <p className="text-xs font-medium">{topic.name}</p>
                  </MultiSelectItem>
                ))}
                {!matchFound && filterString.length > 0 && (
                  <SelectItem
                    textValue={filterString}
                    id={TOPIC_CREATE_KEY}
                    key={TOPIC_CREATE_KEY}
                  >
                    <p className="text-xs font-medium">
                      Create New Topic: {filterString}
                    </p>
                  </SelectItem>
                )}
              </MultiSelectBody>
            </MultiSelectTrigger>
          </MultiSelect>
        )}
      />
    );
  },
});

const InfoForm: React.FC = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data, ...draft } = useDraft();

  const hostQuery = useQuery({
    queryKey: ["window-host"],
    queryFn: () => window.location.protocol + "//" + window.location.host,
    retry: false,
  });

  const form = useAppForm({
    defaultValues: {
      title: data.title,
      type: data.type,
      slugDerivedFromTitle: data.deriveSlugFromTitle,
      slug: data.slug,
      coverImg: (data.coverImg
        ? [
            {
              file: data.coverImg,
              __type: "uploaded-media",
            },
          ]
        : []) as Media[],
      authors: new Set<Key>(data.users.map((user) => user.id)),
      topics: new Set<Key>(data.topics.map((topic) => topic.id)),
      description: data.type !== "headline" ? data.description : null,
    },
    listeners: {
      onChangeDebounceMs: 1_000,
      onChange: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.article.manage.getAll.queryKey({ status: "draft" }),
        });
      },
    },
  });

  const updateType = useMutation(
    trpc.article.manage.updateType.mutationOptions({
      scope: {
        id: MUTATION_SCOPE_ID,
      },
      onMutate: async (newType) => {
        await draft.cancelQueries();

        const previousData = draft.getSnapshot();

        queryClient.setQueryData(draft.queryKey, (previousData) => {
          if (previousData === undefined) return undefined;

          if (newType.type === "default") {
            return {
              ...previousData,
              content: {
                articleId: "",
                description:
                  previousData.type === "graphic"
                    ? previousData.content.description
                    : "",
                type: "json" as const,
                content: "",
                isSynced: false,
                syncDisabledAt: null,

                editingUrl: "",
                originalUrl: "",
              },
              type: newType.type,
            };
          } else if (newType.type === "graphic") {
            return {
              ...previousData,
              type: newType.type,
              content: {
                articleId: "",
                description:
                  previousData.type === "default"
                    ? previousData.content.description
                    : "",
                content: [],
              },
            };
          } else if (newType.type === "headline") {
            return {
              ...previousData,
              type: newType.type,
            };
          }
        });

        return previousData;
      },
      onError: (_err, _nT, context) => {
        if (!context) return;

        queryClient.setQueryData(draft.queryKey, context);
        form.setFieldValue("type", context.type);
      },
      onSettled: async () => {
        if (!draft.shouldRefetch()) return;

        return draft.refetch();
      },
    })
  );

  const updateTitle = useMutation(
    trpc.article.manage.updateTitle.mutationOptions({
      scope: {
        id: MUTATION_SCOPE_ID,
      },
      onMutate: async (newTitle) => {
        await draft.cancelQueries();

        const previousData = draft.getSnapshot();

        if (!newTitle.deriveSlug) {
          queryClient.setQueryData(draft.queryKey, (prev) =>
            prev ? { ...prev, title: newTitle.title } : undefined
          );
        } else {
          const derivedSlug = slugify(newTitle.title, {
            lower: true,
            trim: true,
            strict: true,
          });

          queryClient.setQueryData(draft.queryKey, (prev) => {
            if (!prev) return undefined;

            return {
              ...prev,
              title: newTitle.title,
              slug: derivedSlug,
            };
          });

          form.validateField("slug", "change");
          form.setFieldValue("slug", derivedSlug);
        }

        return previousData;
      },
      onError: (_err, newTitle, context) => {
        if (!context) return;

        const deriveSlugFromTitle = form.getFieldValue("slugDerivedFromTitle");
        const slug = form.getFieldValue("slug");

        // if sync is on currently, roll back because slug = deriveSlug(title)
        if (
          deriveSlugFromTitle ||
          slug ===
            slugify(newTitle.title, { lower: true, strict: true, trim: true })
        ) {
          // rollback everything
          queryClient.setQueryData(draft.queryKey, context);

          form.setFieldValue("title", context.title);

          form.validateField("slug", "change");
          form.setFieldValue("slug", context.slug);
        } else {
          // don't roll back the slug
          queryClient.setQueryData(draft.queryKey, {
            ...context,
            slug,
          });

          form.setFieldValue("title", context.title);
        }
      },
      onSettled: async () => {
        if (!draft.shouldRefetch()) return;

        const refetchResult = await draft.refetch();
        if (!refetchResult.data) return;

        if (refetchResult.data.deriveSlugFromTitle) {
          form.validateField("slug", "change");

          form.setFieldValue("slug", refetchResult.data.slug);
        }
      },
    })
  );

  const updateSlug = useMutation(
    trpc.article.manage.updateSlug.mutationOptions({
      scope: { id: MUTATION_SCOPE_ID },
      onMutate: async (slugData) => {
        await draft.cancelQueries();

        const previousData = await draft.getSnapshot();
        if (!previousData) return;

        if (slugData.data.deriveFromTitle) {
          const slug = slugify(previousData.title, {
            lower: true,
            strict: true,
            trim: true,
          });

          if (slug !== previousData.slug) {
            queryClient.setQueryData(draft.queryKey, (prev) => {
              if (!prev) return;

              return {
                ...prev,
                slug,
              };
            });

            form.validateField("slug", "change");
            form.setFieldValue("slug", slug);
          }
        }

        return previousData;
      },
      onError: (_err, _nT, context) => {
        if (!context) return;

        queryClient.setQueryData(draft.queryKey, context);
        form.setFieldValue("slugDerivedFromTitle", context.deriveSlugFromTitle);
        form.setFieldValue("slug", context.slug);
      },
      onSettled: async () => {
        if (!draft.shouldRefetch()) return;

        const refetchResult = await draft.refetch();
        if (!refetchResult.data) return;

        if (refetchResult.data.deriveSlugFromTitle) {
          form.validateField("slug", "change");
          form.setFieldValue("slug", refetchResult.data.slug);
        }
      },
    })
  );

  const updateDescription = useMutation(
    trpc.article.manage.updateDescription.mutationOptions({
      onMutate: async (descData) => {
        await draft.cancelQueries();

        const previousData = await draft.getSnapshot();
        if (!previousData) return;

        queryClient.setQueryData(draft.queryKey, (prev) => {
          if (!prev) return;

          return {
            ...prev,
            description: descData.description,
          };
        });

        return previousData;
      },
      onError: (_err, _nT, context) => {
        if (!context) return;

        queryClient.setQueryData(draft.queryKey, context);
        form.setFieldValue(
          "description",
          context.type !== "headline" ? context.description : ""
        );
      },
      onSettled: async () => {
        if (!draft.shouldRefetch()) return;

        return draft.refetch();
      },
    })
  );

  const updateAuthors = useMutation(
    trpc.article.manage.updateAuthors.mutationOptions({
      onMutate: () => draft.getSnapshot(),
      onSettled: async () => {
        if (!draft.shouldRefetch()) return;

        return draft.refetch();
      },
      onError: (_err, _nC, context) => {
        if (!context) return;

        queryClient.setQueryData(draft.queryKey, context);
        form.setFieldValue(
          "authors",
          new Set<Key>(data.users.map((user) => user.id))
        );
      },
    })
  );

  const trpcClient = useTRPCClient();

  const updateCoverImg = useMutation({
    mutationKey: trpc.article.manage.updateCoverImage.mutationKey(),
    mutationFn: async ({
      file,
      id,
    }: {
      id: string;
      file: File | null | undefined;
    }) => {
      if (!file) {
        await trpcClient.article.manage.updateCoverImage.mutate({
          id,
          data: {
            action: "delete",
          },
        });
      } else {
        const uploadResult = await startUpload([file]);
        if (!uploadResult) throw new Error("Upload failed!");

        const [uploadedFile] = uploadResult;
        if (!uploadedFile) throw new Error("Upload Failed!");

        await trpcClient.article.manage.updateCoverImage.mutate({
          id,
          data: {
            action: "add",
            fileName: uploadedFile.name,
            mimeType: uploadedFile.type,
            size: uploadedFile.size,
            url: uploadedFile.ufsUrl,
            ufsId: uploadedFile.key,
          },
        });
      }
    },
    onMutate: () => draft.getSnapshot(),
    onError: (_err, _nC, context) => {
      if (!context) return;

      queryClient.setQueryData(draft.queryKey, context);
      form.setFieldValue(
        "coverImg",
        context.coverImg
          ? [
              {
                __type: "uploaded-media",
                file: context.coverImg,
              },
            ]
          : []
      );
    },
    onSettled: async () => {
      if (!draft.shouldRefetch()) return;
      return draft.refetch();
    },
  });
  const { startUpload } = useUploadThing("imageUploader");

  const slug = useStore(form.store, (s) => s.values.slug);
  const validateSlug = useQuery(
    trpc.article.manage.validateSlug.queryOptions(
      {
        id: data.id,
        slug,
      },
      {
        enabled: false,
        retry: false,
      }
    )
  );

  return (
    <div className="flex-1/4 flex flex-col gap-4 lg:max-w-lg xl:max-w-2xl">
      <form.AppField
        name="type"
        validators={{
          onChange: z.enum(["default", "headline", "graphic"], {
            message: "Please select what kind of article you are submitting",
          }),
        }}
        listeners={{
          onChangeDebounceMs: 300,
          onChange: ({ value }) => {
            updateType.mutate({
              id: data.id,
              type: value,
            });
          },
        }}
        children={(field) => (
          <RadioGroup
            isDisabled={data.status !== "draft"}
            aria-label="Article Type Radio"
            onChange={(value) => field.handleChange(value as TArticleType)}
            onBlur={field.handleBlur}
            value={field.state.value}
          >
            <Label>Type</Label>
            <p className="text-xs text-neutral-600 mb-2">
              The article type determines the format and content of the article.
              Changing the type of the article is not a lossy operation. Any
              data associated with the current article type will be persisted
              and restored if the article type is reverted.
            </p>
            <div className="flex gap-2 bg-zinc-a50 rounded-md shadow-sxs border-a[0.0125rem] bordera-zinc-300/70 text-sm">
              <ArticleTypeRadio
                isSelected={(value) => field.state.value === value}
                isCollpased
              />
            </div>
            {field.state.meta.errors.length > 0 && (
              <FieldError message={field.state.meta.errors[0]?.message} />
            )}
          </RadioGroup>
        )}
      />
      <form.AppField
        name="title"
        listeners={{
          onChangeDebounceMs: 300,
          onChange: ({ value, fieldApi }) => {
            if (fieldApi.getMeta().isValid && value !== data.title) {
              updateTitle.mutate({
                id: data.id,
                title: value,
                deriveSlug: fieldApi.form.getFieldValue("slugDerivedFromTitle"),
              });
            }
          },
        }}
        validators={{
          onChange: z.string().min(1, { message: "Title cannot be empty!" }),
        }}
        children={(field) => (
          <field.TextField
            label="Title"
            isTextArea={false}
            isDisabled={data.status === "archived"}
          />
        )}
      />
      <form.Subscribe
        selector={(s) => [s.values.slugDerivedFromTitle] as const}
        children={([deriveSlugFromTitle]) => (
          <form.AppField
            name="slug"
            validators={{
              onChange: z.string().min(1, { message: "Slug cannot be empty!" }),
              onChangeAsync: async (field) => {
                const errors = await field.fieldApi.parseValueWithSchemaAsync(
                  z.string().refine(
                    async (val) => {
                      if (val !== "") {
                        const data = await validateSlug.refetch();

                        return !data.isError;
                      }
                    },
                    {
                      message: "That slug is taken!",
                    }
                  )
                );

                if (errors) return errors;
              },
            }}
            asyncDebounceMs={1_000}
            listeners={{
              onChangeDebounceMs: 300,
              onChange: async ({ value, fieldApi }) => {
                const validationResult = await fieldApi.validate("change");
                if (validationResult.length > 0) return;

                if (fieldApi.getMeta().isValid) {
                  updateSlug.mutate({
                    id: data.id,
                    data: {
                      deriveFromTitle: deriveSlugFromTitle,
                      slug: value,
                    },
                  });
                }
              },
            }}
            children={(field) => (
              <TextField
                isDisabled={deriveSlugFromTitle || data.status === "archived"}
                isInvalid={field.getMeta().errors.length > 0}
                value={field.state.value}
                onChange={(value) => {
                  field.handleChange(
                    slugify(value, {
                      lower: true,
                      strict: true,
                      trim: false,
                    })
                  );
                }}
                onBlur={field.handleBlur}
              >
                <Label>Slug</Label>
                <p className="text-xs text-neutral-600 mb-2">
                  The article slug is used to identify the URL that the article
                  will be displayed at. Please note that most special characters
                  are not allowed in URLs and as such cannot be contained in the
                  slug.
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    fullWidth
                    leadingVisual={
                      hostQuery.isSuccess && (
                        <p className="text-xs select-none text-zinc-700 opacity-50 group-disabled:!opacity-100">
                          {hostQuery.data}/articles/
                        </p>
                      )
                    }
                  />
                  {field.state.meta.isDirty && !deriveSlugFromTitle && (
                    <Button
                      variant="outline"
                      onPress={() =>
                        field.setMeta((m) => ({
                          ...m,
                          isBlurred: false,
                        }))
                      }
                      isCircular={false}
                    >
                      <div className="flex items-center gap-2 text-neutral-700">
                        {field.state.meta.isValidating ||
                        (validateSlug.isPending && field.state.meta.isValid) ? (
                          <BarLoading />
                        ) : validateSlug.isSuccess ? (
                          <AnimatedCheckIcon className="size-4 text-sky-600" />
                        ) : (
                          <AnimatedXMarkIcon className="size-4 text-rose-600" />
                        )}
                      </div>
                    </Button>
                  )}
                </div>
                {field
                  .getMeta()
                  .errors.filter((err) => !!err)
                  .map(({ message }: { message: string }) => (
                    <FieldError key={message} message={message} />
                  ))}
                <div className="mt-2">
                  <form.AppField
                    name="slugDerivedFromTitle"
                    listeners={{
                      onChangeDebounceMs: 300,
                      onChange: ({ value }) => {
                        updateSlug.mutate({
                          id: data.id,
                          data: {
                            deriveFromTitle: value,
                          },
                        });
                      },
                    }}
                    children={(field) => (
                      <Switch
                        isSelected={field.state.value}
                        onChange={field.handleChange}
                        isDisabled={data.status === "archived"}
                      >
                        <p className="text-xs text-neutral-700 font-medium mt-[1px]">
                          Sync with Title
                        </p>
                      </Switch>
                    )}
                  />
                </div>
              </TextField>
            )}
          />
        )}
      />

      {data.type !== "headline" && (
        <form.AppField
          name="description"
          validators={{
            onChange: z.string(),
          }}
          listeners={{
            onChangeDebounceMs: 300,
            onChange: ({ fieldApi, value }) => {
              if (fieldApi.getMeta().isValid) {
                updateDescription.mutate({
                  id: data.id,
                  type: data.type,
                  description: value!,
                });
              }
            },
          }}
          children={(field) => (
            <field.TextField
              label="Description"
              isTextArea
              isDisabled={data.status === "archived"}
            />
          )}
        />
      )}
      {data.type !== "graphic" && (
        <form.AppField
          name="coverImg"
          validators={{
            onChange: z
              .array(mediaSchema)
              .max(1, {
                message: "Articles can only have one cover image!",
              })
              .refine(
                ([file]) => {
                  if (!file) return true;
                  return file.file.size <= 1024 * 1000 * 4;
                },
                {
                  message: "Cover image size cannot exceed 4MB.",
                }
              ),
          }}
          listeners={{
            onChangeDebounceMs: 300,
            onChange: async ({ value, fieldApi }) => {
              if (!fieldApi.getMeta().isValid) return;
              const file = value.filter((m) => m.__type === "file")[0]?.file;

              updateCoverImg.mutate({
                id: data.id,
                file: value.length === 0 ? null : file,
              });
            },
          }}
          children={(field) => (
            <field.ImageUploadField
              label="Cover Image"
              isDisabled={data.status === "archived"}
              maxSize={1_024 * 1_000 * 4}
              files={field.state.value}
              setFiles={field.handleChange}
            />
          )}
        />
      )}
      <form.AppField
        name="authors"
        validators={{
          onChange: z
            .set(z.string())
            .nonempty({ message: "Article must have at least one author!" }),
        }}
        listeners={{
          onChangeDebounceMs: 300,
          onChange: ({ value, fieldApi }) => {
            if (fieldApi.getMeta().isValid) {
              updateAuthors.mutate({
                id: data.id,
                authors: [...value] as [string],
              });
            }
          },
        }}
        children={(field) => (
          <MultiSelect
            selectedKeys={field.state.value}
            setSelectedKeys={field.setValue}
          >
            <Label>Authors</Label>
            <CollaboratorMultiSelect
              includeMe
              isInvalid={!field.state.meta.isValid}
              isDisabled={data.status === "archived"}
            />
            {field
              .getMeta()
              .errors.filter((err) => !!err)
              .map(({ message }: { message: string }) => (
                <FieldError message={message} />
              ))}
          </MultiSelect>
        )}
      />
      <Suspense fallback={<p>Loading...</p>}>
        <TopicSelector form={form} />
      </Suspense>
    </div>
  );
};

const DateDisplay: React.FC<{
  label: string;
  date: string;
}> = (props) => (
  <div className="flex text-xs justify-between flex-row gap-12 w-full min-w-max">
    <p className="font-medium text-zinc-500">{props.label}</p>
    <div className="flex items-center gap-1 text-xs text-zinc-500">
      <ClockIcon />
      <p className="font-mono">
        {asUTCDate(props.date).toLocaleTimeString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })}
      </p>
    </div>
  </div>
);

export const ArticleInfoEditor = () => {
  const { data } = useDraft();

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row lg:gap-8">
      <InfoForm />
      <div
        className={cn(
          "flex-[1] flex gap-4 overflow-x-auto lg:overflow-x-visible lg:flex-col",
          data.status === "archived" && "opacity-60 cursor-not-allowed"
        )}
      >
        <DataDisplay label="Key Ideas">
          <p className="text-sm text-zinc-500 w-max max-w-[48ch] lg:w-fit">
            {data.keyIdeas}
          </p>
        </DataDisplay>
        <DataDisplay label="Message">
          <p className="text-sm text-zinc-500 w-max max-w-[48ch] lg:w-fit">
            {data.message}
          </p>
        </DataDisplay>
      </div>
    </div>
  );
};
