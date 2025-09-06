import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { TRPCRouter } from "./routers/root-router";

type RouterInput = inferRouterInputs<TRPCRouter>;
type RouterOutput = inferRouterOutputs<TRPCRouter>;

export type TArticlesList = RouterOutput["article"]["getAll"];
export type TDraftList = RouterOutput["article"]["manage"]["getAll"];
