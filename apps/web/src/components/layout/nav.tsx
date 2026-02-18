import { Button } from "@baygull/ui/button";
import {
  LinkIcon,
  ManageIcon,
  MenuIcon,
  PencilSquareIcon,
  UserIcon,
} from "@baygull/ui/icons";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Drawer } from "vaul";
import { useSignIn, useSignOut } from "~/lib/auth-client";
import { useTRPC } from "~/lib/trpc-client";

const SidebarMenu = () => {
  const trpc = useTRPC();
  const userQuery = useSuspenseQuery(trpc.user.me.queryOptions());

  const signOut = useSignOut();
  const [isOpen, setIsOpen] = useState(false);

  if (!userQuery.data) throw new Error("Impossible state!");

  return (
    <Drawer.Root direction="right" open={isOpen} onOpenChange={setIsOpen}>
      <Button size="icon" variant="ghost" onPress={() => setIsOpen(true)}>
        <MenuIcon />
      </Button>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-white/10 backdrop-blur-xs z-50" />
        <Drawer.Content
          className="right-0 top-0 bottom-0 fixed z-[1000] outline-none w-[310px] flex"
          // The gap between the edge of the screen and the drawer is 8px in this case.
          style={
            { "--initial-transform": "calc(100% + 8px)" } as React.CSSProperties
          }
        >
          <div className="bg-zinc-800 text-white shadow-sm border-l-[0.0125rem] border-zinc-700/70 h-full w-full grow p-5 flex flex-col rounded-l-lg font-sans">
            <div className="max-w-md flex flex-col gap-4 h-full justify-between">
              <div className="flex items-center gap-3 border-b-[0.0125rem] border-b-zinc-600 pb-4 flex-1/12">
                <img
                  src={userQuery.data.image ?? ""}
                  className="rounded-full w-10"
                  alt=""
                  referrerPolicy="no-referrer"
                />
                <div className="leading-4">
                  <p className="font-medium">{userQuery.data.name}</p>
                  <p className="text-zinc-400 text-sm">
                    {userQuery.data.email}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-11/12">
                <Link
                  to="/articles/submit"
                  className="flex gap-2 items-center text-sm p-2 hover:bg-neutral-700 transition-colors rounded-full px-4 text-zinc-200"
                >
                  <span>
                    <PencilSquareIcon />
                  </span>
                  <span>Submit Article</span>
                </Link>
                <Link
                  to="/links"
                  className="flex gap-2 items-center text-sm p-2 hover:bg-neutral-700 transition-colors rounded-full px-4 text-zinc-200"
                >
                  <span>
                    <LinkIcon />
                  </span>
                  <span>Quick Links</span>
                </Link>
                {userQuery.data.role === 2 && (
                  <Link
                    to="/manage/a/$status"
                    params={{ status: "drafts" }}
                    className="flex gap-2 items-center text-sm p-2 hover:bg-neutral-700 transition-colors rounded-full px-4 text-zinc-200"
                  >
                    <span>
                      <ManageIcon />
                    </span>
                    <span>Manage</span>
                  </Link>
                )}
              </div>
              <div className="flex-1/12">
                <Button
                  variant="primaryAlt"
                  onPress={() => signOut.mutate()}
                  fullWidth
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

const Account = () => {
  const trpc = useTRPC();
  const userQuery = useSuspenseQuery(trpc.user.me.queryOptions());

  const signIn = useSignIn();

  if (userQuery.data) return <SidebarMenu />;

  return (
    <Button onPress={() => signIn.mutate()} leadingVisual={<UserIcon />}>
      Sign In
    </Button>
  );
};

const NavLinks = () => {
  return (
    <nav>
      <ul className="flex gap-4 font-serif items-center">
        <li>
          <Link
            to="/articles"
            className="dark:hover:text-sky-300 hover:text-sky-700 font-medium"
          >
            Articles
          </Link>
        </li>
      </ul>
    </nav>
  );
};

const BayGullText: React.FC<{ animate?: boolean }> = (props) => (
  <motion.h1
    initial={props.animate ? { y: -40 } : {}}
    animate={props.animate ? { y: 0 } : {}}
    transition={{ duration: 0.35, ease: "easeInOut", delay: 0.02 }}
    className="font-black text-2xl font-serif text-center"
  >
    The Bay Gull
  </motion.h1>
);

export const ExpandedHeader: React.FC<{ ref?: React.Ref<HTMLDivElement> }> = (
  props,
) => {
  return (
    <header
      key="expanded-header"
      ref={props.ref}
      className="w-full border-b border-neutral-200"
    >
      <div className="max-w-[100rem] h-24 py-6 px-4 md:mx-auto md:w-[80%] lg:w-[85%] 2xl:w-[90%] flex items-center justify-between">
        <NavLinks />
        <div>
          <Link to="/" className="bg-white flex flex-col items-center mt-16">
            <img src="/logo.png" alt="Logo" width="108" height="108" />
            <BayGullText />
          </Link>
        </div>
        <nav>
          <Account />
        </nav>
      </div>
    </header>
  );
};

export const CollapsedHeader = () => {
  return (
    <motion.header
      key="collapsed-header"
      className="fixed top-0 w-full border-b border-neutral-700 bg-neutral-800 text-white shadow-md dark z-10"
      initial={{ y: -20 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      <div className="max-w-[100rem] h-12 py-6 px-4 md:mx-auto md:w-[80%] lg:w-[85%] 2xl:w-[90%] flex items-center justify-between">
        <NavLinks />
        <Link to="/" className="-ml-12 flex items-center gap-2">
          <img src="/logo.png" alt="Logo" width="32" height="32" />

          <BayGullText animate />
        </Link>
        <nav>
          <Account />
        </nav>
      </div>
    </motion.header>
  );
};

export const Header = () => {
  const { ref, inView } = useInView({
    initialInView: true,
  });
  const [collapsed, setCollapsed] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (!inView) setCollapsed(true);
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (!inView) {
      timeout = setTimeout(() => setCollapsed(true), 50);
    } else {
      setCollapsed(false);
    }

    return () => clearTimeout(timeout);
  }, [inView]);

  useEffect(() => {
    const listener: EventListener = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", listener);

    return () => window.removeEventListener("scroll", listener);
  }, []);

  return (
    <>
      <ExpandedHeader ref={ref} />
      {collapsed && (scrollY !== 0 || !inView) && <CollapsedHeader />}
    </>
  );
};
