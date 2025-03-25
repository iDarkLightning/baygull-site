import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArticlePublishForm } from "~/components/articles/article-publish-form";
import { ArticlePublishFormStoreProvider } from "~/lib/articles/article-publish-store";
import { useTRPC } from "~/lib/trpc/client";

export const Route = createFileRoute(
  "/manage/_admin-layout/drafts/publish/$id"
)({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.article.draft.getById.queryOptions({ draftId: params.id })
    );

    await context.queryClient.ensureQueryData(
      context.trpc.topic.getAll.queryOptions()
    );
  },
  component: RouteComponent,
});

// max-w-[80rem] py-6 px-4 md:mx-auto md:w-[70%] lg:w-[50%] xl:w-[40%] flex flex-col mt-16 justify-center font-serif gap-8
function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const draftQuery = useSuspenseQuery(
    trpc.article.draft.getById.queryOptions({ draftId: id })
  );

  return (
    // <div>
    //   {/* <CollapsedHeader /> */}
    //   <main className="mt-24 max-w-[125rem] mx-auto md:mx-auto md:w-[80%] lg:w-[85%] 2xl:w-[90%] font-serif px-16">

    //   </main>
    // </div>
    <ArticlePublishFormStoreProvider
      name={draftQuery.data.title}
      content={draftQuery.data.content}
      description={draftQuery.data.description}
      coverImg={draftQuery.data.coverImg}
      users={draftQuery.data.users}
    >
      <ArticlePublishForm />
    </ArticlePublishFormStoreProvider>
  );
}
