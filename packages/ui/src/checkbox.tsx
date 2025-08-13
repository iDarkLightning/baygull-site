import { Checkbox as AriaCheckbox } from "react-aria-components";
import { cn } from "./cn";

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="currentColor"
    className="size-4"
  >
    <path
      fillRule="evenodd"
      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
      clipRule="evenodd"
    />
  </svg>
);

type CheckboxProps = Omit<
  React.ComponentProps<typeof AriaCheckbox>,
  "className"
>;

export const Checkbox: React.FC<CheckboxProps> = (props) => {
  return (
    <AriaCheckbox
      {...props}
      className={({ isSelected }) =>
        cn(
          "w-4 h-4 rounded-sm bg-white shadow-xs border-zinc-300/70 border-[0.0125rem] flex items-center justify-center transition-[background-color]",
          isSelected && "bg-sky-600 text-white border-transparent"
        )
      }
    >
      {({ isSelected }) => <>{isSelected && <CheckIcon />}</>}
    </AriaCheckbox>
  );
};
