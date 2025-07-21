import { AnimatePresence, motion } from "framer-motion";
import React, { useState } from "react";
import { AnimatedCheckIcon } from "./icons";
import useMeasure from "react-use-measure";

export const useMultiStepFormControl = () => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);

  return {
    step,
    direction,
    moveForward: () => {
      setDirection(1);
      setStep((prev) => prev + 1);
    },
    moveBackward: () => {
      setDirection(-1);
      setStep((prev) => prev - 1);
    },
  };
};

export const MultiStepFormStep: React.FC<{
  step: number;
  currentStep: number;
}> = ({ step, currentStep }) => {
  const status =
    currentStep === step
      ? "active"
      : currentStep < step
      ? "inactive"
      : "complete";

  return (
    <div className="relative flex items-center">
      <motion.div animate={status} className="relative">
        <motion.div
          variants={{
            active: {
              scale: 1,
              transition: { delay: 0, duration: 0.2 },
            },
            complete: {
              scale: 1.25,
            },
          }}
          transition={{
            duration: 0.2,
            delay: 0.15,
            type: "spring",
            ease: "circOut",
          }}
          className="absolute inset-0 rounded-full bg-sky-200"
        />

        <motion.div
          initial={false}
          variants={{
            inactive: {
              backgroundColor: "white",
              borderColor: "var(--color-zinc-100)",
              color: "var(--color-zinc-400)",
            },
            active: {
              backgroundColor: "white",
              borderColor: "var(--color-sky-600)",
              color: "var(--color-sky-700)",
            },
            complete: {
              backgroundColor: "var(--color-sky-600)",
              borderColor: "transparent",
              color: "white",
            },
          }}
          transition={{ duration: 0.1 }}
          className="relative flex size-10 items-center justify-center rounded-full border-2 font-sans font-medium"
        >
          {status === "complete" ? (
            <AnimatedCheckIcon className="h-6 w-6 text-white" />
          ) : (
            <span>{step}</span>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const MultiStepFormProgress: React.FC<{
  steps: readonly string[];
  currentStep: number;
}> = ({ steps, currentStep }) => {
  const percentage = currentStep / (steps.length - 1);

  return (
    <div className="flex relative items-center justify-between mb-4">
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-100 rounded -translate-y-1/2" />

      <motion.div
        initial={false}
        animate={{ scaleX: percentage }}
        transition={{
          duration: 0.5,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-0 h-1 bg-sky-600 origin-left -translate-y-1/2 rounded"
        style={{ width: "100%" }}
      />
      <MultiStepFormStep step={1} currentStep={currentStep + 1} />
      <div className="flex w-full justify-evenly">
        {steps.slice(1, steps.length - 1).map((_, index) => (
          <MultiStepFormStep
            key={index}
            step={index + 2}
            currentStep={currentStep + 1}
          />
        ))}
      </div>
      <MultiStepFormStep step={steps.length} currentStep={currentStep + 1} />
    </div>
  );
};

export const MultiStepForm: React.FC<
  React.PropsWithChildren<{
    multiStepControl: ReturnType<typeof useMultiStepFormControl>;
  }>
> = ({ children, multiStepControl }) => {
  let [ref, { height }] = useMeasure();

  return (
    <motion.section
      animate={{ height: height || "auto" }}
      transition={{ duration: 0.3, bounce: 0.2, type: "spring" }}
    >
      <div ref={ref}>
        <AnimatePresence mode="popLayout" custom={multiStepControl.direction}>
          <motion.div
            key={multiStepControl.step}
            custom={multiStepControl.direction}
            transition={{ duration: 0.1, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
};
