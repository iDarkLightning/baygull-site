import React, { createContext, useContext, useRef } from "react";
import { createStore, StoreApi, useStore } from "zustand";
import { type User } from "../db/schema";

type TArticlePublishFormStore = {
  // Step Controls
  step: number;
  incrementStep: () => void;
  decrementStep: () => void;

  name: string;
  description: string;
  slug: string;

  submitInfo: (data: {
    name: string;
    description: string;
    slug: string;
  }) => void;

  // Cover Image
  coverImg: string | File | null;
  setCoverImg: (file: File | null) => void;

  // Users
  users: { user: User }[];

  // content
  content: string;
  setContent: (content: string) => void;
};

type TArticlePublishFormInit = Pick<
  TArticlePublishFormStore,
  "name" | "description" | "coverImg" | "content" | "users"
>;

export const createArticlePublishFormStore = (
  initProps: TArticlePublishFormInit
) => {
  return createStore<TArticlePublishFormStore>()((set) => ({
    ...initProps,
    step: 0,
    incrementStep: () =>
      set((state) => ({
        step: state.step + 1,
      })),
    decrementStep: () =>
      set((state) => ({
        step: state.step - 1,
      })),

    slug: "",
    submitInfo: (data) =>
      set({
        name: data.name,
        description: data.description,
        slug: data.slug,
      }),

    setCoverImg: (file) => set({ coverImg: file }),

    setContent: (content) => set({ content }),
  }));
};

const ArticlePublishFormStoreContext =
  createContext<StoreApi<TArticlePublishFormStore> | null>(null);

export const ArticlePublishFormStoreProvider: React.FC<
  React.PropsWithChildren<TArticlePublishFormInit>
> = (props) => {
  const storeRef = useRef<StoreApi<TArticlePublishFormStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createArticlePublishFormStore(props);
  }

  return (
    <ArticlePublishFormStoreContext.Provider value={storeRef.current}>
      {props.children}
    </ArticlePublishFormStoreContext.Provider>
  );
};

export const useArticlePublishFormStore = <T,>(
  selector: (state: TArticlePublishFormStore) => T
): T => {
  const store = useContext(ArticlePublishFormStoreContext);
  if (!store)
    throw new Error(
      "Missing ArticlePublishFormStoreContext.Provider in the tree"
    );

  return useStore(store, selector);
};
