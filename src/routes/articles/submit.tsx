import { createFileRoute, redirect } from "@tanstack/react-router";
import { ArticleSubmissionForm } from "~/components/articles/article-submission-form";
import { CollapsedHeader, Header } from "~/components/layout/nav";
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
      <div className="max-w-[100rem] py-6 px-4 md:mx-auto mt-16 md:w-[80%] lg:w-[85%] 2xl:w-[90%] flex items-center justify-center">
        <main className="min-h-[calc(100vh-16vh)] md:w-[70%] lg:w-[50%] xl:w-[40%] flex flex-col justify-center font-serif gap-8">
          <ArticleSubmissionForm />
        </main>
      </div>
    </>
  );
}
