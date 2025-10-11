import type { Alignment } from "@platejs/basic-styles";
import {
  createPlatePlugin,
  useEditorPlugin,
  useEditorRef,
  useEditorSelector,
  useEditorValue,
  useMarkToolbarButton,
  useMarkToolbarButtonState,
  useSelectionFragmentProp,
} from "platejs/react";

import { Button, ToggleButton } from "@baygull/ui/button";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  GoogleDocsIcon,
  InfoIcon,
  LinkIcon,
  LinkSlashIcon,
  PencilSquareIcon,
  TextIcon,
} from "@baygull/ui/icons";
import { Label } from "@baygull/ui/label";
import { MenuItem } from "@baygull/ui/menu";
import {
  Modal,
  ModalBody,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalHeading,
} from "@baygull/ui/modal";
import { ModalPopover } from "@baygull/ui/modal-popover";
import { Switch } from "@baygull/ui/switch";
import { Tooltip, TooltipTrigger } from "@baygull/ui/tooltip";
import { TextAlignPlugin } from "@platejs/basic-styles/react";
import {
  useLinkToolbarButton,
  useLinkToolbarButtonState,
} from "@platejs/link/react";
import { ListStyleType, someList, toggleList } from "@platejs/list";
import { insertImageFromFiles } from "@platejs/media";
import { useStore } from "@tanstack/react-form";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { motion } from "framer-motion";
import { KEYS, TElement } from "platejs";
import React, { useMemo, useState } from "react";
import {
  Button as AriaButton,
  FileTrigger,
  Key,
  Menu,
  MenuTrigger,
} from "@baygull/ui/aria";
import { z } from "zod";
import { useDefaultDraft } from "~/lib/articles/use-draft";
import { useAppForm } from "~/lib/form";
import { useDisclosure } from "~/lib/hooks/use-disclosure";
import { useTRPC } from "~/lib/trpc-client";
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  BulletedListIcon,
  H1Icon,
  H2Icon,
  H3Icon,
  ImageIcon,
  ItalicIcon,
  NumberedListIcon,
  StrikeThroughIcon,
  UnderlineIcon,
} from "./editor-icons";
import { getBlockType, setBlockType } from "./editor-transforms";
import {
  MultiStepForm,
  useMultiStepFormControl,
} from "~/components/ui/animated-multistep-form";

export function MarkToolbarButton({
  clear,
  nodeType,
  tooltip,
  ...props
}: React.ComponentProps<typeof ToggleButton> & {
  nodeType: string;
  tooltip: string;
  clear?: string[] | string;
}) {
  const state = useMarkToolbarButtonState({ clear, nodeType });
  const { props: buttonProps } = useMarkToolbarButton(state);

  return (
    <TooltipTrigger>
      <ToggleButton
        {...props}
        {...(buttonProps as any)}
        isSelected={buttonProps.pressed}
      />
      <Tooltip placement="bottom">{tooltip}</Tooltip>
    </TooltipTrigger>
  );
}

const marks = [
  {
    id: "bold-mark",
    nodeType: "bold",
    tooltip: "Bold (Cmd+B)",
    icon: <BoldIcon />,
  },
  {
    id: "italic-mark",
    nodeType: "italic",
    tooltip: "Italic (Cmd+I)",
    icon: <ItalicIcon />,
  },
  {
    id: "underline-mark",
    nodeType: "underline",
    tooltip: "Underline (Cmd+U)",
    icon: <UnderlineIcon />,
  },
  {
    id: "strikethrough-mark",
    nodeType: "strikethrough",
    tooltip: "Strike Through",
    icon: <StrikeThroughIcon />,
  },
];

const MarkButtons = () => {
  return (
    <div className="gap-1 flex items-center">
      {marks.map((mark) => (
        <MarkToolbarButton
          key={mark.id}
          nodeType={mark.nodeType}
          tooltip={mark.tooltip}
        >
          {mark.icon}
        </MarkToolbarButton>
      ))}
    </div>
  );
};

