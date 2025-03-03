import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { Drawer } from "vaul";
import { getUserQuery, useSignIn, useSignOut } from "~/lib/auth/auth-api";

const SidebarMenu = () => {
  return (
    <Drawer.Root direction="right">
      <Drawer.Trigger className="relative flex h-10 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-4 text-sm font-medium shadow-sm transition-all hover:bg-[#FAFAFA] dark:bg-[#161615] dark:hover:bg-[#1A1A19] dark:text-white">
        Open Drawer
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className="right-2 top-2 bottom-2 fixed z-10 outline-none w-[310px] flex"
          // The gap between the edge of the screen and the drawer is 8px in this case.
          style={
            { "--initial-transform": "calc(100% + 8px)" } as React.CSSProperties
          }
        >
          <div className="bg-zinc-50 h-full w-full grow p-5 flex flex-col rounded-[16px]">
            <div className="max-w-md mx-auto">
              <Drawer.Title className="font-medium mb-2 text-zinc-900">
                It supports all directions.
              </Drawer.Title>
              <Drawer.Description className="text-zinc-600 mb-2">
                This one specifically is not touching the edge of the screen,
                but that&apos;s not required for a side drawer.
              </Drawer.Description>
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
  const signOut = useSignOut();

  if (userQuery.data) return <SidebarMenu />;

  return <button onClick={() => signIn.mutate()}>Sign In</button>;
};

const NavLinks = () => {
  return (
    <nav>
      <ul className="flex gap-4">
        <li>
          <Link to="/articles" className="hover:text-sky-600">
            Articles
          </Link>
        </li>
        {/* <li>
          <a href="/people" className="hover:text-sky-600">
            People
          </a>
        </li> */}
      </ul>
    </nav>
  );
};

const BayGullText = () => (
  <h1 className="font-black text-2xl font-serif text-center">The Bay Gull</h1>
);

const ExpandedHeader: React.FC<{ ref: React.Ref<HTMLDivElement> }> = (
  props
) => {
  return (
    <header
      key="expanded-header"
      ref={props.ref}
      className="w-full border-b border-neutral-200 bg-white"
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
      className="fixed top-0 w-full border-b border-neutral-700 bg-neutral-800 text-white shadow-md"
      initial={{ y: -20 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      <div className="max-w-[100rem] h-12 py-6 px-4 md:mx-auto md:w-[80%] lg:w-[85%] 2xl:w-[90%] flex items-center justify-between">
        <NavLinks />
        <Link to="/">
          <BayGullText />
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
