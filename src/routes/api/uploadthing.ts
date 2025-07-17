import { json } from "@tanstack/react-start";
import { createServerFileRoute } from "@tanstack/react-start/server";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "~/lib/uploadthing";

const handlers = createRouteHandler({ router: uploadRouter });

export const ServerRoute = createServerFileRoute("/api/uploadthing").methods({
  GET: handlers,
  POST: handlers,
});
 