import { useState } from "react";

export const useDisclosure = () => {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
    setOpen: setIsOpen,
  };
};

export type UseDisclosure = ReturnType<typeof useDisclosure>