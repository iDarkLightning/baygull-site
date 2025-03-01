import React, { useEffect, useRef, useState, type ElementRef } from "react";
import { useInView } from "react-intersection-observer";
import { AnimatePresence, motion } from "framer-motion";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getUserQuery, useSignIn, useSignOut } from "~/lib/auth/auth-api";

const Account = () => {
  const userQuery = useSuspenseQuery(getUserQuery());

  const signIn = useSignIn();
  const signOut = useSignOut();

  if (userQuery.data)
    return <button onClick={() => signOut.mutate()}>Sign Out</button>;

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
      className="fixed top-0 w-full border-b border-neutral-200 bg-white shadow-md"
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
