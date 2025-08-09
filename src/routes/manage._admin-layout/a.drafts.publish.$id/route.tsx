import {
  createFileRoute,
  Link,
  MatchRoute,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Button as AriaButton, Menu, MenuTrigger } from "react-aria-components";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  RefreshIcon,
} from "~/components/ui/icons";
import { MenuItemLink } from "~/components/ui/menu";
import { ModalPopover } from "~/components/ui/modal-popover";
import { useDraft } from "~/lib/articles/use-draft";

const tabs = [
  {
    id: "draft-information",
    to: "/manage/a/drafts/publish/$id" as const,
    name: "Information",
  },
  {
    id: "draft-content",
    to: "/manage/a/drafts/publish/$id/content" as const,
    name: "Content",
  },
  {
    id: "draft-layout",
    to: "/manage/a/drafts/publish/$id/layout" as const,
    name: "Layout",
  },
  {
    id: "draft-seo",
    to: "/manage/a/drafts/publish/$id/seo" as const,
    name: "SEO Data",
  },
];

export const Route = createFileRoute(
  "/manage/_admin-layout/a/drafts/publish/$id"
)({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.trpc.article.draft.getById.queryOptions({
        draftId: params.id,
      })
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const params = Route.useParams();
  const { data, isUpdating } = useDraft();
  const matchRoute = useMatchRoute();

  return (
    <div className="w-full mx-auto max-w-[100rem]">
      <div className="rounded-lg mx-4 my-4 py-3 px-1 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center gap-2 justify-between">
          <div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-medium">{data.title}</h1>
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
                <p className="text-sm text-zinc-700">{data.description}</p>
              )}
            </div>
          </div>
          <div className="block md:hidden w-full">
            <MenuTrigger aria-label="draft-nav">
              <AriaButton className="bg-zinc-50 py-2.5 px-4 w-full rounded-full border-[0.0125rem] justify-between border-zinc-300/70 font-medium text-sm shadow-inner flex items-center gap-2">
                {tabs.find((tab) => matchRoute({ to: tab.to }))?.name}
                <ChevronDownIcon />
              </AriaButton>
              <ModalPopover>
                <Menu>
                  {tabs.map((tab) => (
                    <MenuItemLink
                      to={tab.to}
                      params={params}
                      key={tab.id}
                      activeProps={{}}
                    >
                      <div className="flex gap-3 items-center justify-between">
                        {tab.name}
                        <ChevronRightIcon />
                      </div>
                    </MenuItemLink>
                  ))}
                </Menu>
              </ModalPopover>
            </MenuTrigger>
          </div>
          <div className="hidden md:flex flex-wrap gap-2 items-center bg-zinc-50 w-fit rounded-full border-[0.0125rem] border-zinc-200/70 shaadow-xs">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.to}
                params={params}
                className="text-sm relative font-medium py-2.5 px-4 rounded-full cursor-default"
              >
                <p className="z-20 text-black relative">{tab.name}</p>
                <MatchRoute to={tab.to}>
                  {(match) =>
                    match && (
                      <motion.span
                        layoutId={"draft-bubble"}
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
            {/* <Button leadingVisual={<PublishIcon />}>Publish</Button> */}
          </div>
        </div>
        <div className="mt-4 md:mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