const alignments = [
  {
    id: "left",
    tooltip: "Align Left",
    icon: <AlignLeftIcon />,
  },
  {
    id: "center",
    tooltip: "Align Center",
    icon: <AlignCenterIcon />,
  },
  {
    id: "right",
    tooltip: "Align Right",
    icon: <AlignRightIcon />,
  },
  {
    id: "justify",
    tooltip: "Justify",
    icon: <AlignJustifyIcon />,
  },
];

const AlignMenu = () => {
  const { editor, tf } = useEditorPlugin(TextAlignPlugin);
  const value =
    useSelectionFragmentProp({
      defaultValue: "start",
      getProp: (node) => node.align,
    }) ?? "left";

  const icon = alignments.find((item) => item.id === value)?.icon ?? (
    <AlignLeftIcon />
  );

  const [selectedKeys, setSelectedKeys] = useState<Iterable<Key>>(
    new Set<Key>()
  );

  return (
    <MenuTrigger>
      <Button variant="ghost" size="icon" isCircular={false}>
        {icon}
      </Button>
      <ModalPopover
        popoverProps={{
          placement: "bottom",
        }}
      >
        <Menu
          className="focus:outline-none"
          selectionMode="single"
          selectedKeys={selectedKeys}
          onSelectionChange={(value) => {
            if (typeof value === "string") return;
            const [entry] = [...value];

            tf.textAlign.setNodes(entry as Alignment);
            editor.tf.focus();

            setSelectedKeys(value);
          }}
        >
          {alignments.map((alignment) => (
            <MenuItem key={`${alignment.id}-align`} id={alignment.id}>
              <TooltipTrigger>
                <AriaButton>
                  <div className="">{alignment.icon}</div>
                </AriaButton>
                <Tooltip placement="right">{alignment.tooltip}</Tooltip>
              </TooltipTrigger>
            </MenuItem>
          ))}
        </Menu>
      </ModalPopover>
    </MenuTrigger>
  );
};

const ListButtons = () => {
  const editor = useEditorRef();

  const ulSelected = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Disc,
        ListStyleType.Circle,
        ListStyleType.Square,
      ]),
    []
  );

  const olSelected = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Decimal,
        ListStyleType.LowerAlpha,
        ListStyleType.LowerRoman,
      ]),
    []
  );

  return (
    <div className="gap-1 flex items-center">
      <ToggleButton
        isSelected={ulSelected}
        onPress={() => {
          toggleList(editor, {
            listStyleType: ListStyleType.Disc,
          });

          editor.tf.focus();
        }}
      >
        <BulletedListIcon />
      </ToggleButton>
      <ToggleButton
        isSelected={olSelected}
        onPress={() => {
          toggleList(editor, {
            listStyleType: ListStyleType.Decimal,
          });

          editor.tf.focus();
        }}
      >
        <NumberedListIcon />
      </ToggleButton>
    </div>
  );
};

export function LinkToolbarButton() {
  const state = useLinkToolbarButtonState();
  const { props: buttonProps } = useLinkToolbarButton(state);

  return (
    <TooltipTrigger>
      <ToggleButton
        {...buttonProps}
        // @ts-expect-error
        onMouseDown={buttonProps.onMouseDown}
        isSelected={buttonProps.pressed}
        data-plate-focus
      >
        <LinkIcon />
      </ToggleButton>
      <Tooltip placement="bottom">Link (Cmd+K)</Tooltip>
    </TooltipTrigger>
  );
}

const textTypes = [
  {
    icon: <TextIcon />,
    keywords: ["paragraph", "normal text"],
    label: "Normal Text",
    id: KEYS.p,
  },
  {
    icon: <H1Icon />,
    keywords: ["title", "h1", "heading 1"],
    label: "Heading 1",
    id: "h1",
  },
  {
    icon: <H2Icon />,
    keywords: ["subtitle", "h2", "heading 2"],
    label: "Heading 2",
    id: "h2",
  },
  {
    icon: <H3Icon />,
    keywords: ["subtitle", "h3", "heading 3"],
    label: "Heading 3",
    id: "h3",
  },
] as const;

