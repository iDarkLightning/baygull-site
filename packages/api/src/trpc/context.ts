import { db } from "@baygull/db";
import { TRPCError } from "@trpc/server";

// const matchOrThrow = <T>(value: T | null | undefined): NonNullable<T> => {
//   if (!value) throw new TRPCError({ code: "NOT_FOUND" });
//   return value;
// };

const uniqueResult = async <T>(value: Promise<T[]>) => {
  const result = await value;
  return result[0];
};

const uniqueResultOrThrow = async <T>(value: Promise<T[]>) => {
  const result = await uniqueResult(value);
  if (!result) throw new TRPCError({ code: "NOT_FOUND" });

  return result;
};

export const createTRPCContext = (request: Request) => {
  return {
    request,
    db,
    uniqueResult,
    uniqueResultOrThrow,
  };
};

export type TRPCContext = ReturnType<typeof createTRPCContext>;
