import { motion, MotionConfig } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Radio } from "@baygull/ui/aria";
import { cn } from "@baygull/ui/cn";

const articleTypes = [
  {
    value: "default" as const,
    label: "Default",
    graphic: (
      <div className="flex flex-col w-full gap-2">
        <div className="w-full bg-zinc-100 h-2 rounded-xs" />
        <div className="flex gap-2">
          <div className="w-full bg-zinc-100 h-[32] rounded-xs flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6 text-neutral-300"
            >
              <path
                fillRule="evenodd"
                d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="w-full bg-zinc-100 h-2 rounded-xs" />
            <div className="w-full bg-zinc-100 h-2 rounded-xs" />
            <div className="w-full bg-zinc-100 h-2 rounded-xs" />
          </div>
        </div>
        <div className="w-full bg-zinc-100 h-2 rounded-xs" />
      </div>
    ),
    description:
      "A standard article with primarily text content with some multimedia content thrown in the mix. If you're uncertain, start with a default article.",
  },
  {
    value: "headline" as const,
    label: "Headline",
    graphic: (
      <>
        <div className="flex flex-col w-full gap-2">
          <div className="w-full bg-zinc-100 h-2 rounded-xs" />
        </div>
      </>
    ),
    description:
      "Have a funny pitch but not quite enough to write a full article? We can publish just a headline without any content.",
  },
  {
    value: "graphic" as const,
    label: "Graphic",
    graphic: (
      <div className="flex flex-col w-full gap-2">
        <div className="w-full bg-zinc-100 h-2 rounded-xs" />
        <div className="w-full bg-zinc-100 h-18 rounded-xs flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-8 text-neutral-300"
          >
            <path
              fillRule="evenodd"
              d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    ),
    description:
      "Created a piece of art? Have a funny drawing, comic, or meme? We can publish your art as it's own standalone article.",
  },
];

export type TArticleType = (typeof articleTypes)[number]["value"];

const TypeRadio: React.FC<
  React.PropsWithChildren<{
    value: string;
    graphic: React.ReactNode;
    label: string;
    description: string;
    isCollapsed: boolean;
  }>
> = (props) => (
  <Radio
    value={props.value}
    className={({ isSelected, isDisabled }) =>
      cn(
        "relative flex grow items-center gap-4 px-4 py-3 rounded-md border-[0.0125rem] border-zinc-300/70 transition-colors shadow-xs",
        isSelected && "border-transparent text-white",
        isDisabled && "opacity-70 cursor-not-allowed"
      )
    }
  >
    {!props.isCollapsed && (
      <div className="flex-1 z-20 flex items-center justify-center w-full">
        {props.graphic}
      </div>
    )}
    <div className="flex-[3]">
      <p
        className={cn(
          "font-medium z-20 relative",
          props.isCollapsed && "text-center"
        )}
      >
        {props.label}
      </p>
      {!props.isCollapsed && (
        <p className="text-sm z-20 relative">{props.description}</p>
      )}
    </div>
    {props.children}
  </Radio>
);

export const ArticleTypeRadio: React.FC<{
  isSelected: (value: TArticleType) => boolean;
  isCollpased: boolean;
}> = (props) => {
  return (
    <>
      {articleTypes.map((type) => (
        <TypeRadio key={type.value} {...type} isCollapsed={props.isCollpased}>
          {props.isSelected(type.value) && (
            <motion.span
              layoutId="type-radio-bubble"
              className="absolute inset-0 z-10 bg-linear-to-tr from-sky-600 to-sky-500/70 shadow-inner rounded-md transition-colors"
              transition={{
                type: "spring",
                bounce: 0.3,
                duration: 0.3,
              }}
            />
          )}
        </TypeRadio>
      ))}
    </>
  );
};

//
