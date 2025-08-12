import { db } from "../db";

export const createTRPCContext = (request: Request) => {
  return {
    request,
    db,
  };
};

export type TRPCContext = ReturnType<typeof createTRPCContext>;
