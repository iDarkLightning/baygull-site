import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Value } from "platejs";
import {
  createPlatePlugin,
  Plate,
  PlateContent,
  usePlateEditor,
} from "platejs/react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "~/components/ui/button";
import { useDraft } from "~/lib/articles/use-draft";
import { useTRPC } from "~/lib/trpc/client";
import { AutoFormatKit } from "./autoformat-kit";
import { HeadingKit } from "./heading-kit";
import { HorizontalRuleKit } from "./horizontal-rule-kit";
import { LinkKit } from "./link-kit";
import { ListKit } from "./list-kit";
import { MarksKit } from "./marks-kit";
import { MediaKit } from "./media-kit";
import { ParagraphKit } from "./paragraph-kit";
import { StructureKit } from "./structure-kit";
import { DraftStorePlugin } from "./draft-store";
import { useEffect } from "react";
import { useMatchRoute, useRouter } from "@tanstack/react-router";
import { ToolbarKit } from "./toolbar-kit";

/**
 *
 * Configure heading plugins with components
 * blockquote plugin
 *
 */

export default function DraftContentEditor() {
  const { data, isUpdating, queryKey } = useDraft();

  const editor = usePlateEditor({
    plugins: [
      DraftStorePlugin,
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
    value: data.type === "default" ? JSON.parse(data.content ?? "[]") : [],
    onReady: ({ editor }) => {
      editor.setOption(DraftStorePlugin, "draftId", data.id);
    },
  });

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateDraftDefaultContent = useMutation(
    trpc.article.draft.updateDraftDefaultContent.mutationOptions({
      onSettled: () => queryClient.invalidateQueries({ queryKey }),
    })
  );
  const getHTMLData = useMutation(
    trpc.article.draft.getDraftDefaultContentHTML.mutationOptions()
  );
  const syncDraftToDocs = useMutation({
    mutationKey: ["sync-draft-to-docs", data.id],
    mutationFn: async (data: { id: string }) => {
      const htmlData = await getHTMLData.mutateAsync({ id: data.id });
      const { body } = new DOMParser().parseFromString(htmlData, "text/html");

      editor.tf.setValue(body.innerHTML);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const debounce = useDebouncedCallback((value: Value) => {
    if (isUpdating) return;

    updateDraftDefaultContent.mutate({
      id: data.id,
      content: JSON.stringify(value),
    });
  }, 300);

  return (
    <div>
      <Button
        // isLoading={isUpdating}
        onPress={() =>
          syncDraftToDocs.mutate({
            id: data.id,
          })
        }
      >
        Sync To Docs
      </Button>

      <Plate
        editor={editor}
        onValueChange={({ editor, value }) => {
          debounce(value);
        }}
      >
        <PlateContent
          className="focus-visible:outline-none h-full w-full xl:w-3/4 max-w-[60rem] p-8 rounded-md mx-auto"
          placeholder="Type your amazing content here..."
        />
      </Plate>
    </div>
  );
}
