import { queryOptions } from "@tanstack/react-query";
import {
  getAllArticles,
  getArticleBySlug,
  getArticleDraftById,
  getGoogleDocFromUrl,
} from "./article-fns";

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

export const getHomePageArticlesQuery = () =>
  queryOptions({
    queryKey: ["articles-get-homepage"],
    queryFn: async () => {
      const [article] = await getAllArticles();

      const articles = [
        article,
        article,
        article,
        { ...article, isHighlighted: false },
        article,
        { ...article, isHighlighted: false },
        article,
        { ...article, isHighlighted: false },
      ];

      if (articles.length === 0) {
        return {
          latest: null,
          highlights: [],
          recent: [],
        };
      }

      return {
        latest: articles[0],
        highlights: articles.slice(1).filter((a) => a.isHighlighted),
        recent: articles
          .slice(1)
          .filter((a) => !a.isHighlighted)
          .slice(0, Math.min(8, articles.length)),
      };
    },
  });

export const getGoogleDocFromUrlQuery = (url: string | undefined) =>
  queryOptions({
    queryKey: ["article-get-google-doc-from-url", url],
    queryFn: () => {
      if (!url) return null;

      return getGoogleDocFromUrl({ data: { docUrl: url } });
    },
    retry: false,
  });

export const getArticleDraftByIdQuery = (id: string) =>
  queryOptions({
    queryKey: ["article-get-draft-by-id", id],
    queryFn: () => getArticleDraftById({ data: { draftId: id } }),
  });
