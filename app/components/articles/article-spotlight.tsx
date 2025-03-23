import { Link } from "@tanstack/react-router";
import { TArticlesList } from "~/lib/articles/article-fns";

type ArticleSpotlightProps = {
  article: TArticlesList[0];
};

export const ArticleSpotlight: React.FC<ArticleSpotlightProps> = (props) => (
  <Link
    className="flex flex-col gap-3 group"
    to="/articles/$slug"
    params={{ slug: props.article.slug }}
  >
    {props.article.coverImg && (
      <div className="bg-neutral-50 rounded-t-xl">
        <img
          src={props.article.coverImg}
          alt={`${props.article.title}-Cover Image`}
          width="128"
          className="w-full aspect-[16/10] object-scale-down rounded-sm"
          referrerPolicy="no-referrer"
        />
      </div>
    )}
    <div className="flex flex-col w-full md:flex-row md:items-center justify-between gap-2">
      <p className="hover font-semibold text-3xl group-hover:underline group-hover:text-sky-600">
        {props.article.title}
      </p>
      <p className="text-sm tracking-wider text-amber-700 font-bold">
        Spotlight
      </p>
    </div>
    {props.article.description.length > 0 && (
      <div>
        <p className="text-neutral-600 break-words">
          {props.article.description}
        </p>
      </div>
    )}
    <div className="flex flex-col gap-1">
      {props.article.topics.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {props.article.topics.map(({ topic }: any) => (
            <div className="p-1 px-3 border w-fit border-neutral-400 rounded-full font-sans font-medium">
              <p>{topic.name}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <p>
          {new Intl.DateTimeFormat("en-us", {
            dateStyle: "medium",
          }).format(new Date(props.article.publishedAt))}
        </p>
        <p>·</p>
        <p>
          By{" "}
          <span className="uppercase">
            {props.article.users.map(({ user }: any) => user.name).join(", ")}
          </span>
        </p>
      </div>
    </div>
  </Link>
);
