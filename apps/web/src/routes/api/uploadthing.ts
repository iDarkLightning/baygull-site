import { createFileRoute } from "@tanstack/react-router";

import { uploadRouter, createRouteHandler } from "@baygull/api/uploadthing";

const handlers = createRouteHandler({ router: uploadRouter });

export const Route = createFileRoute("/api/uploadthing")({
  server: {
    handlers: {
      GET: handlers,
      POST: handlers,
    },
  },
});
