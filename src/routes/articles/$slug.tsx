import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CollapsedHeader } from "~/components/layout/nav";
import { PageProgress } from "~/components/page-progress";
import { useTRPC } from "~/lib/trpc/client";

export const Route = createFileRoute("/articles/$slug")({
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.article.getBySlug.queryOptions({ slug: params.slug })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const trpc = useTRPC();
  const { data: article } = useSuspenseQuery(
    trpc.article.getBySlug.queryOptions({ slug: params.slug })
  );

  return (
    <>
      <CollapsedHeader />
      <PageProgress />
      <main className="max-w-[100rem] h-24 py-6 px-4 md:mx-auto md:w-[90%] lg:w-[70%] xl:w-[40%] flex flex-col mt-16 font-serif gap-1">
        <h2 className="text-4xl font-semibold leading-[1.4]">
          {article.title}
        </h2>
        <p className="py-4 text-lg text-neutral-700">{article.description}</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center group">
            {article.users.map(({ user }) => (
              <img
                key={user.id}
                src={user.image || ""}
                width="48"
                height="48"
                className="rounded-full"
                referrerPolicy="no-referrer"
              />
            ))}
          </div>
          <p className="font-medium">
            By{" "}
            {article.users.map(({ user }) => (
              <a key={user.id} className="text-sky-700 underline">
                {user.name}
              </a>
            ))}
          </p>
        </div>
        {article.coverImg && (
          <img
            src={article.coverImg}
            width="1600"
            height="768"
            className="my-4"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-wrap gap-2">
            {article.topics.map(({ topic }) => (
              <div
                key={topic.id}
                className="p-1 px-3 border w-fit border-neutral-400 rounded-full font-sans font-medium"
              >
                <p>{topic.name}</p>
              </div>
            ))}
          </div>
          <p className="text-neutral-600">
            {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
              new Date(article.publishedAt)
            )}
          </p>
        </div>
        <hr className="my-4 text-neutral-300" />
        <div
          className="flex flex-col gap-4 text-lg leading-relaxed text-[#363636] pb-8 break-words ![&>img]:w-full parent"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </main>
    </>
  );
}
