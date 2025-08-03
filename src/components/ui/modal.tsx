import React, {
  ComponentProps,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import {
  Modal as AriaModal,
  Dialog,
  DialogTrigger,
  ModalOverlay,
  OverlayTriggerStateContext,
  type DialogProps,
  Heading,
} from "react-aria-components";
import { Button } from "./button";
import { cn } from "~/lib/cn";

const MODAL_SIZES = {
  sm: "max-w-sm",
  base: "max-w-md",
  md: "max-w-3xl",
  screen: "max-w-7xl",
} as const;

type ModalProps = Omit<
  ComponentProps<typeof AriaModal>,
  "children" | "className"
> & {
  children: DialogProps["children"];
  role?: DialogProps["role"];
  size?: keyof typeof MODAL_SIZES;
};

export const Modal: React.FC<ModalProps> = ({
  children,
  role = "dialog",
  size = "base",
  ...props
}) => {
  return (
    <ModalOverlay
      isDismissable={role === "dialog"}
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      className={({ isEntering, isExiting }) =>
        cn(
          "fixed inset-0 z-50 flex min-h-full justify-center bg-white/20 backdrop-blur-xs p-3 items-center",
          {
            "animate-in fade-in-0 fill-mode-forwards md:zoom-in-95 duration-150 ease-out":
              isEntering,
            "animate-out fade-out-0 fill-mode-forwards md:zoom-out-100 duration-150 ease-in":
              isExiting,
          }
        )
      }
    >
      <AriaModal
        className={({ isEntering, isExiting }) =>
          cn(
            "w-full overflow-hidden rounded-xl border-[0.0125rem] border-neutral-300/70 bg-white shadow-sm",
            {
              "animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-forwards duration-150 ease-out":
                isEntering,
              "animate-out fade-out-0 slide-out-to-bottom-16 fill-mode-forwards md:slide-out-to-bottom-2 duration-150 ease-in":
                isExiting,
            },
            MODAL_SIZES[size]
          )
        }
        isDismissable={role === "dialog"}
        {...props}
      >
        <Dialog role={role} className="flex flex-col gap-2 outline-none">
          {children}
        </Dialog>
      </AriaModal>
    </ModalOverlay>
  );
};

type ModalBodyProps = Omit<ComponentProps<"div">, "className">;

export const ModalBody: React.FC<ModalBodyProps> = (props) => {
  return <div {...props} className="flex flex-col gap-4 px-10 py-6" />;
};

ModalBody.displayName = "ModalBody";

type ModalHeaderProps = Omit<ComponentProps<"div">, "className">;

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  ...props
}) => {
  return (
    <div {...props} className="my-3 flex flex-col gap-2">
      {children}
    </div>
  );
};

ModalHeader.displayName = "ModalFooter";

type ModalFooterProps = Omit<ComponentProps<"div">, "className">;

export const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  ...props
}) => {
  const state = useContext(OverlayTriggerStateContext);

  return (
    <div
      {...props}
      className="flex w-full justify-end gap-2 border-t-[0.0125rem] border-neutral-300/70 px-10 py-4"
    >
      <Button onPress={() => state?.close()} variant="ghost">
        Close
      </Button>

      {children}
    </div>
  );
};

ModalHeader.displayName = "ModalFooter";

type ModalHeadingProps = Omit<ComponentProps<"p">, "className">;

export const ModalHeading: React.FC<ModalHeadingProps> = (props) => {
  return (
    <Heading
      {...props}
      className="text-lg font-medium tracking-tight"
      slot="title"
    />
  );
};

ModalHeading.displayName = "ModalHeading";

type ModalDescriptionProps = Omit<ComponentProps<"p">, "className">;

export const ModalDescription: React.FC<ModalDescriptionProps> = (props) => {
  return <p {...props} className="text-sm text-neutral-500" />;
};

ModalDescription.displayName = "ModalDescription";
