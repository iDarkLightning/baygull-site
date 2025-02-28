import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/nav";
import { getUserQuery } from "~/lib/api/auth-api";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const userQuery = useSuspenseQuery(getUserQuery());

  return (
    <div>
      <Header />
      <p>{JSON.stringify(userQuery.data)}</p>
    </div>
  );
}
