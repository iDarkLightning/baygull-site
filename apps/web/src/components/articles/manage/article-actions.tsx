import {
  DialogTrigger,
  Menu,
  MenuTrigger,
  SubmenuTrigger,
} from "@baygull/ui/aria";
import { Button } from "@baygull/ui/button";
import useWindowSize from "@baygull/ui/hooks/use-window-size";
import {
  ArchiveBoxIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  PublishIcon,
  ThreeDotsIcon,
  TrashIcon,
  XMarkIcon,
} from "@baygull/ui/icons";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { createPlateEditor } from "platejs/react";
import z from "zod";
import { UnarchiveIcon, UTurnLeftIcon } from "~/components/ui/icons";
import { MenuItemLink } from "~/components/ui/menu-item-link";
import { useDraft } from "~/lib/articles/use-draft";
import { useAppForm } from "~/lib/form";
import { useDisclosure } from "~/lib/hooks/use-disclosure";
import { useTRPC } from "~/lib/trpc-client";
import { ArticleStorePlugin } from "./content-editor/article-store";
import { AutoFormatKit } from "./content-editor/autoformat-kit";
import { HeadingKit } from "./content-editor/heading-kit";
import { HorizontalRuleKit } from "./content-editor/horizontal-rule-kit";
import { LinkKit } from "./content-editor/link-kit";
import { ListKit } from "./content-editor/list-kit";
import { MarksKit } from "./content-editor/marks-kit";
import { MediaKit } from "./content-editor/media-kit";
import { ParagraphKit } from "./content-editor/paragraph-kit";
import { StructureKit } from "./content-editor/structure-kit";
import { ToolbarKit } from "./content-editor/toolbar-kit";

