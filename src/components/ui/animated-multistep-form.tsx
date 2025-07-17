import { AnimationControls, motion, useAnimationControls } from "framer-motion";
import React, { createContext, useCallback, useContext } from "react";

type TMultiStepFormContext = {
  animationControls: AnimationControls;
  moveForward: (cb: () => void) => void;
  moveBackward: (cb: () => void) => void;
};

const MultiStepFormContext = createContext<TMultiStepFormContext | null>(null);

export const MultiStepForm: React.FC<React.PropsWithChildren> = (props) => {
  const animationControls = useAnimationControls();

  const moveForward = useCallback(
    (cb: () => void) => {
      animationControls.start({
        x: "-5%",
        opacity: 0,
        transition: { duration: 0.1 },
      });
      setTimeout(cb, 150);
      setTimeout(
        () =>
          animationControls.start({
            x: "0%",
            opacity: 1,
            transition: { duration: 0.0015 },
          }),
        225
      );
    },
    [animationControls]
  );

  const moveBackward = useCallback((cb: () => void) => {
    animationControls.start({
      x: "5%",
      opacity: 0,
      transition: { duration: 0.1 },
    });
    setTimeout(cb, 150);
    setTimeout(
      () =>
        animationControls.start({
          x: "0%",
          opacity: 1,
          transition: { duration: 0.0015 },
        }),
      225
    );
  }, []);

  return (
    <motion.div animate={animationControls}>
      <MultiStepFormContext.Provider
        value={{
          animationControls,
          moveForward,
          moveBackward,
        }}
      >
        {props.children}
      </MultiStepFormContext.Provider>
    </motion.div>
  );
};

export const useMultiStepForm = () => {
  const values = useContext(MultiStepFormContext);

  if (!values)
    throw new Error(
      "useMultiStepForm must be used inside a MultiStepFormContext.Provider"
    );

  return values;
};
