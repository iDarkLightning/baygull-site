import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArticleSubmissionForm } from "~/components/articles/article-submission-form";
import { CollapsedHeader, Header } from "~/components/nav";
import { authClient } from "~/lib/auth/auth-client";

export const Route = createFileRoute("/articles/submit")({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      const { data } = await authClient.signIn.social({
        provider: "google",
        disableRedirect: true,
        callbackURL: "/articles/submit",
      });

      throw redirect({ href: data?.url });
    }

    return { user: context.user };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <CollapsedHeader />
      <main className="max-w-[80rem] min-h-[calc(100vh-10vh)] py-6 px-4 md:mx-auto md:w-[70%] lg:w-[50%] xl:w-[40%] flex flex-col mt-16 justify-center font-serif gap-8">
        <ArticleSubmissionForm />
      </main>
    </>
  );
}
