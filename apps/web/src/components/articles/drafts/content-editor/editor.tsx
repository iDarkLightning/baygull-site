import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Value } from "platejs";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useDefaultDraft } from "~/lib/articles/use-draft";
import { useTRPC } from "~/lib/trpc-client";
import { AutoFormatKit } from "./autoformat-kit";
import { DraftStorePlugin } from "./draft-store";
import { HeadingKit } from "./heading-kit";
import { HorizontalRuleKit } from "./horizontal-rule-kit";
import { LinkKit } from "./link-kit";
import { ListKit } from "./list-kit";
import { MarksKit } from "./marks-kit";
import { MediaKit } from "./media-kit";
import { ParagraphKit } from "./paragraph-kit";
import { StructureKit } from "./structure-kit";
import { ToolbarKit } from "./toolbar-kit";

/**
 *
 * Configure heading plugins with components
 * blockquote plugin
 *
 */

export default function DraftContentEditor() {
  const { data, isUpdating, setIsUpdating, queryKey, query, contentQuery } =
    useDefaultDraft();

  const getValue = () => {
    if (data.isSynced) {
      const { body } = new DOMParser().parseFromString(
        (data.content as string) ?? "",
        "text/html"
      );

      return body.innerHTML;
    }

    return JSON.parse((data.content as string) ?? "[]");
  };

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
    value: getValue(),

    onReady: ({ editor }) => {
      editor.setOption(DraftStorePlugin, "draftId", data.id);
      editor.setOption(DraftStorePlugin, "setIsUpdating", setIsUpdating);
    },
  });

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateDraftDefaultContent = useMutation(
    trpc.article.manage.updateDraftDefaultContent.mutationOptions({
      onSettled: () => queryClient.invalidateQueries({ queryKey }),
    })
  );

  useEffect(() => {
    if (data.isSynced && query.status === "success") {
      editor.tf.setValue(getValue());
    }
  }, [query.isRefetching, contentQuery.isRefetching]);

  const debounce = useDebouncedCallback((value: Value) => {
    if (isUpdating) return;

    updateDraftDefaultContent.mutate({
      id: data.id,
      content: JSON.stringify(value),
    });
  }, 300);

  return (
    <div>
      <Plate
        readOnly={data.isSynced}
        editor={editor}
        onValueChange={({ editor, value }) => {
          if (data.isSynced) return;
          debounce(value);
        }}
      >
        <PlateContent
          className="focus-visible:outline-none h-full w-full xl:w-3/4 max-w-[60rem] p-2 lg:p-8 rounded-md mx-auto"
          placeholder="Type your amazing content here..."
        />
      </Plate>
    </div>
  );
}
