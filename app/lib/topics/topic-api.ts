import { queryOptions } from "@tanstack/react-query";
import { getAllTopics } from "./topic-fns";

export const getAllTopicsQuery = queryOptions({
  queryKey: ["topics-get-all"],
  queryFn: getAllTopics,
});
