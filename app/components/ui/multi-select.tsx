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
  Input,
  type Key,
  ListBox,
  Menu,
  SearchField,
  useFilter,
} from "react-aria-components";
import useMeasure from "react-use-measure";
import { cn } from "~/lib/cn";
import { Checkbox } from "./checkbox";
import { ChevronUpDownIcon, XMarkIcon } from "./icons";
import { inputBase } from "./input";
import { Popover, PopoverTrigger } from "./popover";
import { ResizablePanel } from "./resizable-panel";
import { SelectItem } from "./select";

type TMultiSelectContext = {
  selectedKeys: Set<Key>;
  setSelectedKeys: React.Dispatch<React.SetStateAction<Set<Key>>>;
  triggerControl: ReturnType<typeof useMeasure>;
};

const MultiSelectContext = createContext<TMultiSelectContext | null>(null);

const useMultiSelect = () => {
  const contextValue = useContext(MultiSelectContext);

  if (!contextValue)
    throw new Error("MultiSelectContext must be used inside MultiSelect");

  return contextValue;
};

export const MultiSelect: React.FC<
  React.PropsWithChildren<{
    selectedKeys: Set<Key>;
    setSelectedKeys: (keys: Set<Key>) => void;
  }>
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

type MultiSelectTriggerProps = ComponentProps<typeof PopoverTrigger> & {
  btnProps?: Omit<ComponentPropsWithoutRef<typeof Button>, "className"> & {
    placeholder?: string;
  };
};

export const MultiSelectTrigger: React.FC<MultiSelectTriggerProps> = ({
  btnProps,
  ...props
}) => {
  const { triggerControl, selectedKeys, setSelectedKeys } = useMultiSelect();

  const { pressProps } = usePress({
    preventFocusOnPress: true,
    onPress: (e) => {
      const newSet = new Set(
        [...selectedKeys].filter(
          (i) => i !== e.target.parentElement?.textContent
        )
      );

      setSelectedKeys(newSet);
    },
  });

  return (
    <PopoverTrigger>
      <Button
        {...btnProps}
        className={cn(
          inputBase(),
          "w-full flex items-center justify-between focus-visible:ring-sky-800"
        )}
        ref={triggerControl[0]}
      >
        <span className="flex gap-1.5 overflow-x-auto overflow-y-hidden [scrollbar-width:none] hover:[scrollbar-width:thin]">
          {selectedKeys.size === 0 && btnProps?.placeholder && (
            <p>{btnProps.placeholder}</p>
          )}
          {selectedKeys.size > 0 &&
            [...selectedKeys].map((key, index) => (
              <div
                key={index}
                className="py-0.5 group px-3 border w-fit border-neutral-400 text-neutral-700 rounded-full font-sans text-xs font-medium flex gap-1 items-center whitespace-nowrap shadow-sm"
              >
                <p>{key}</p>
                <span
                  className="hidden group-hover:block animate-in slide-in-from-left-0.5 ease-in-out delay-150"
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
    </PopoverTrigger>
  );
};

type MultiSelectBodyProps = Omit<
  ComponentProps<typeof Menu>,
  "className" | "selectionMode" | "selectedKeys" | "onSelectionChange"
> & {
  popoverProps?: Omit<
    ComponentProps<typeof Popover>,
    "className" | "triggerWidth"
  >;
};

export const MultiSelectBody: React.FC<MultiSelectBodyProps> = ({
  popoverProps,
  children,
  ...props
}) => {
  const { selectedKeys, setSelectedKeys, triggerControl } = useMultiSelect();
  const { contains } = useFilter({ sensitivity: "base" });

  return (
    <Popover triggerWidth={triggerControl[1].width} {...popoverProps}>
      <AutoComplete filter={contains}>
        <SearchField
          className="px-2"
          aria-label="Search multi select"
          autoFocus
        >
          <Input
            className={cn(
              inputBase(),
              "focus-visible:ring-0 border-0 shadow-none"
            )}
            placeholder="Search..."
          />
        </SearchField>
        <ResizablePanel>
          <ListBox
            selectionMode="multiple"
            shouldFocusWrap
            selectedKeys={selectedKeys}
            onSelectionChange={(keys) =>
              typeof keys !== "string" && setSelectedKeys(keys)
            }
            className="max-h-52 overflow-auto min-w-max border-t-[0.0125rem] border-zinc-300/70"
            {...props}
          >
            {children}
          </ListBox>
        </ResizablePanel>
      </AutoComplete>
    </Popover>
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
