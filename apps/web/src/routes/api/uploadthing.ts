import { createServerFileRoute } from "@tanstack/react-start/server";

import { uploadRouter, createRouteHandler } from "@baygull/api/uploadthing";

const handlers = createRouteHandler({ router: uploadRouter });

export const ServerRoute = createServerFileRoute("/api/uploadthing").methods({
  GET: handlers,
  POST: handlers,
});
