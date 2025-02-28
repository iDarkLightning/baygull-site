import { queryOptions } from "@tanstack/react-query";
import { getArticleBySlug } from "./article-fns";

export const getArticleBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["article-get", slug],
    queryFn: () => getArticleBySlug({ data: { slug } }),
  });
