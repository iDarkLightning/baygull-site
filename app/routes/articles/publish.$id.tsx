import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CSSProperties, Fragment, useState } from "react";
import { Key, usePress } from "react-aria";
import {
  Button,
  ListBox,
  UNSTABLE_Autocomplete as AutoComplete,
  useFilter,
  SearchField,
} from "react-aria-components";
import useMeasure from "react-use-measure";
import { ArticlePublishForm } from "~/components/articles/article-publish-form";
import { CollapsedHeader } from "~/components/nav";
import {
  CheckCircleIcon,
  CheckCircleSolidIcon,
  ChevronUpDownIcon,
} from "~/components/ui/icons";
import { Input, inputBase } from "~/components/ui/input";
import {
  MultiSelect,
  MultiSelectBody,
  MultiSelectItem,
  MultiSelectTrigger,
} from "~/components/ui/multi-select";
import { Popover, PopoverBody, PopoverTrigger } from "~/components/ui/popover";
import { Select, SelectItem, SelectTrigger } from "~/components/ui/select";
import { getArticleDraftByIdQuery } from "~/lib/articles/article-api";
import { ArticlePublishFormStoreProvider } from "~/lib/articles/article-publish-store";
import { cn } from "~/lib/cn";

export const Route = createFileRoute("/articles/publish/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      getArticleDraftByIdQuery(params.id)
    );
  },
  component: RouteComponent,
});

const listItems = ["Aardvark", "Cat", "Dog", "Kangaroo", "Panda", "Snake"];

function RouteComponent() {
  const { id } = Route.useParams();

  const draftQuery = useSuspenseQuery(getArticleDraftByIdQuery(id));

  return (
    <div>
      <CollapsedHeader />
      <main className="max-w-[80rem] min-h-[calc(100vh-10vh)] py-6 px-4 md:mx-auto md:w-[70%] lg:w-[50%] xl:w-[40%] flex flex-col mt-16 justify-center font-serif gap-8">
        <ArticlePublishFormStoreProvider
          name={draftQuery.data.title}
          content={draftQuery.data.content}
          description={draftQuery.data.description}
          coverImg={draftQuery.data.coverImg}
          users={draftQuery.data.users}
        >
          <ArticlePublishForm />
        </ArticlePublishFormStoreProvider>

        <MultiSelect>
          <MultiSelectTrigger>
            <MultiSelectBody>
              {listItems.map((item) => (
                <MultiSelectItem textValue={item} id={item} key={item}>
                  {item}
                </MultiSelectItem>
              ))}
            </MultiSelectBody>
          </MultiSelectTrigger>
        </MultiSelect>
      </main>
    </div>
  );
}
