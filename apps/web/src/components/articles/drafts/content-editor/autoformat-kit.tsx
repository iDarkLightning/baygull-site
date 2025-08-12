"use client";

import type { AutoformatRule } from "@platejs/autoformat";

import {
  autoformatArrow,
  autoformatLegal,
  autoformatLegalHtml,
  autoformatMath,
  AutoformatPlugin,
  autoformatPunctuation,
  autoformatSmartQuotes,
} from "@platejs/autoformat";
import { toggleList } from "@platejs/list";
import { KEYS } from "platejs";

const autoformatMarks: AutoformatRule[] = [
  {
    match: "***",
    mode: "mark",
    type: [KEYS.bold, KEYS.italic],
  },
  {
    match: "__*",
    mode: "mark",
    type: [KEYS.underline, KEYS.italic],
  },
  {
    match: "__**",
    mode: "mark",
    type: [KEYS.underline, KEYS.bold],
  },
  {
    match: "___***",
    mode: "mark",
    type: [KEYS.underline, KEYS.bold, KEYS.italic],
  },
  {
    match: "**",
    mode: "mark",
    type: KEYS.bold,
  },
  {
    match: "__",
    mode: "mark",
    type: KEYS.underline,
  },
  {
    match: "*",
    mode: "mark",
    type: KEYS.italic,
  },
  {
    match: "_",
    mode: "mark",
    type: KEYS.italic,
  },
  {
    match: "~~",
    mode: "mark",
    type: KEYS.strikethrough,
  },
  {
    match: "^",
    mode: "mark",
    type: KEYS.sup,
  },
  {
    match: "~",
    mode: "mark",
    type: KEYS.sub,
  },
];

const autoformatBlocks: AutoformatRule[] = [
  {
    match: "# ",
    mode: "block",
    type: KEYS.h1,
  },
  {
    match: "## ",
    mode: "block",
    type: KEYS.h2,
  },
  {
    match: "### ",
    mode: "block",
    type: KEYS.h3,
  },

  {
    match: ["---", "—-", "___ "],
    mode: "block",
    type: KEYS.hr,
    format: (editor) => {
      editor.tf.setNodes({ type: KEYS.hr });
      editor.tf.insertNodes({
        children: [{ text: "" }],
        type: KEYS.p,
      });
    },
  },
];

const autoformatLists: AutoformatRule[] = [
  {
    match: ["* ", "- "],
    mode: "block",
    type: "list",
    format: (editor) => {
      toggleList(editor, {
        listStyleType: KEYS.ul,
      });
    },
  },
  {
    match: [String.raw`^\d+\.$ `, String.raw`^\d+\)$ `],
    matchByRegex: true,
    mode: "block",
    type: "list",
    format: (editor, { matchString }) => {
      toggleList(editor, {
        listRestartPolite: Number(matchString) || 1,
        listStyleType: KEYS.ol,
      });
    },
  },
];

export const AutoFormatKit = [
  AutoformatPlugin.configure({
    options: {
      enableUndoOnDelete: true,
      rules: [
        ...autoformatBlocks,
        ...autoformatMarks,
        ...autoformatSmartQuotes,
        ...autoformatPunctuation,
        ...autoformatLegal,
        ...autoformatLegalHtml,
        ...autoformatArrow,
        ...autoformatMath,
        ...autoformatLists,
      ],
    },
  }),
];
