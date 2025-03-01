import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArticleHighlights } from "~/components/articles/article-highlights";
import { ArticlesList } from "~/components/articles/article-list";
import { ArticleSpotlight } from "~/components/articles/article-spotlight";
import { Header } from "~/components/nav";
import { getHomePageArticlesQuery } from "~/lib/articles/article-api";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(getHomePageArticlesQuery());
  },
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(getHomePageArticlesQuery());

  return (
    <div>
      <Header />
      <main className="max-w-[100rem] h-24 py-6 px-4 md:mx-auto md:w-[90%] xl:w-[70%] flex flex-col mt-16 font-serif gap-8">
        {!data.latest && (
          <div className="flex flex-col justify-center text-center items-center h-[calc(100vh-8rem)px] gap-2 py-16">
            <p className="text-5xl md:text-9xl font-black">Coming Soon</p>
            <p className="text-xl md:text-2xl text-neutral-500 max-w-[32rem]">
              Sorry, we don't have any articles just yet. We're working on
              getting them up real soon!
            </p>
          </div>
        )}
        {data.latest && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
            <div className="w-full md:col-span-3">
              <ArticleSpotlight article={data.latest} />
            </div>
            <div className="space-y-6 md:col-start-4 md:col-span-2 md:row-start-1 md:row-span-8 bg-red">
              <div className="border-y-neutral-200 border border-x-0 py-2 px-1 w-full">
                <p className="font-semibold text-xl">Highlights</p>
              </div>
              <div className="flex flex-col gap-6 ">
                <ArticleHighlights articles={data.highlights} />
              </div>
            </div>
            {data.recent.length > 0 && (
              <div className="space-y-8 md:col-start-1 md:col-span-3">
                <div className="border-y-neutral-200 border border-x-0 py-2 px-1">
                  <p className="font-bold text-xl">Recent Articles</p>
                </div>
                <div className="flex flex-col gap-6">
                  <ArticlesList articles={data.recent} />
                  <Link
                    to="/articles"
                    className="py-2 mb-8 font-medium border border-neutral-300 text-center hover:underline rounded-md w-fit px-8 flex items-center justify-end self-center text-sm uppercase gap-2"
                  >
                    Browse all Articles
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