const PublishModal = () => {
  const { data, setIsUpdating, queryKey } = useDraft();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const publish = useMutation(
    trpc.article.manage.publish.mutationOptions({
      onSettled: async () => {
        return queryClient.invalidateQueries({
          queryKey: trpc.article.manage.pathKey(),
        });
      },
    })
  );

  const updateDraftDefaultContent = useMutation(
    trpc.article.manage.updateDraftDefaultContent.mutationOptions({
      onSettled: async (_, _e, { id }) => {
        await queryClient.invalidateQueries({ queryKey });

        publish.mutate({ id });
      },
    })
  );

  const updateSync = useMutation(
    trpc.article.manage.updateDocSync.mutationOptions({
      onSuccess: async ({ content }) => {
        const { body } = new DOMParser().parseFromString(
          (content as string) ?? "",
          "text/html"
        );

        const htmlContent = body.innerHTML;

        createPlateEditor({
          plugins: [
            ArticleStorePlugin,
            ...HeadingKit,
            ...ParagraphKit,
            ...MarksKit,
            ...StructureKit,
            ...ListKit,
            ...LinkKit,
            ...HorizontalRuleKit,
            ...AutoFormatKit,
            ...MediaKit,
            ...ToolbarKit,
          ],
          value: htmlContent,
          onReady: async ({ editor, value }) => {
            editor.setOption(ArticleStorePlugin, "articleId", data.id);
            editor.setOption(
              ArticleStorePlugin,
              "setIsUpdating",
              setIsUpdating
            );

            await updateDraftDefaultContent.mutateAsync({
              id: data.id,
              content: value[0]!.text as string,
            });
          },
        });
      },
    })
  );

  const handlePublish = useMutation({
    mutationKey: ["handle-mutation", data.id],
    mutationFn: async ({ id }: { id: string }) => {
      if (data.type === "default") {
        // If the content is synced, disable sync and commit the latest content
        if (data.content.isSynced) {
          return updateSync.mutate({
            id: data.id,
            isSynced: false,
          });
        }
      }

      publish.mutate({ id });
    },
  });

  return (
    <Modal>
      <ModalBody>
        <ModalHeader>
          <ModalHeading>Publish Draft</ModalHeading>
          <ModalDescription>
            Publishing this draft will make it publicly available on the
            website. You can use the preview to confirm that everything looks as
            expected.
          </ModalDescription>
        </ModalHeader>
      </ModalBody>
      <ModalFooter>
        <Button
          isLoading={
            handlePublish.isPending ||
            updateSync.isPending ||
            updateDraftDefaultContent.isPending ||
            publish.isPending
          }
          onPress={() => {
            handlePublish.mutate({ id: data.id });
          }}
        >
          Publish
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const ArticleActions = () => {
  const { data } = useDraft();
  const { loading, windowSize } = useWindowSize();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const retract = useMutation(
    trpc.article.manage.retract.mutationOptions({
      onSettled: async () =>
        queryClient.invalidateQueries({
          queryKey: trpc.article.manage.pathKey(),
        }),
    })
  );

  const deleteArticle = useMutation(
    trpc.article.manage.delete.mutationOptions({
      onSettled: async () => {
        navigate({
          to: "/manage/a/$status",
          params: {
            status: data.status === "draft" ? data.status + "s" : data.status,
          },
          ignoreBlocker: true,
        });

        return queryClient.invalidateQueries({
          queryKey: trpc.article.manage.pathKey(),
        });
      },
    })
  );

  const control = useDisclosure();

  const deleteConfirmationForm = useAppForm({
    defaultValues: {
      confirmation: "",
    },
    onSubmit: async () => {
      deleteArticle.mutate({
        id: data.id,
      });
    },
  });

  const toggleArchive = useMutation(
    trpc.article.manage.toggleArchive.mutationOptions({
      onSettled: async () =>
        queryClient.invalidateQueries({
          queryKey: trpc.article.manage.pathKey(),
        }),
    })
  );

  const isCollapsed = loading || (windowSize.width && windowSize?.width < 768);

  return (
    <div className="flex">
      {!isCollapsed && (
        <>
          {data.status === "published" && (
            <Link
              to="/articles/$slug"
              params={{ slug: data.slug }}
              target="_blank"
            >
              <Button
                leadingVisual={<ExternalLinkIcon />}
                isCircular="left"
                variant="secondary"
              >
                Visit
              </Button>
            </Link>
          )}
          {data.status === "draft" && (
            <DialogTrigger>
              <Button
                leadingVisual={<PublishIcon />}
                isCircular="left"
                variant="secondary"
              >
                Publish
              </Button>
              <PublishModal />
            </DialogTrigger>
          )}
          {data.status === "archived" && (
            <Button
              leadingVisual={<UnarchiveIcon />}
              isCircular="left"
              onPress={() =>
                toggleArchive.mutate({
                  id: data.id,
                  isArchived: false,
                })
              }
              variant="secondary"
            >
              Restore
            </Button>
          )}
        </>
      )}
      <MenuTrigger>
        <Button
          variant="secondary"
          size="icon"
          isCircular={isCollapsed ? true : "right"}
        >
          {isCollapsed ? <ThreeDotsIcon /> : <ChevronDownIcon />}
        </Button>
        <ModalPopover
          popoverProps={{
            placement: "bottom right",
          }}
        >
          <Menu className="focus:outline-none min-w-42">
            {isCollapsed && (
              <>
                {data.status === "published" && (
                  <MenuItemLink
                    to="/articles/$slug"
                    params={{ slug: data.slug }}
                    target="_blank"
                  >
                    <div className="flex justify-between gap-2 items-center">
                      <div className="flex gap-2 items-center">
                        <ExternalLinkIcon />
                        <p className="text-xs">Visit</p>
                      </div>
                    </div>
                  </MenuItemLink>
                )}

                {data.status === "draft" && (
                  <SubmenuTrigger>
                    <MenuItem>
                      <div className="flex justify-between gap-2 items-center">
                        <div className="flex gap-2 items-center">
                          <PublishIcon />
                          <p className="text-xs">Publish</p>
                        </div>
                      </div>
                    </MenuItem>
                    <PublishModal />
                  </SubmenuTrigger>
                )}

                {data.status === "archived" && (
                  <MenuItem
                    onAction={() =>
                      toggleArchive.mutate({ id: data.id, isArchived: false })
                    }
                  >
                    <div className="flex justify-between gap-2 items-center">
                      <div className="flex gap-2 items-center">
                        <UnarchiveIcon />
                        <p className="text-xs">Restore</p>
                      </div>
                    </div>
                  </MenuItem>
                )}
              </>
            )}
            {data.status === "published" && (
              <MenuItem onAction={() => retract.mutate({ id: data.id })}>
                <div className="flex justify-between gap-2 items-center">
                  <div className="flex gap-2 items-center">
                    <UTurnLeftIcon />
                    <p className="text-xs">Retract</p>
                  </div>
                </div>
              </MenuItem>
            )}
            {data.status === "draft" && (
              <MenuItem
                onAction={() =>
                  toggleArchive.mutate({ id: data.id, isArchived: true })
                }
              >
                <div className="flex justify-between gap-2 items-center">
                  <div className="flex gap-2 items-center">
                    <ArchiveBoxIcon />
                    <p className="text-xs">Archive</p>
                  </div>
                </div>
              </MenuItem>
            )}
            <MenuItem onPress={control.open}>
              <div className="flex justify-between gap-2 items-center text-rose-600">
                <div className="flex gap-2 items-center">
                  <TrashIcon />
                  <p className="text-xs">Delete</p>
                </div>
              </div>
            </MenuItem>
          </Menu>
        </ModalPopover>
      </MenuTrigger>
      <Modal
        isOpen={control.isOpen}
        onOpenChange={control.setOpen}
        isKeyboardDismissDisabled
      >
        <ModalBody>
          <ModalHeader>
            <ModalHeading>Delete Article</ModalHeading>
            <ModalDescription>
              This action is not reversible. If you do not want this data to be
              permanently lost, consider archiving instead.
            </ModalDescription>
          </ModalHeader>
          <div className="mb-4">
            <deleteConfirmationForm.AppField
              name="confirmation"
              validators={{
                onSubmit: z
                  .string()
                  .refine(
                    (val) => val.toUpperCase() === "DELETE ARTICLE",
                    "Incorrect confirmation message"
                  ),
              }}
              children={(field) => (
                <field.TextField
                  isTextArea={false}
                  label={`Enter "Delete Article" to Confirm`}
                />
              )}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            isLoading={deleteArticle.isPending}
            leadingVisual={<TrashIcon />}
            variant="danger"
            onPress={deleteConfirmationForm.handleSubmit}
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
