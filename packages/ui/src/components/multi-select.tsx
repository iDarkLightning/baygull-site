import React, {
  ComponentProps,
  ComponentPropsWithoutRef,
  createContext,
  useContext,
} from "react";
import { usePress } from "react-aria";
import {
  Autocomplete as AutoComplete,
  Button,
  DialogTrigger,
  Input,
  type Key,
  ListBox,
  Menu,
  SearchField,
  useFilter,
} from "react-aria-components";
import useMeasure from "react-use-measure";
import { cn } from "../cn";
import { Checkbox } from "./checkbox";
import { ChevronUpDownIcon, XMarkIcon } from "./icons";
import { inputBase } from "./input";
import { ModalPopover } from "./modal-popover";
import { Popover } from "./popover";
import { SelectItem } from "./select";

type TMultiSelectContext = {
  selectedKeys: Set<Key>;
  setSelectedKeys:
    | React.Dispatch<React.SetStateAction<Set<Key>>>
    | ((keys: Set<Key>) => void);
  triggerControl: ReturnType<typeof useMeasure>;
};

const MultiSelectContext = createContext<TMultiSelectContext | null>(null);

export const useMultiSelect = () => {
  const contextValue = useContext(MultiSelectContext);

  if (!contextValue)
    throw new Error("MultiSelectContext must be used inside MultiSelect");

  return contextValue;
};

export const MultiSelect: React.FC<
  React.PropsWithChildren<Omit<TMultiSelectContext, "triggerControl">>
> = (props) => {
  const triggerControl = useMeasure();

  return (
    <MultiSelectContext.Provider
      value={{
        selectedKeys: props.selectedKeys,
        setSelectedKeys: props.setSelectedKeys,
        triggerControl,
      }}
    >
      <div>{props.children}</div>
    </MultiSelectContext.Provider>
  );
};

type MultiSelectTriggerProps = ComponentProps<typeof DialogTrigger> & {
  btnProps?: Omit<ComponentPropsWithoutRef<typeof Button>, "className"> & {
    placeholder?: string;
    isInvalid?: boolean;
  };
  keyDisplayMap?: Map<Key, string>;
};

export const MultiSelectTrigger: React.FC<MultiSelectTriggerProps> = ({
  btnProps,
  keyDisplayMap,
  ...props
}) => {
  const { triggerControl, selectedKeys, setSelectedKeys } = useMultiSelect();

  const { pressProps } = usePress({
    preventFocusOnPress: true,
    onPress: (e) => {
      const newSet = new Set(
        [...selectedKeys].filter((i) => i !== e.target.parentElement?.id)
      );

      setSelectedKeys(newSet);
    },
  });

  return (
    <DialogTrigger>
      <Button
        {...btnProps}
        className={cn(
          inputBase(),
          "w-full flex items-center justify-between focus-visible:ring-sky-800",
          btnProps?.isInvalid && "!border-red-700 focus-visible:ring-red-700"
        )}
        ref={triggerControl[0]}
      >
        <span className="flex gap-1.5 overflow-x-auto overflow-y-hidden [scrollbar-width:none] hover:[scrollbar-width:thin]">
          {selectedKeys.size === 0 && btnProps?.placeholder && (
            <p className="text-neutral-500">{btnProps.placeholder}</p>
          )}
          {selectedKeys.size > 0 &&
            [...selectedKeys].map((key) => (
              <div
                id={key as string}
                key={key}
                className="py-0.5 group px-3 border-[0.0125rem] w-fit border-sky-200 bg-sky-50 text-sky-800 rounded-full font-sans text-xs font-medium flex gap-1 items-center whitespace-nowrap shadow-sm"
              >
                <p>{keyDisplayMap ? keyDisplayMap.get(key) : key}</p>

                <span
                  className="hidden group-hover:block animate ease-in-out fade-in-0 fade-out-0 duration-75 delay-100"
                  {...pressProps}
                >
                  <XMarkIcon />
                </span>
              </div>
            ))}
        </span>
        <span>
          <ChevronUpDownIcon />
        </span>
      </Button>
      {props.children}
    </DialogTrigger>
  );
};

type MultiSelectBodyProps = Omit<
  ComponentProps<typeof Menu>,
  "className" | "selectionMode" | "onSelectionChange"
> & {
  popoverProps?: Omit<
    ComponentProps<typeof Popover>,
    "className" | "triggerWidth"
  >;
  onSelectionChange?: (args: {
    keys: Set<Key>;
    setSelectedKeys: TMultiSelectContext["setSelectedKeys"];
  }) => void;
  autoCompleteProps?: Omit<ComponentProps<typeof AutoComplete>, "children">;
};

export const MultiSelectBody: React.FC<MultiSelectBodyProps> = ({
  popoverProps,
  autoCompleteProps,
  onSelectionChange,
  children,
  ...props
}) => {
  const {
    selectedKeys,
    setSelectedKeys,
    triggerControl: [_, { width }],
  } = useMultiSelect();
  const { contains } = useFilter({ sensitivity: "base" });

  return (
    <ModalPopover popoverProps={{ ...popoverProps, triggerWidth: width }}>
      <AutoComplete
        filter={(textVal, input) => contains(textVal, input.trim())}
        {...autoCompleteProps}
      >
        <SearchField
          className="px-2"
          aria-label="Search multi select"
          autoFocus
        >
          <Input
            className={cn(
              inputBase(),
              "focus-visible:ring-0 border-0 shadow-none w-full"
            )}
            placeholder="Search..."
          />
        </SearchField>
        <ListBox
          selectionMode="multiple"
          shouldFocusWrap
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => {
            if (typeof keys === "string") return;

            if (onSelectionChange) {
              onSelectionChange({ keys, setSelectedKeys });
            } else {
              setSelectedKeys(keys);
            }
          }}
          className="max-h-52 overflow-auto min-w-max border-t-[0.0125rem] border-zinc-300/70"
          {...props}
        >
          {children}
        </ListBox>
      </AutoComplete>
    </ModalPopover>
  );
};

type MultiSelectItemProps = Omit<ComponentProps<typeof SelectItem>, "value"> & {
  children: React.ReactNode;
  value: string;
};

export const MultiSelectItem: React.FC<MultiSelectItemProps> = ({
  value,
  ...props
}) => {
  const { selectedKeys, setSelectedKeys } = useMultiSelect();

  return (
    <SelectItem {...props}>
      {({ isSelected }) => (
        <span className="flex items-center gap-2 group">
          {/* <span className={isSelected ? "" : "hidden group-hover:block"}> */}
          <Checkbox
            isSelected={isSelected}
            onChange={() => {
              if (selectedKeys.has(value)) {
                const newSet = new Set(selectedKeys);
                newSet.delete(value);
                setSelectedKeys(newSet);
              } else {
                const newSet = new Set(selectedKeys);
                newSet.add(value);
                setSelectedKeys(newSet);
              }
            }}
          />
          {/* </span> */}
          {props.children}
        </span>
      )}
    </SelectItem>
  );
};
