import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArticlesList } from "~/components/articles/article-list";
import { Header } from "~/components/nav";
import { useTRPC } from "~/lib/trpc/client";

export const Route = createFileRoute("/articles/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.article.getAll.queryOptions()
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { data: articles } = useSuspenseQuery(
    trpc.article.getAll.queryOptions()
  );

  return (
    <>
      <Header />
      <main className="max-w-[100rem] h-24 py-6 px-4 md:mx-auto md:w-[70%] lg:w-[50%] flex flex-col mt-16 font-serif gap-8">
        <div className="flex flex-col gap-0.5 border-b border-b-neutral-400 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black tracking-wide">Articles</h2>
              <p className="text-neutral-700 text-sm">
                The latest articles from your favorite satirical newspaper
              </p>
            </div>
          </div>
        </div>
        <ArticlesList articles={articles} />
      </main>
    </>
  );
}
