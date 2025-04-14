import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Drawer } from "vaul";
import { useTRPC } from "~/lib/trpc/client";
import { Button } from "../ui/button";
import {
  DocumentDuplicatesIcon,
  MenuIcon,
  PencilSquareIcon,
  PeopleIcon,
} from "../ui/icons";
import { cn } from "~/lib/cn";

const tabs = [
  {
    id: "articles-tab",
    name: "Articles",
    link: "/manage/articles",
    icon: DocumentDuplicatesIcon,
  },
  {
    id: "drafts-tab",
    name: "Drafts",
    link: "/manage/drafts",
    icon: PencilSquareIcon,
  },
  {
    id: "people-tab",
    name: "People",
    link: "/adaa",
    icon: PeopleIcon,
  },
] as const;

//
const Nav = () => {
  const trpc = useTRPC();
  const userQuery = useSuspenseQuery(trpc.user.me.queryOptions());

  if (!userQuery.data) throw new Error("Impossible state!");

  return (
    <>
      <div className="flex gap-2 items-center border-b-[0.0125rem] border-zinc-400/60 p-3 flex-1/12">
        <img src="/logo.png" alt="" className="size-12" />
        <div className="leading-5">
          <p className="font-semibold">The Bay Gull</p>
          <p className="font-medium text-xs text-sky-700">Admin</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 flex-10/12 my-2">
        {tabs.map((tab) => (
          <Link
            to={tab.link as any}
            key={tab.id}
            className={cn(
              "px-1.5 mx-4 py-1.5 font-medium text-sm text-neutral-700/80 flex items-center gap-2 rounded-md hover:bg-zinc-100 transition-colors",
              "focus:outline-none focus:bg-zinc-100"
            )}
            // activeOptions={{ exact: true }}
            activeProps={{
              className:
                "bg-zinc-50 border-[0.0125rem] border-zinc-400/60 shadow-sm",
            }}
          >
            <tab.icon />
            <p className="text-neutral-950 font-medium">{tab.name}</p>
          </Link>
        ))}
      </div>
      <div className="flex-1/12 items-center gap-2 p-3 border-t-[0.0125rem] border-zinc-400/60 lg:flex hidden">
        <img
          src={userQuery.data.image ?? ""}
          className="rounded-xl size-10"
          alt=""
          referrerPolicy="no-referrer"
        />
        <div className="leading-6">
          <p className="font-medium">{userQuery.data.name}</p>
          <p className="text-neutral-800 text-xs">{userQuery.data.email}</p>
        </div>
      </div>
    </>
  );
};

const MobileNavDrawer: React.FC<React.PropsWithChildren> = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Drawer.Root direction="left" open={isOpen} onOpenChange={setIsOpen}>
      <Button size="icon" variant="ghost" onPress={() => setIsOpen(true)}>
        <MenuIcon />
      </Button>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-zinc-300/50 backdrop-blur-xs" />
        <Drawer.Content
          className="left-0 top-0 bottom-0 fixed z-10 outline-none w-64 flex border-r-[0.0125rem] border-zinc-950/5  bg-zinc-950 text-white rounded-r-lg"
          // The gap between the edge of the screen and the drawer is 8px in this case.
          style={
            {
              "--initial-transform": "calc(100% + 8px)",
            } as React.CSSProperties
          }
        >
          {props.children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export const AdminShell: React.FC<React.PropsWithChildren> = (props) => {
  const trpc = useTRPC();
  const userQuery = useSuspenseQuery(trpc.user.me.queryOptions());

  if (!userQuery.data) throw new Error("Impossible state!");

  return (
    <div className="font-sans flex flex-col lg:flex-row h-screen w-screen lg:bg-[#E0E2E6] overflow-auto">
      <div className="min-w-64 max-w-64 h-screen text- flex-col gap-4 hidden lg:flex fixed">
        <Nav />
      </div>
      <div className="p-3 flex items-center justify-between lg:hidden bg-zinc-100 border-b-[0.0125rem] border-zinc-300">
        <MobileNavDrawer>
          <div className="w-full h-screen flex flex-col gap-4 rounded-r-2xl shadow-sm">
            <Nav />
          </div>
        </MobileNavDrawer>
        <img
          src={userQuery.data.image ?? ""}
          className="rounded-xl size-10"
          alt=""
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="bg-white lg:my-2 lg:ml-64 lg:mr-2 rounded-2xl w-full lg:border-[0.0125rem] lg:border-zinc-400/60 lg:shadow-sm">
        {props.children}
      </div>
    </div>
  );
};
