import { createServerFn } from "@tanstack/react-start";
import { auth } from "./auth";
import { getWebRequest } from "@tanstack/react-start/server";

export const getUser = createServerFn({ method: "GET" }).handler(async () => {
  const request = getWebRequest();

  const session = await auth.api.getSession({
    headers: request!.headers,
  });

  if (!session) return null;

  return session.user;
});
