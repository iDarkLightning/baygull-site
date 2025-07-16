import React, { createContext, useContext, useRef } from "react";
import { createStore, StoreApi, useStore } from "zustand";
import { type User } from "../db/schema";
import { DateRange, Key } from "react-aria-components";

type TDatePresets =
  | "none"
  | "today"
  | "week"
  | "month"
  | "year"
  | "sem"
  | "academic";

type TDraftFilterStore = {
  statuses: Set<Key>;
  setStatuses: (statuses: Set<Key>) => void;
  authors: Set<Key>;
  setAuthors: (setAuthors: Set<Key>) => void;
  titleDesc: string;
  setTitleDesc: (titleDesc: string) => void;
  submissionTime: DateRange | null;
  setSubmissionTime: (submissionTime: DateRange) => void;
  presetSelected: TDatePresets;
  setPresetSelected: (preset: TDatePresets) => void;
};

type TDraftFilterInit = Pick<
  TDraftFilterStore,
  "statuses" | "authors" | "titleDesc" | "submissionTime" | "presetSelected"
>;

export const createDraftFilterStore = (initProps: TDraftFilterInit) => {
  return createStore<TDraftFilterStore>()((set) => ({
    ...initProps,
    setStatuses: (statuses) => set({ statuses }),
    setAuthors: (authors) => set({ authors }),
    setTitleDesc: (titleDesc) => set({ titleDesc }),
    setSubmissionTime: (submissionTime) => set({ submissionTime }),
    setPresetSelected: (presetSelected) => set({ presetSelected }),
  }));
};

const DraftFilterStoreContext =
  createContext<StoreApi<TDraftFilterStore> | null>(null);

export const DraftFilterStoreProvider: React.FC<
  React.PropsWithChildren<TDraftFilterInit>
> = (props) => {
  const storeRef = useRef<StoreApi<TDraftFilterStore> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createDraftFilterStore(props);
  }

  return (
    <DraftFilterStoreContext.Provider value={storeRef.current}>
      {props.children}
    </DraftFilterStoreContext.Provider>
  );
};

export const useDraftFilterStore = <T,>(
  selector: (state: TDraftFilterStore) => T
): T => {
  const store = useContext(DraftFilterStoreContext);
  if (!store)
    throw new Error("Missing DraftFilterStoreContext.Provider in the tree");

  return useStore(store, selector);
};
