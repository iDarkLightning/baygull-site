import { db } from "@baygull/db";

export const createTRPCContext = (request: Request) => {
  return {
    request,
    db,
  };
};

export type TRPCContext = ReturnType<typeof createTRPCContext>;
