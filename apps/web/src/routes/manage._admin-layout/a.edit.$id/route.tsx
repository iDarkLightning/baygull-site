import { cn } from "@baygull/ui/cn";
import {
  ArchiveBoxIcon,
  ClockIcon,
  GlobeIcon,
  PencilSquareIcon,
  RefreshIcon,
} from "@baygull/ui/icons";
import {
  createFileRoute,
  Link,
  MatchRoute,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useRef, useState } from "react";
import useMeasure from "react-use-measure";
import { ArticleActions } from "~/components/articles/manage/article-actions";
import { useDraft } from "~/lib/articles/use-draft";
import { asUTCDate } from "~/lib/as-utc-date";

type ArticleType = "default" | "headline" | "graphic";
type ArticleStatus = "published" | "archived" | "draft";

type HideFor = ArticleType | ArticleStatus;

const tabs = [
  {
    id: "draft-information",
    to: "/manage/a/edit/$id" as const,
    name: "Information",
    hideFor: [] as HideFor[],
  },
  {
    id: "draft-content",
    to: "/manage/a/edit/$id/content" as const,
    name: "Content",
    hideFor: ["headline", "published"] as HideFor[],
  },
  {
    id: "draft-layout",
    to: "/manage/a/edit/$id/layout" as const,
    name: "Layout",
    hideFor: [] as HideFor[],
  },
  {
    id: "draft-seo",
    to: "/manage/a/edit/$id/seo" as const,
    name: "SEO Data",
    hideFor: [] as HideFor[],
  },
  // {
  //   id: "draft-publishing",
  //   to: "/manage/a/edit/$id/publishing" as const,
  //   name: "Publishing",
  //   hideFor: [] as HideFor[],
  // },
];

const statusIcons = {
  published: <GlobeIcon />,
  draft: <PencilSquareIcon />,
  archived: <ArchiveBoxIcon />,
};

const DateDisplay: React.FC<{
  label: string;
  date: string;
}> = (props) => (
  <div
    className={cn(
      "flex items-center gap-1.5 px-4 py-0.5 rounded-full text-xs w-max font-medium bg-zinc-100 text-zinc-600 border-zinc-300/70 border-[0.0125rem]"
    )}
  >
    <ClockIcon />
    <p>{props.label}:</p>
    <p className="font-mono">
      {asUTCDate(props.date).toLocaleTimeString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })}
    </p>
  </div>
);

