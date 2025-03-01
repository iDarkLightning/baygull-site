import { queryOptions } from "@tanstack/react-query";
import { getAllArticles, getArticleBySlug } from "./article-fns";

export const getArticleBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["article-get", slug],
    queryFn: () => getArticleBySlug({ data: { slug } }),
  });

export const getAllArticlesQuery = () =>
  queryOptions({
    queryKey: ["article-get-all"],
    queryFn: getAllArticles,
  });
