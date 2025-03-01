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
      <main className="max-w-[100rem] h-24 py-6 px-4 md:mx-auto md:w-[70%] lg:w-[50%] flex flex-col mt-16 font-serif gap-8">
        <div className="flex flex-col gap-0.5 border-b border-b-neutral-400 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-black text-neutral-700 tracking-wide">
                Submit an Article!
              </h2>
              <div className="flex flex-col gap-2 my-2">
                <p className="text-neutral-700">
                  Chuck your articles here! Submitted articles will be reviewed
                  and edited by the editing team 1PM on Wednesdays. You will
                  receive your edited work via email in 3-5 days after the
                  editing meeting, and we'll talk then about changes as needed.
                </p>
                <p className="text-neutral-700">
                  Interested in joining the editing team? Fill out the form to
                  request to join in our LinkTree, or reach out to an executive
                  member through Discord.
                </p>
              </div>
            </div>
          </div>
        </div>
        <ArticleSubmissionForm />
      </main>
    </>
  );
}