const TextTypeMenu = () => {
  const editor = useEditorRef();

  const [selectedKeys, setSelectedKeys] = useState<Iterable<Key>>(
    new Set<Key>()
  );

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  });

  const selectedItem = useMemo(
    () =>
      textTypes.find((item) => item.id === (value ?? KEYS.p)) ?? textTypes[0],
    [value]
  );

  return (
    <MenuTrigger>
      <Button
        variant="ghost"
        leadingVisual={selectedItem.icon}
        trailingVisual={
          <div className="ml-2">
            <ChevronDownIcon />
          </div>
        }
        isCircular={false}
      >
        {selectedItem.label}
      </Button>
      <ModalPopover
        popoverProps={{
          placement: "bottom",
        }}
      >
        <Menu
          className="focus:outline-none min-w-42"
          selectionMode="single"
          selectedKeys={selectedKeys}
          onSelectionChange={(value) => {
            if (typeof value === "string") return;
            const [entry] = [...value];

            setBlockType(editor, entry as string);

            editor.tf.focus();

            setSelectedKeys(value);
          }}
        >
          {textTypes.map((type) => (
            <MenuItem
              textValue={type.keywords.join(" ")}
              id={type.id}
              key={type.id}
            >
              <div className="flex items-center gap-2 my-1 justify-between">
                <div className="flex items-center gap-2">
                  {type.icon}
                  <p className="text-xs">{type.label}</p>
                </div>
                <ChevronRightIcon />
              </div>
            </MenuItem>
          ))}
        </Menu>
      </ModalPopover>
    </MenuTrigger>
  );
};

const ImageUploadButton = () => {
  const editor = useEditorRef();

  return (
    <FileTrigger
      allowsMultiple
      onSelect={(e) => {
        if (e === null) return;

        insertImageFromFiles(editor, e);
        editor.tf.focus();
      }}
    >
      <TooltipTrigger>
        <Button size="icon" variant="ghost" isCircular={false}>
          <ImageIcon />
        </Button>
        <Tooltip placement="bottom">Image</Tooltip>
      </TooltipTrigger>
    </FileTrigger>
  );
};

const steps = ["url", "sync"] as const;

