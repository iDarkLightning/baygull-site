import React, { ComponentProps, type ComponentPropsWithoutRef } from "react";
import {
  Select as AriaSelect,
  SelectValue as AriaSelectValue,
  Header,
  ListBoxItem as Item,
  ListBox,
  SelectContext,
} from "react-aria-components";
import { cn } from "../cn";
import { Button } from "./button";
import { ChevronDownIcon } from "./icons";
import { Popover } from "./popover";

type SelectProps = Omit<
  ComponentProps<typeof AriaSelect>,
  "onSelectionChange"
> & {
  onChange?: ComponentPropsWithoutRef<typeof AriaSelect>["onSelectionChange"];
};

export const Select: React.FC<SelectProps> = ({
  onChange,
  className,
  ...props
}) => (
  <SelectContext.Provider value={{ placeholder: props.placeholder }}>
    <AriaSelect
      onSelectionChange={onChange}
      className={cn(className, "flex flex-col gap-2")}
      {...props}
    />
  </SelectContext.Provider>
);

type SelectItemProps = Omit<ComponentProps<typeof Item>, "className">;

export const SelectItem: React.FC<SelectItemProps> = (props) => {
  return (
    <Item
      className={({
        isSelected,
        isDisabled,
        isFocused,
        isHovered,
        isFocusVisible,
      }) =>
        cn(
          "mx-1.5 my-1 flex cursor-default flex-col rounded-md px-2 py-1.5 pointer-coarse:py-2.5 text-sm text-neutral-600 font-medium outline-none transition-[background-color]",
          {
            "bg-neutral-100": isFocusVisible,
            "bg-neutral-100 text-neutral-800 outline-none":
              isHovered && !isDisabled,
            // "bg-sky-800/80 text-white": isSelected,
            // "bg-sky-900/80 text-white": isSelected && (isHovered || isFocused),
            "cursor-not-allowed opacity-70": isDisabled,
          }
        )
      }
      {...props}
    />
  );
};

SelectItem.displayName = "SelectItem";

type SelectTriggerProps = Omit<
  ComponentProps<typeof AriaSelectValue> & {
    btnProps?: Omit<ComponentPropsWithoutRef<typeof Button>, "children">;
    leadingVisual?: React.ReactNode;
    hideDescription?: boolean;
  },
  "className"
>;

export const SelectTrigger: React.FC<SelectTriggerProps> = ({
  btnProps,
  leadingVisual,
  hideDescription = false,
  ...props
}) => {
  return (
    <Button {...btnProps} size="max" trailingVisual={<ChevronDownIcon />}>
      <span
        className={cn(
          "flex flex-col items-start gap-0.5",
          !!leadingVisual && "my-2"
        )}
      >
        {!!leadingVisual && leadingVisual}
        <AriaSelectValue
          className={cn(
            hideDescription
              ? "[&>*[slot='description']]:hidden"
              : "flex flex-col items-start [&>*[slot='description']]:mb-1 [&>*[slot='description']]:mr-4 [&>*[slot='label']]:mt-1"
          )}
          {...props}
        />
      </span>
    </Button>
  );
};

SelectTrigger.displayName = "SelectTrigger";

type SelectBodyProps = Omit<ComponentProps<typeof ListBox>, "className"> & {
  popoverProps?: Omit<ComponentProps<typeof Popover>, "className">;
};

export const SelectBody: React.FC<SelectBodyProps> = ({
  popoverProps,
  children,
  ...props
}) => {
  return (
    <Popover {...popoverProps}>
      <ListBox className="outline-none" {...props}>
        {children}
      </ListBox>
    </Popover>
  );
};

SelectBody.displayName = "SelectBody";

type SelectHeadingProps = Omit<ComponentProps<typeof Header>, "className">;

export const SelectHeading: React.FC<SelectHeadingProps> = (props) => {
  return (
    <Header
      className="mx-1.5 border-b-[0.0125rem] border-neutral-300/40 px-4 py-2 text-xs font-medium"
      {...props}
    />
  );
};

SelectHeading.displayName = "SelectHeading";

// export const SelectLabel = forwardRef<
//   ElementRef<typeof Text>,
//   Omit<ComponentPropsWithoutRef<typeof Text>, "slot" | "className">
// >((props, ref) => {
//   return <Text {...props} ref={ref} slot="label" className="text-white" />;
// });

// SelectLabel.displayName = "SelectLabel";

// export const SelectDescription = forwardRef<
//   ElementRef<typeof Text>,
//   Omit<ComponentPropsWithoutRef<typeof Text>, "slot" | "className">
// >((props, ref) => {
//   return (
//     <Text
//       {...props}
//       ref={ref}
//       slot="description"
//       className="text-sm text-neutral-50"
//     />
//   );
// });
