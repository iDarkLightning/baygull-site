import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serializeHtml, Value } from "platejs";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";
import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useDefaultDraft } from "~/lib/articles/use-draft";
import { useTRPC } from "~/lib/trpc-client";
import { AutoFormatKit } from "./autoformat-kit";
import { ArticleStorePlugin } from "./article-store";
import { HeadingKit } from "./heading-kit";
import { HorizontalRuleKit } from "./horizontal-rule-kit";
import { LinkKit } from "./link-kit";
import { ListKit } from "./list-kit";
import { MarksKit } from "./marks-kit";
import { MediaKit } from "./media-kit";
import { ParagraphKit } from "./paragraph-kit";
import { StructureKit } from "./structure-kit";
import { ToolbarKit } from "./toolbar-kit";
import { cn } from "@baygull/ui/cn";

/**
 *
 * Configure heading plugins with components
 * blockquote plugin
 *
 */

export default function ArticleContentEditor() {
  const { data, isUpdating, setIsUpdating, queryKey, query } =
    useDefaultDraft();

  const getValue = () => {
    if (data.content.type === "html" || data.content.isSynced) {
      const { body } = new DOMParser().parseFromString(
        (data.content.content as string) ?? "",
        "text/html"
      );

      return body.innerHTML;
    }

    return JSON.parse((data.content.content as string) ?? "[]");
  };

  const editor = usePlateEditor({
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
    value: getValue(),

    onReady: ({ editor }) => {
      editor.setOption(ArticleStorePlugin, "articleId", data.id);
      editor.setOption(ArticleStorePlugin, "setIsUpdating", setIsUpdating);
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
    if (data.content.isSynced && query.status === "success") {
      editor.tf.setValue(getValue());
    }
  }, [query.isRefetching]);

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
        readOnly={data.content.isSynced || data.status === "archived"}
        editor={editor}
        onValueChange={async ({ editor, value }) => {
          if (data.content.isSynced) return;
          debounce(value);
        }}
      >
        <PlateContent
          className={cn(
            "focus-visible:outline-none h-full w-full xl:w-3/4 max-w-[60rem] p-2 lg:p-8 rounded-md mx-auto flex flex-col gap-1",
            data.status === "archived" && "opacity-60 cursor-not-allowed"
          )}
          placeholder="Type your amazing content here..."
        />
      </Plate>
    </div>
  );
}