const EditDocForm: React.FC<{
  setIsSelected: (isSelected: boolean) => void;
}> = ({ setIsSelected }) => {
  const draft = useDefaultDraft();
  const multiStepControl = useMultiStepFormControl();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateEditingUrl = useMutation(
    trpc.article.manage.updateEditingUrl.mutationOptions({
      onMutate: (newSync) => {
        multiStepControl.reset();
        setIsSelected(newSync.shouldSync);

        return draft.getSnapshot();
      },
      onError: (_err, _nS, context) => {
        if (!context) return;

        queryClient.setQueryData(draft.queryKey, context);
        setIsSelected(context.content.isSynced);
      },
      onSettled: async () => {
        await draft.refetch();

        return queryClient.invalidateQueries({
          queryKey: trpc.article.manage.getEditingDoc.queryKey(),
        });
      },
    })
  );

  const control = useDisclosure();

  const form = useAppForm({
    defaultValues: {
      url: draft.data.content.editingUrl,
      sync: draft.data.content.isSynced,
    },
    onSubmit: async ({ value }) => {
      control.close();
      updateEditingUrl.mutate({
        id: draft.data.id,
        editingUrl: value.url,
        shouldSync: value.sync,
      });
    },
  });

  const docUrl = useStore(form.store, (s) => s.values.url);

  const docQuery = useSuspenseQuery(
    trpc.article.manage.getEditingDoc.queryOptions({
      id: draft.data.id,
    })
  );

  const docInfoQuery = useQuery({
    ...trpc.article.getGoogleDocFromUrl.queryOptions({
      docUrl: docUrl,
    }),
    retry: false,
  });

  const next = async () => {
    if (steps[multiStepControl.step] === "sync") {
      form.handleSubmit();
    } else {
      if (!form.getFieldMeta("url")?.isPristine || docInfoQuery.isSuccess)
        return multiStepControl.moveForward();

      const validateResult = await form.validateField("url", "submit");

      if (validateResult.length === 0) {
        multiStepControl.moveForward();
      }
    }
  };

  return (
    <>
      <MenuTrigger>
        <Button
          leadingVisual={<GoogleDocsIcon />}
          variant="ghost"
          isCircular={false}
        >
          <div
            className={
              !draft.data.content.isSynced ? "max-w-[16ch] truncate" : ""
            }
          >
            {docQuery.data ? docQuery.data.name : "Not Linked"}
          </div>
        </Button>
        <ModalPopover
          popoverProps={{
            placement: "bottom left",
          }}
        >
          <Menu className="focus:outline-none">
            <MenuItem
              onPress={() =>
                window.open(draft.data.content.editingUrl, "_blank")
              }
            >
              <div className="flex gap-2 items-center">
                <ExternalLinkIcon />
                <p className="text-xs">Open</p>
              </div>
            </MenuItem>
            <MenuItem onPress={control.open}>
              <div className="flex gap-2 items-center">
                {!draft.data.content.editingUrl ? (
                  <LinkIcon />
                ) : (
                  <PencilSquareIcon />
                )}
                <p className="text-xs">
                  {draft.data.content.editingUrl ? "Edit" : "Link"}
                </p>
              </div>
            </MenuItem>
            {draft.data.content.editingUrl && (
              <MenuItem
                onPress={() => {
                  updateEditingUrl.mutate({
                    id: draft.data.id,
                    editingUrl: "",
                    shouldSync: false,
                  });
                }}
              >
                <div className="flex gap-2 items-center text-red-700">
                  <LinkSlashIcon />
                  <p className="text-xs">Unlink</p>
                </div>
              </MenuItem>
            )}
          </Menu>
        </ModalPopover>
      </MenuTrigger>
      <Modal
        isOpen={control.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            form.reset();
            multiStepControl.reset();
          }
          control.setOpen(open);
        }}
        size="md"
      >
        <ModalBody>
          <ModalHeader>
            <ModalHeading>Edit Linked Google Doc</ModalHeading>
          </ModalHeader>
          <div className="mb-4">
            <MultiStepForm multiStepControl={multiStepControl}>
              {steps[multiStepControl.step] === "url" && (
                <div className="">
                  <form.AppField
                    name="url"
                    validators={{
                      onChange: z.string().url({
                        message:
                          "Please provide a Google Doc URL with link sharing enabled!",
                      }),
                      onChangeAsync: async (field) => {
                        const errors =
                          await field.fieldApi.parseValueWithSchemaAsync(
                            z.string().refine(
                              async (val) => {
                                if (val !== "") {
                                  const data = await docInfoQuery.refetch();

                                  return !data.isError;
                                }
                              },
                              {
                                message:
                                  "We can't find the Google Doc you provided! Please make sure you're using a valid Google Doc link with link sharing enabled.",
                              }
                            )
                          );

                        if (errors) return errors;
                      },
                    }}
                    asyncDebounceMs={1_000}
                    children={(field) => (
                      <field.GoogleDocField
                        queryEnabledByDefault={
                          draft.data.content.editingUrl !== ""
                        }
                      />
                    )}
                  />
                </div>
              )}
              {steps[multiStepControl.step] === "sync" && (
                <div>
                  <form.AppField
                    name="sync"
                    children={(field) => (
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="doc-sync">
                          <div className="flex flex-col gap-0.5">
                            <span>Sync after Update</span>
                            <span className="text-xs font-normal">
                              Existing content will be overwritten. This action
                              is not irreversible!
                            </span>
                          </div>
                        </Label>
                        <Switch
                          id="doc-sync"
                          isSelected={field.state.value}
                          onChange={field.handleChange}
                        ></Switch>
                      </div>
                    )}
                  />
                </div>
              )}
            </MultiStepForm>
          </div>
        </ModalBody>
        <ModalFooter showCloseButton={false}>
          {steps[multiStepControl.step] === "sync" && (
            <Button onPress={multiStepControl.moveBackward} variant="ghost">
              Back
            </Button>
          )}
          <Button
            onPress={next}
            isLoading={updateEditingUrl.isPending}
            trailingVisual={
              steps[multiStepControl.step] === "url" ? (
                <ChevronRightIcon />
              ) : undefined
            }
          >
            {steps[multiStepControl.step] === "url" ? "Next" : "Update"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

const DocSync = () => {
  const draft = useDefaultDraft();

  const trpc = useTRPC();

  const docQuery = useSuspenseQuery(
    trpc.article.manage.getEditingDoc.queryOptions({
      id: draft.data.id,
    })
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isSelected, setIsSelected] = useState(draft.data.content.isSynced);

  const queryClient = useQueryClient();

  const updateDraftDefaultContent = useMutation(
    trpc.article.manage.updateDraftDefaultContent.mutationOptions({
      onSettled: () =>
        queryClient.invalidateQueries({ queryKey: draft.queryKey }),
    })
  );

  const editorValue = useEditorValue();

  const updateSync = useMutation(
    trpc.article.manage.updateDocSync.mutationOptions({
      onMutate: (newSync) => {
        setIsSelected(newSync.isSynced);

        return draft.getSnapshot();
      },
      onError: (_err, _nS, context) => {
        if (!context) return;

        queryClient.setQueryData(draft.queryKey, context);
        setIsSelected(context.content.isSynced);
      },
      onSettled: async () => {
        const result = await draft.refetch();
        if (!result) return;

        if (
          result.data &&
          result.data.type === "default" &&
          !result.data.content.isSynced
        ) {
          updateDraftDefaultContent.mutate(editorValue);
        }
      },
    })
  );

  const shouldEnableSync = useMemo(() => {
    if (
      !draft.data.content.syncDisabledAt ||
      draft.data.content.isSynced ||
      !docQuery.data
    )
      return false;

    const syncDisabledAt = new Date(draft.data.content.syncDisabledAt);
    const modifiedTime = new Date(docQuery.data.modifiedTime);

    return modifiedTime.getTime() > syncDisabledAt.getTime();
  }, [draft.data, docQuery.data]);

  return (
    <>
      <div className="w-full justify-between flex items-center gap-1">
        <motion.div
          layout
          transition={{
            type: "spring",
            duration: 0.35,
            bounce: 0.3,
          }}
          className="flex items-center gap-2"
        >
          <EditDocForm setIsSelected={setIsSelected} />
          {shouldEnableSync && (
            <div className="flex items-center gap-1 text-red-700">
              <TooltipTrigger>
                <Button variant="ghost" size="icon" isCircular={false}>
                  <InfoIcon />
                </Button>
                <Tooltip placement="bottom">
                  <p className="text-red-700 text-center">
                    There have been updates to the Google Doc since you last
                    synced! <br />
                    Review the changes or consider re-enabling sync!
                  </p>
                </Tooltip>
              </TooltipTrigger>
            </div>
          )}
        </motion.div>

        <Switch
          isDisabled={!draft.data.content.isSynced && !docQuery.data}
          isSelected={isSelected}
          onChange={(value) => {
            if (value) {
              return setIsOpen(true);
            }

            updateSync.mutate({
              id: draft.data.id,
              isSynced: value,
            });
          }}
        >
          <p className="text-xs w-max">Sync to Google Doc</p>
        </Switch>
      </div>

      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <ModalBody>
          <ModalHeader>
            <ModalHeading>Are you sure?</ModalHeading>
            <ModalDescription>
              Enabling sync will override the current editor content. This
              operation is not reversible!
            </ModalDescription>
          </ModalHeader>
        </ModalBody>
        <ModalFooter>
          <Button
            onPress={() => {
              updateSync.mutate({
                id: draft.data.id,
                isSynced: true,
              });
              setIsOpen(false);
            }}
          >
            Enable Sync
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

const FixedToolbar = () => {
  const draft = useDefaultDraft();

  return (
    <div className="sticky top-16 overflow-x-scroll bg-white/80 backdrop-blur-3xl z-10 flex gap-1 w-full xl:w-3/4 mx-auto border-[0.0125rem] border-zinc-300/70 rounded-md shadow-xs py-1.5 px-2">
      {!draft.data.content.isSynced && (
        <>
          <TextTypeMenu />
          <MarkButtons />
          <AlignMenu />
          <ListButtons />
          <LinkToolbarButton />
          <ImageUploadButton />
        </>
      )}
      <DocSync />
    </div>
  );
};

const FixedToolbarPlugin = createPlatePlugin({
  key: "fixed-toolbar",
  render: {
    beforeEditable: () => <FixedToolbar />,
  },
});

export const ToolbarKit = [FixedToolbarPlugin];
