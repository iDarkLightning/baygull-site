import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Drawer } from "vaul";
import { getUserQuery, useSignIn, useSignOut } from "~/lib/auth/auth-api";
import { Button } from "./ui/button";
import { MenuIcon, PencilSquareIcon, UserIcon } from "./ui/icons";

const SidebarMenu = () => {
  const userQuery = useSuspenseQuery(getUserQuery());
  const signOut = useSignOut();
  const [isOpen, setIsOpen] = useState(false);

  if (userQuery.data === null) throw new Error("Impossible state!");

  return (
    <Drawer.Root direction="right" open={isOpen} onOpenChange={setIsOpen}>
      <Button size="icon" variant="ghost" onPress={() => setIsOpen(true)}>
        <MenuIcon />
      </Button>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className="right-2 top-2 bottom-2 fixed z-10 outline-none w-[310px] flex"
          // The gap between the edge of the screen and the drawer is 8px in this case.
          style={
            { "--initial-transform": "calc(100% + 8px)" } as React.CSSProperties
          }
        >
          <div className="bg-zinc-50 h-full w-full grow p-5 flex flex-col rounded-[16px] font-sans">
            <div className="max-w-md flex flex-col gap-4 h-full justify-between">
              <div className="flex items-center gap-3 border-b-[0.0125rem] border-b-neutral-200 pb-4 flex-1/12">
                <img
                  src={userQuery.data.image ?? ""}
                  className="rounded-full w-14"
                  alt=""
                  referrerPolicy="no-referrer"
                />
                <div className="leading-4">
                  <p className="font-semibold text-lg">{userQuery.data.name}</p>
                  <p className="text-neutral-600">{userQuery.data.email}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-11/12">
                <Link
                  to="/articles/submit"
                  className="flex gap-2 items-center p-2 hover:bg-neutral-200 transition-colors rounded-full px-4 text-neutral-800"
                >
                  <span>
                    <PencilSquareIcon />
                  </span>
                  <span>Submit Article</span>
                </Link>
                {/* <Link to="/articles/submit">View Drafts</Link> */}
              </div>
              <div className="flex-1/12">
                <Button onPress={() => signOut.mutate()} fullWidth>
                  Sign Out
                </Button>
              </div>
              {/* <Drawer.Title className="font-medium mb-2 text-zinc-900">
                It supports all directions.
              </Drawer.Title>
              <Drawer.Description className="text-zinc-600 mb-2">
                This one specifically is not touching the edge of the screen,
                but that&apos;s not required for a side drawer.
              </Drawer.Description> */}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

const Account = () => {
  const userQuery = useSuspenseQuery(getUserQuery());

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

const ExpandedHeader: React.FC<{ ref: React.Ref<HTMLDivElement> }> = (
  props
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
      className="fixed top-0 w-full border-b border-neutral-700 bg-neutral-800 text-white shadow-md dark"
      initial={{ y: -20 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      <div className="max-w-[100rem] h-12 py-6 px-4 md:mx-auto md:w-[80%] lg:w-[85%] 2xl:w-[90%] flex items-center justify-between">
        <NavLinks />
        <Link to="/">
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
    <AnimatePresence>
      <ExpandedHeader ref={ref} />
      {collapsed && (scrollY !== 0 || !inView) && <CollapsedHeader />}
    </AnimatePresence>
  );
};
