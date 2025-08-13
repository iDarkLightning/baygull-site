import {
  Label as AriaLabel,
  type LabelProps as AriaLabelProps,
} from "react-aria-components";

type LabelProps = AriaLabelProps & {
  ref?: React.Ref<HTMLLabelElement>;
};

export const Label: React.FC<LabelProps> = (props) => {
  return (
    <AriaLabel
      className="block text-sm font-semibold text-neutral-800 mb-1"
      {...props}
      ref={props.ref}
    />
  );
};
