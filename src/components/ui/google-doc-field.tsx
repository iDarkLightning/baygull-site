import { motion, AnimatePresence } from "framer-motion";
import { TextField } from "react-aria-components";
import { BarLoading } from "./bar-loading";
import { GoogleDocsIcon, AnimatedCheckIcon, AnimatedXMarkIcon } from "./icons";
import { useFieldContext } from "~/lib/form";
import { useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/lib/trpc/client";
import { FieldError } from "./form-field";
import { Input } from "./input";
import { Label } from "./label";
import { Button } from "./button";
import useMeasure from "react-use-measure";
import React from "react";

export const GoogleDocField: React.FC<{
  queryEnabledByDefault?: boolean;
}> = (props) => {
  const field = useFieldContext<string>();

  const value = useStore(field.store, (state) => state.value);
  const errors = useStore(field.store, (state) => state.meta.errors);

  const trpc = useTRPC();
  const docInfoQuery = useQuery({
    ...trpc.article.getGoogleDocFromUrl.queryOptions({
      docUrl: value,
    }),
    enabled: !!props.queryEnabledByDefault,
    retry: false,
  });

  const [ref, { width }] = useMeasure();

  const isInputDisplayed = !(
    field.state.meta.isBlurred &&
    !field.state.meta.isValidating &&
    docInfoQuery.isSuccess &&
    !!docInfoQuery.data
  );

  console.log(isInputDisplayed, props.queryEnabledByDefault);

  return (
    <TextField
      isInvalid={field.state.meta.errors.length > 0}
      value={field.state.value}
      onChange={field.handleChange}
      onBlur={field.handleBlur}
    >
      <Label>Google Docs Link</Label>
      <p className="text-sm text-neutral-600 mb-2">
        Please ensure that link sharing is enabled for your article, otherwise
        we cannot access it!
      </p>
      <div className="flex items-center gap-2">
        {isInputDisplayed && (
          <Input fullWidth autoFocus={field.state.meta.isDirty} />
        )}
        {(field.state.meta.isDirty || props.queryEnabledByDefault) && (
          <Button
            variant="outline"
            fullWidth={!isInputDisplayed}
            onPress={() =>
              field.setMeta((m) => ({
                ...m,
                isBlurred: false,
              }))
            }
            isCircular={false}
          >
            <motion.div
              animate={{
                width: width || "auto",
              }}
              transition={{
                duration: 0.35,
                type: "spring",
                bounce: 0.05,
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={field.state.meta.isValidating ? "validating" : "result"}
                  transition={{
                    duration: 0.2,
                    delay: isInputDisplayed ? undefined : 0.3,
                    ease: "easeInOut",
                    type: "spring",
                    bounce: 0.2,
                  }}
                  className="flex items-center gap-2 font-sans"
                >
                  <div
                    ref={ref}
                    className="flex items-center gap-2 text-neutral-700"
                  >
                    {field.state.meta.isValidating ||
                    (docInfoQuery.isPending && field.state.meta.isValid) ? (
                      <BarLoading />
                    ) : docInfoQuery.isSuccess ? (
                      <>
                        {!isInputDisplayed ? (
                          <GoogleDocsIcon />
                        ) : (
                          <AnimatedCheckIcon className="size-4 text-sky-600" />
                        )}
                        {!isInputDisplayed && (
                          <motion.p
                            initial={{ x: "15%", opacity: 0 }}
                            animate={{ x: "0%", opacity: 1 }}
                            className="text-xs"
                          >
                            {docInfoQuery.data?.name}
                          </motion.p>
                        )}
                      </>
                    ) : (
                      <AnimatedXMarkIcon className="size-4 text-rose-600" />
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </Button>
        )}
      </div>
      {errors.map(({ message }: { message: string }) => (
        <FieldError key={message} message={message} />
      ))}
    </TextField>
  );
};
