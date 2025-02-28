import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const router = useRouter();

  const session = authClient.useSession();

  return (
    <div>
      <button
        type="button"
        onClick={async () => {
          const data = await authClient.signIn.social({ provider: "google" });
          console.log(data);
        }}
      >
        Sign in
      </button>
      <p>{JSON.stringify(session)}</p>
    </div>
  );
}