export const Route = createFileRoute("/manage/_admin-layout/a/edit/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.article.manage.getById.queryOptions({
        draftId: params.id,
      })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const { data, isUpdating } = useDraft();

  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const [headerStuck, setHeaderStuck] = useState(false);

  const routerStatus = useRouterState({
    select: (s) => s.status,
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setHeaderStuck(v > 0);
  });

  const [titleRef, { width }] = useMeasure();

  const isNavigating = routerStatus === "pending";

  return (
    <div className="w-full mx-auto max-w-[100rem] relative">
      <div className="rounded-lg mx-4 mt-4 py-3 px-1 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div>
            <div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 overflow-auto">
                  <h1 className="text-lg font-medium md:max-w-[32ch] lg:max-w-[64ch] truncate">
                    {data.title}
                  </h1>
                </div>
                {isUpdating && (
                  <div className="flex items-center gap-0.5 text-zinc-300 mt-0.5">
                    <RefreshIcon />
                    <p className="text-xs leading-4  fade-in fade-out">
                      Saving...
                    </p>
                  </div>
                )}
              </div>
              {data.type !== "headline" && (
                <p className="text-sm text-zinc-700 md:max-w-[24ch] lg:max-w-[64ch] truncate">
                  {data.description}
                </p>
              )}
            </div>
          </div>
          <div className="hidden md:flex gap-2 items-center bg-zinc-50 w-max rounded-full border-[0.0125rem] border-zinc-200/70 overflow-auto">
            {tabs
              .filter(
                (tab) =>
                  !tab.hideFor.includes(data.type) &&
                  !tab.hideFor.includes(data.status)
              )
              .map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.to}
                  params={params}
                  className="text-sm relative font-medium py-2.5 px-4 rounded-full cursor-default"
                >
                  <p className="z-20 text-black relative w-max">{tab.name}</p>
                  <MatchRoute to={tab.to}>
                    {(match) =>
                      match && (
                        <motion.span
                          layoutId={isNavigating ? undefined : "article-bubble"}
                          className="absolute inset-0 z-10 bg-zinc-200/40 rounded-full transition-colors shadow-inner"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.3,
                          }}
                        />
                      )
                    }
                  </MatchRoute>
                </Link>
              ))}
          </div>
        </div>
      </div>
      <div ref={ref} aria-hidden />
      <motion.div
        className={cn(
          "border-y-[0.0125rem] border-zinc-400/60 bg-zinc-50 sticky top-0 z-[1000]",
          headerStuck && "shadow-sm bg-zinc-50/80 backdrop-blur-2xl"
        )}
      >
        <div className="grid grid-cols-12 gap-2">
          <div className="flex items-center gap-2 overflow-auto col-span-12 row-start-1 ml-4 pl-1 md:pl-6">
            {headerStuck && (
              <motion.h1
                ref={titleRef}
                key="article-title"
                initial={{ x: "-5%" }}
                animate={{ x: 0 }}
                className="font-medium min-w-max max-w-[8ch] md:max-w-[32ch] truncate"
              >
                {data.title}
              </motion.h1>
            )}
            <motion.div
              className="flex gap-2 items-center"
              transition={{ ease: "easeOut" }}
              animate={{ marginLeft: headerStuck && width ? `1ch` : 0 }}
            >
              <div
                className={cn(
                  "flex items-center px-4 py-0.5 rounded-full text-xs w-fit font-medium border-[0.0125rem]",
                  data.type == "default" &&
                    "bg-sky-100 text-sky-800 border-sky-300/70",
                  data.type == "graphic" &&
                    "bg-green-100 text-green-800 border-sky-300/70",
                  data.type == "headline" &&
                    "bg-purple-100 text-purple-800 border-purple-300/70"
                )}
              >
                <p>{data.type.charAt(0).toUpperCase() + data.type.slice(1)}</p>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5 px-4 py-0.5 rounded-full text-xs w-fit font-medium bg-zinc-100 text-zinc-600 border-zinc-300/70 border-[0.0125rem]"
                )}
              >
                {statusIcons[data.status]}
                <p>
                  {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                </p>
              </div>
              <DateDisplay label="Created On" date={data.createdAt} />
              <DateDisplay label="Last Updated" date={data.updatedAt} />
            </motion.div>
          </div>

          <div className="flex items-center justify-center gap-2 row-start-1 justify-self-end border-l-[0.0125rem] bg-zinc-50 pl-4 pr-5 md:pr-10 py-1.5 border-zinc-400/60">
            <ArticleActions />
          </div>
        </div>
        <div className="flex flex-wrap md:hidden py-2 pl-1 md:pl-6 border-t-[0.0125rem] border-zinc-400/60">
          <div className="flex overflow-auto mx-4 w-full">
            {tabs
              .filter(
                (tab) =>
                  !tab.hideFor.includes(data.type) &&
                  !tab.hideFor.includes(data.status)
              )
              .map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.to}
                  params={params}
                  className="text-sm relative font-medium py-1.5 px-2 rounded-full grow cursor-default text-center"
                >
                  <p className="z-20 text-black relative w-full text-center">
                    {tab.name}
                  </p>
                  <MatchRoute to={tab.to}>
                    {(match) =>
                      match && (
                        <motion.span
                          layoutId="article-bubble-mobile"
                          className="absolute inset-0 z-10 bg-zinc-200/40 rounded-full shadow-inner"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.3,
                          }}
                        />
                      )
                    }
                  </MatchRoute>
                </Link>
              ))}
          </div>
        </div>
      </motion.div>
      <div className="mt-2 mx-4 py-3 px-1 md:px-6">
        <Outlet />
      </div>
    </div>
  );
}
