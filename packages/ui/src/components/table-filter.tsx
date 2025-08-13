import React, { createContext, useContext, useState } from "react";
import { Button, DialogTrigger } from "react-aria-components";
import { XMarkIcon } from "./icons";

const FilterDisplayContext = createContext<{
  isMenuActive: boolean;
  setIsMenuActive: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

export const FilterDisplay: React.FC<
  React.PropsWithChildren<{
    isActive: boolean;
  }>
> = (props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FilterDisplayContext.Provider
      value={{
        isMenuActive: isOpen,
        setIsMenuActive: setIsOpen,
      }}
    >
      {(props.isActive || isOpen) && (
        <div className="flex text-xs">{props.children}</div>
      )}
    </FilterDisplayContext.Provider>
  );
};

export const FilterAttribute: React.FC<
  React.PropsWithChildren<{
    icon?: React.ReactNode;
    children: string;
  }>
> = (props) => {
  return (
    <div className="flex gap-2 items-center rounded-s-md h-8 px-4 py-1 border-s-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70">
      {props.icon}
      <p className="text-xs">{props.children}</p>
    </div>
  );
};

export const FilterDescription: React.FC<React.PropsWithChildren> = (props) => {
  return (
    <div className="h-8 px-2 py-1 items-center justify-center border-[0.0125rem] border-zinc-300/70">
      <p className="mt-1">{props.children}</p>
    </div>
  );
};

export const FilterMenu: React.FC<
  React.ComponentProps<typeof DialogTrigger>
> = (props) => {
  const menuControl = useContext(FilterDisplayContext);

  if (menuControl === null)
    throw new Error("FilterDisplayContext must be used inside FilterDisplay");

  return (
    <DialogTrigger
      isOpen={menuControl.isMenuActive}
      onOpenChange={menuControl.setIsMenuActive}
      {...props}
    />
  );
};

export const FilterMenuButton: React.FC<
  Omit<React.ComponentProps<typeof Button>, "className">
> = (props) => {
  return (
    <Button
      className="items-center flex hover:bg-zinc-300/30 transition-colors h-8 px-4 py-1 border-e-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70"
      {...props}
    />
  );
};

export const FilterClear: React.FC<
  Omit<React.ComponentProps<typeof Button>, "className" | "children">
> = (props) => {
  return (
    <Button
      className="flex gap-2 items-center rounded-e-md h-8 px-3 py-1 border-e-[0.0125rem] border-t-[0.0125rem] border-b-[0.0125rem] border-zinc-300/70 hover:bg-zinc-300/30 transition-colors"
      {...props}
    >
      <span className="-mx-1.5">
        <XMarkIcon />
      </span>
    </Button>
  );
};
