import fs from "fs";
import { join } from "path";
import dotenv from "dotenv";
import { UTApi } from "uploadthing/server";

dotenv.config({
  path: "../.env",
});

const migrateUsers = async () => {
  const data = JSON.parse(
    fs.readFileSync(join(import.meta.dirname, "./data/users.json"), "utf-8")
  );

  const { db } = await import("@baygull/db");
  const { user } = await import("@baygull/db/schema");

  await db.insert(user).values(
    data.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: 1,
      role: user.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
};

const migrateTopics = async () => {
  const data = JSON.parse(
    fs.readFileSync(join(import.meta.dirname, "./data/topics.json"), "utf-8")
  ) as { id: string; name: string }[];

  const { db } = await import("@baygull/db");
  const { topic } = await import("@baygull/db/schema");

  await db.insert(topic).values(
    data.map((topic) => ({
      id: topic.id,
      name: topic.name,
    }))
  );
};

const migrateArticles = async () => {
  const data = Object.values(
    Object.groupBy(
      JSON.parse(
        fs.readFileSync(
          join(import.meta.dirname, "./data/articles.json"),
          "utf-8"
        )
      ) as {
        id: string;
        slug: string;
        title: string;
        description: string;
        cover_img: string | null;
        is_highlighted: number;
        published_at: string;
        userId: string;
        articleId: string;
        content: string;
        topicId: string;
      }[],
      (article) => article.id
    )
  ).map((group) => {
    if (!group || !group[0]) throw new Error("Something went wrong!");

    const [{ topicId, ...rest }] = group;

    return {
      ...rest,
      topicIds: group.map((article) => article.topicId),
    };
  });

  const { db } = await import("@baygull/db");
  const {
    article,
    publishDefaultContent,
    draftDefaultContent,
    publishMeta,
    draftMeta,
    usersToArticles,
    articlesToTopics,
    articleMedia,
  } = await import("@baygull/db/schema");

  await db.insert(article).values(
    data.map((article) => ({
      id: article.id,
      type: "default" as const,
      status: "published" as const,
      title: article.title,
      createdAt: article.published_at,
    }))
  );

  await db.insert(usersToArticles).values(
    data.map((article) => ({
      articleId: article.articleId,
      userId: article.userId,
    }))
  );

  await db.insert(articlesToTopics).values(
    data.flatMap((article) =>
      article.topicIds.map((topicId) => ({
        articleId: article.id,
        topicId,
      }))
    )
  );

  await db.insert(publishMeta).values(
    data.map((article) => ({
      articleId: article.articleId,
      slug: article.slug,
      isHighlighted: !!article.is_highlighted,
      publishedAt: article.published_at,
    }))
  );

  await db.insert(draftMeta).values(
    data.map((article) => ({
      articleId: article.id,
      slug: article.slug,
      deriveSlugFromTitle: false,
      keyIdeas: "LEGACY ARTICLE, REFERENCE GOOGLE FORM",
      message: "LEGACY ARTICLE, REFERENCE GOOGLE FORM",
      submittedAt: article.published_at,
      updatedAt: article.published_at,
    }))
  );

  await db.insert(publishDefaultContent).values(
    data.map((article) => ({
      articleId: article.id,
      description: article.description,
      content: article.content,
    }))
  );

  await db.insert(draftDefaultContent).values(
    data.map((article) => ({
      articleId: article.id,
      description: article.description,
      isSynced: false,
      content: "[]",
      syncDisabledAt: article.published_at,
      editingUrl: "",
      originalUrl: "",
    }))
  );

  const utapi = new UTApi();

  const files = await Promise.all(
    data
      .filter((article) => !!article.cover_img)
      .map(async (article) => {
        const fileResponse = await fetch(article.cover_img!);
        const mime =
          fileResponse.headers.get("Content-Type") ||
          "application/octet-stream";
        const buffer = await fileResponse.blob();

        return {
          file: new File([buffer], `${article.id}`, {
            type: mime,
          }),
          articleId: article.id,
        };
      })
  );

  const uploadResult = await utapi.uploadFiles(files.map((file) => file.file));

  await db.insert(articleMedia).values(
    uploadResult
      .filter((res) => res.data)
      .map((res, idx) => ({
        articleId: files[idx]!.articleId,
        intent: "cover_img" as const,
        caption: "",
        fileName: res.data!.name,
        mimeType: res.data!.type,
        size: res.data!.size,
        ufsId: res.data!.key,
        url: res.data!.ufsUrl,
      }))
  );
};

const migrate = async () => {
  migrateUsers();
  migrateTopics();
  migrateArticles();
};

migrate().catch(console.error);
