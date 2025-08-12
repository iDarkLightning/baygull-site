import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, linkOptions, MatchRoute } from "@tanstack/react-router";
import { Drawer } from "vaul";
import { cn } from "~/lib/cn";
import { useTRPC } from "~/lib/trpc-client";
import { Button } from "../ui/button";
import {
  ArchiveBoxIcon,
  DocumentDuplicatesIcon,
  GlobeIcon,
  MenuIcon,
  PencilSquareIcon,
  PeopleIcon,
} from "../ui/icons";

import { motion } from "framer-motion";
import React, { useState } from "react";

const tabs = [
  {
    id: "articles",
    label: "Articles",
    tabs: linkOptions([
      {
        id: "published-tab",
        // @ts-ignore
        name: "Published",
        to: "/manage/a/$status",
        params: {
          status: "published",
        },
        icon: GlobeIcon,
      },
      {
        id: "drafts-tab",
        // @ts-ignore
        name: "Drafts",
        to: "/manage/a/$status",
        params: {
          status: "drafts",
        },
        icon: PencilSquareIcon,
      },
      {
        id: "archived-tab",
        // @ts-ignore
        name: "Archived",
        to: "/manage/a/$status",
        params: {
          status: "archived",
        },
        icon: ArchiveBoxIcon,
      },
    ]),
  },
];

const Nav: React.FC<{
  isCollapsed?: boolean;
}> = ({ isCollapsed = false }) => {
  const trpc = useTRPC();
  const userQuery = useSuspenseQuery(trpc.user.me.queryOptions());

  if (!userQuery.data) throw new Error("Impossible state!");

  return (
    <>
      <div
        className={cn(
          "flex gap-2 items-center border-b-[0.0125rem] border-zinc-400/60 p-3 flex-1/12",
          isCollapsed && "justify-center"
        )}
      >
        <img src="/logo.png" alt="" className="size-12" />
        {!isCollapsed && (
          <div className="leading-5">
            <p className="font-semibold">The Bay Gull</p>
            <p className="font-medium text-xs text-sky-700">Admin</p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4 flex-10/12 my-2">
        {tabs.map((tab) => (
          <div key={tab.id}>
            {!isCollapsed && (
              <p className="font-semibold text-neutral-500 text-xs mx-3 px-1.5 mb-2">
                {tab.label}
              </p>
            )}

            <div
              className={cn(
                "flex flex-col gap-1",
                isCollapsed && "items-center"
              )}
            >
              {tab.tabs.map((tab) => (
                <Link
                  to={tab.to}
                  params={tab.params}
                  search={(prev) => {
                    return Object.fromEntries(
                      Object.entries(prev).filter(
                        ([_, value]) => value !== undefined
                      )
                    );
                  }}
                  key={`${tab.id}-${tab.id}`}
                  className={cn(
                    "relative cursor-default p-1.5 mx-3 font-medium text-xs text-neutral-500 flex items-center gap-2 rounded-md hover:bg-zinc-200/40 transition-colors",
                    "focus:outline-none focus-visible:ring-[1.25px] focus-visible:ring-sky-800",
                    isCollapsed &&
                      "aspect-square flex items-center justify-center size-10"
                  )}
                >
                  <MatchRoute to={tab.to} params={tab.params} fuzzy>
                    {(match) =>
                      match && (
                        <motion.span
                          layoutId="bubble"
                          className="absolute inset-0 z-10 bg-zinc-200/40 shadow-inner mix-bled-difference rounded-md hover:bg-azinc-200/40 transition-colors border-[0.0125rem] border-zinc-400/60 shaadow-sm"
                          transition={{
                            type: "spring",
                            bounce: 0.4,
                            duration: 0.8,
                          }}
                        />
                      )
                    }
                  </MatchRoute>
                  <span className="z-20">
                    <tab.icon className={isCollapsed ? "size-5" : "size-4"} />
                  </span>
                  {!isCollapsed && (
                    <p className="text-neutral-700 font-medium z-20">
                      {tab.name}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div
        className={cn(
          "flex-1/12 items-center gap-2 p-3 border-t-[0.0125rem] border-zinc-400/60 lg:flex hidden",
          isCollapsed && "justify-center"
        )}
      >
        <img
          src={userQuery.data.image ?? ""}
          className="rounded-xl size-10"
          alt=""
          referrerPolicy="no-referrer"
        />
        {!isCollapsed && (
          <div className="leading-6">
            <p className="font-medium">{userQuery.data.name}</p>
            <p className="text-neutral-800 text-xs">{userQuery.data.email}</p>
          </div>
        )}
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
        <Drawer.Overlay className="fixed inset-0 z-50 bg-zinc-300/50 backdrop-blur-xs" />
        <Drawer.Content
          className="left-0 top-0 bottom-0 fixed z-50 outline-none w-64 flex bg-[#F6F6F6] rounded-e-lg"
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

  const isCollapsed = false;

  return (
    <div className="font-sans flex flex-col lg:flex-row lg:h-screen w-screen bg-zinc-50 overflow-auto">
      <div
        className={cn(
          "w-64 h-screen text- flex-col gap-4 hidden lg:flex fixed",
          isCollapsed && "w-18"
        )}
      >
        <Nav isCollapsed={isCollapsed} />
      </div>
      <div className="p-3 flex items-center justify-between lg:hidden bg-zinc-50 ">
        <MobileNavDrawer>
          <div className="w-full h-screen flex flex-col gap-4 rounded-r-lg shadow-sm">
            <Nav />
          </div>
        </MobileNavDrawer>
        <img
          src={userQuery.data.image ?? ""}
          className="rounded-xl size-10"
          alt={userQuery.data.name + "profile-photo"}
          referrerPolicy="no-referrer"
        />
      </div>
      <div
        className={cn(
          "bg-white m-2 grow lg:ml-64 lg:mr-2 rounded-lg min-h-[calc(100vh-80px)] lg:min-h-[calc(100vh-20px)] h-fit pb-2 lg:w-full lg:min-w-min z-50 border-[0.0125rem] border-zinc-400/60 shadow-sm flex flex-col",
          isCollapsed && "lg:ml-18"
        )}
      >
        {props.children}
      </div>
    </div>
  );
};
