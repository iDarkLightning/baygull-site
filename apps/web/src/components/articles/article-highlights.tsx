import { Link } from "@tanstack/react-router";
import { type TArticlesList } from "@baygull/api/trpc/types";

type ArticleHighlightsProps = {
  articles: TArticlesList;
};

export const ArticleHighlights: React.FC<ArticleHighlightsProps> = (props) => (
  <div className="flex flex-col gap-3">
    {props.articles.length === 0 && (
      <div>
        <p>No highlighted articles</p>
      </div>
    )}
    {props.articles.length > 0 &&
      props.articles.map((article) => (
        <Link
          key={article.id}
          to="/articles/$slug"
          className="flex flex-col gap-3 border-b border-neutral-200 pb-4 w-full group"
          params={{ slug: article.slug }}
        >
          <div className="flex flex-col gap-3">
            <div>
              {article.coverImg && (
                <img
                  src={article.coverImg.url}
                  alt=""
                  width="512"
                  height=""
                  className="w-64 md:w-96 lg:w-full rounded-sm float-right lg:float-none ml-4 lg:ml-0 lg:mb-4"
                  referrerPolicy="no-referrer"
                />
              )}
              <p className="text-xl font-semibold group-hover:underline group-hover:text-sky-600">
                {article.title}
              </p>
              <p className="text-neutral-600 text-sm">{article.description}</p>
              <div className="flex lg:items-center flex-col lg:flex-row gap-2 text-sm text-neutral-600 mt-1 flex-wrap">
                {article.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {article.topics.slice(0, 2).map(({ topic }) => (
                      <div
                        key={topic.id}
                        className="p-1 px-3 border w-fit border-neutral-400 rounded-full font-sans font-medium"
                      >
                        <p>{topic.name}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  <p>
                    {new Intl.DateTimeFormat("en-us", {
                      dateStyle: "medium",
                    }).format(new Date(article.publishedAt))}
                  </p>
                  <p>·</p>
                  <p>
                    By{" "}
                    <span className="uppercase">
                      {article.users.map(({ user }) => user.name).join(", ")}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
  </div>
);
