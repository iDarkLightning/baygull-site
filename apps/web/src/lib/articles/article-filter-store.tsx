import React, { createContext, useContext, useRef } from "react";
import { DateRange, Key } from "@baygull/ui/aria";
import { createStore, StoreApi, useStore } from "zustand";
import { TDatePresets } from "~/components/articles/manage/article-table-filter";

type TArticleFilterStore = {
  types: Set<Key>;
  setTypes: (types: Set<Key>) => void;
  authors: Set<Key>;
  setAuthors: (setAuthors: Set<Key>) => void;
  titleDesc: string;
  setTitleDesc: (titleDesc: string) => void;
  submissionTime: DateRange | null;
  setSubmissionTime: (submissionTime: DateRange | null) => void;
  presetSelected: TDatePresets;
  setPresetSelected: (preset: TDatePresets) => void;
};

type TArticleFilterInit = Pick<
  TArticleFilterStore,
  "types" | "authors" | "titleDesc" | "submissionTime" | "presetSelected"
>;

export const createArticleFilterStore = (initProps: TArticleFilterInit) => {
  return createStore<TArticleFilterStore>()((set) => ({
    ...initProps,
    setTypes: (types) => set({ types }),
    setAuthors: (authors) => set({ authors }),
    setTitleDesc: (titleDesc) => set({ titleDesc }),
    setSubmissionTime: (submissionTime) => set({ submissionTime }),
    setPresetSelected: (presetSelected) => set({ presetSelected }),
  }));
};

const ArticleFilterStoreContext =
  createContext<StoreApi<TArticleFilterStore> | null>(null);

export const ArticleFilterStoreProvider: React.FC<
  React.PropsWithChildren<TArticleFilterInit>
> = (props) => {
  const storeRef = useRef<StoreApi<TArticleFilterStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createArticleFilterStore(props);
  }

  return (
    <ArticleFilterStoreContext.Provider value={storeRef.current}>
      {props.children}
    </ArticleFilterStoreContext.Provider>
  );
};

export const useArticleFilterStore = <T,>(
  selector: (state: TArticleFilterStore) => T
): T => {
  const store = useContext(ArticleFilterStoreContext);
  if (!store)
    throw new Error("Missing DraftFilterStoreContext.Provider in the tree");

  return useStore(store, selector);
};
