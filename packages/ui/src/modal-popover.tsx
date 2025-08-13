import React from "react";
import { Modal } from "./modal";
import { Popover } from "./popover";
import useWindowSize from "./hooks/use-window-size";

type ModalPopoverProps = {
  modalProps?: React.ComponentProps<typeof Modal>;
  popoverProps?: React.ComponentProps<typeof Popover>;
};

export const ModalPopover: React.FC<
  React.PropsWithChildren<ModalPopoverProps>
> = (props) => {
  const { windowSize, loading } = useWindowSize();

  if (loading || !windowSize.width || windowSize.width >= 768) {
    return <Popover {...props.popoverProps}>{props.children}</Popover>;
  }

  return (
    <>
      <Modal {...props.modalProps}>{props.children}</Modal>
    </>
  );
};
