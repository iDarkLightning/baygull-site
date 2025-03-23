import { Link } from "@tanstack/react-router";
import {
  DocumentDuplicatesIcon,
  MenuIcon,
  PencilSquareIcon,
  PeopleIcon,
} from "../ui/icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getUserQuery } from "~/lib/auth/auth-api";
import { Drawer } from "vaul";
import { Button } from "../ui/button";
import { useState } from "react";

const tabs = [
  {
    id: "articles-tab",
    name: "Articles",
    link: "/articles",
    icon: DocumentDuplicatesIcon,
  },
  {
    id: "drafts-tab",
    name: "Drafts",
    link: "/test",
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
  const userQuery = useSuspenseQuery(getUserQuery());

  if (userQuery.data === null) throw new Error("Impossible state!");

  return (
    <>
      <div className="flex gap-2 items-center border-b-[0.0125rem] border-zinc-800 p-3 flex-1/12">
        <img src="/logo.png" alt="" className="size-12" />
        <div className="leading-5">
          <p className="font-semibold">The Bay Gull</p>
          <p className="font-medium text-xs text-cyan-500">Admin</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 flex-10/12 my-2">
        {tabs.map((tab) => (
          <Link
            to={tab.link as any}
            key={tab.id}
            className="px-1.5 mx-4 py-1.5 font-medium text-sm text-neutral-200 flex items-center gap-2 rounded-md hover:bg-zinc-700/80 transition-colors"
            // activeOptions={{ exact: true }}
            activeProps={{
              className:
                "bg-zinc-800 border-[0.0125rem] border-zinc-700 shadow-xs",
            }}
          >
            <tab.icon />
            <p>{tab.name}</p>
          </Link>
        ))}
      </div>
      <div className="flex-1/12 items-center gap-2 p-3 border-t-[0.0125rem] border-zinc-950/5 lg:flex hidden">
        <img
          src={userQuery.data.image ?? ""}
          className="rounded-xl size-10"
          alt=""
          referrerPolicy="no-referrer"
        />
        <div className="leading-6">
          <p className="font-medium">{userQuery.data.name}</p>
          <p className="text-neutral-400 text-xs">{userQuery.data.email}</p>
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
  const userQuery = useSuspenseQuery(getUserQuery());

  if (userQuery.data === null) throw new Error("Impossible state!");

  return (
    <div className="font-sans flex flex-col lg:flex-row">
      <div className="min-w-64 h-screen bg-zinc-950 border-r-[0.0125rem] text-white border-zinc-800 flex-col gap-4 rounded-r-2xl shadow-sm hidden lg:flex">
        <Nav />
      </div>
      <div className="p-3 flex items-center justify-between lg:hidden">
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
      <div className="max-w-[125rem] mx-auto w-full lg:w-[85%] 2xl:w-[90%] font-serif px-4 lg:px-8 py-8">
        {props.children}
      </div>
    </div>
  );
};
