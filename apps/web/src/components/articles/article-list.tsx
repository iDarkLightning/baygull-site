import { Link } from "@tanstack/react-router";
import React from "react";
import type { TArticlesList } from "@baygull/api/trpc/types";

type ArticlesListProps = {
  articles: TArticlesList;
};

export const ArticlesList: React.FC<ArticlesListProps> = (props) => (
  <div className="flex flex-col gap-3">
    {props.articles.length === 0 && (
      <div>
        <p>No recent articles</p>
      </div>
    )}
    {props.articles.length > 0 &&
      props.articles.map((article) => (
        <Link
          key={article.id}
          className="flex w-full md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-4 group "
          to="/articles/$slug"
          params={{ slug: article.slug }}
        >
          <div className="w-full">
            <p className="text-xs font-bold text-neutral-400">
              {new Intl.DateTimeFormat("en-us", {
                dateStyle: "medium",
              }).format(new Date(article.publishedAt))}
            </p>
            {article.coverImg && (
              <img
                src={article.coverImg.url}
                alt=""
                width="128"
                height="128"
                className="rounded-sm w-32 h-24 aspect-video float-right ml-3 object-scale-down"
                referrerPolicy="no-referrer"
              />
            )}
            <p className="text-xl font-semibold group-hover:underline group-hover:text-sky-600 text-balance">
              {article.title}
            </p>
            <p className="text-neutral-600 text-sm break-words">
              {article.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
              {article.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {article.topics.map(({ topic }) => (
                    <div
                      key={topic.id}
                      className="p-1 px-3 border w-fit border-neutral-400 rounded-full font-sans font-medium"
                    >
                      <p>{topic.name}</p>
                    </div>
                  ))}
                </div>
              )}
              <p>
                By{" "}
                <span className="uppercase">
                  {article.users.map(({ user }) => user.name).join(", ")}
                </span>
              </p>
            </div>
          </div>
        </Link>
      ))}
  </div>
);
