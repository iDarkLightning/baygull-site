import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";

export const getAllTopics = createServerFn({ method: "GET" }).handler(
  async () => {
    const queryResult = await db.query.topic.findMany();

    return queryResult;
  }
);
