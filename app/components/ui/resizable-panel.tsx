import { motion, AnimatePresence } from "framer-motion";
import useMeasure from "react-use-measure";

const ignoreCircularReferences = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (key.startsWith("_")) return; // Don't compare React's internal props.
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return;
      seen.add(value);
    }
    return value;
  };
};

export const ResizablePanel: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  let [ref, { height }] = useMeasure();

  return (
    <motion.div
      animate={{ height: height || "auto" }}
      className="relative overflow-hidden"
      transition={{
        duration: 0.4,
        type: "spring",
        bounce: 0.3,
      }}
    >
      {/* <AnimatePresence initial={false}> */}
      <motion.div key={JSON.stringify(children, ignoreCircularReferences())}>
        <div ref={ref} className={`${height ? "absolute" : "relative"} w-full`}>
          {children}
        </div>
      </motion.div>
      {/* </AnimatePresence> */}
    </motion.div>
  );
};
