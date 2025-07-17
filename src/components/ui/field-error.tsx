type FieldErrorProps = {
  message?: string;
};

export const FieldError: React.FC<FieldErrorProps> = (props) => (
  <div className="flex items-center gap-2 my-2 text-red-700">
    <p className="font-medium text-sm">{props.message}</p>
  </div>
);
