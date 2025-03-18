import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArticlePublishForm } from "~/components/articles/article-publish-form";
import { CollapsedHeader } from "~/components/nav";
import { getArticleDraftByIdQuery } from "~/lib/articles/article-api";
import { ArticlePublishFormStoreProvider } from "~/lib/articles/article-publish-store";
import { getAllTopicsQuery } from "~/lib/topics/topic-api";

export const Route = createFileRoute("/articles/publish/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      getArticleDraftByIdQuery(params.id)
    );

    await context.queryClient.ensureQueryData(getAllTopicsQuery);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();

  const draftQuery = useSuspenseQuery(getArticleDraftByIdQuery(id));

  return (
    <div>
      <CollapsedHeader />
      <main className="max-w-[80rem] py-6 px-4 md:mx-auto md:w-[70%] lg:w-[50%] xl:w-[40%] flex flex-col mt-16 justify-center font-serif gap-8">
        <ArticlePublishFormStoreProvider
          name={draftQuery.data.title}
          content={draftQuery.data.content}
          description={draftQuery.data.description}
          coverImg={draftQuery.data.coverImg}
          users={draftQuery.data.users}
        >
          <ArticlePublishForm />
        </ArticlePublishFormStoreProvider>
      </main>
    </div>
  );
}
