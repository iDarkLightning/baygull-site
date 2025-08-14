import { z } from "zod";
const type = z.union([
    z.literal("default"),
    z.literal("graphic"),
    z.literal("headline"),
]);
const status = z.union([
    z.literal("published"),
    z.literal("draft"),
    z.literal("archived"),
]);
export const date = z
    .string()
    .refine((val) => {
    try {
        new Date(val);
        return true;
    }
    catch {
        return false;
    }
})
    .transform((date) => date + "Z");
const baseArticleSchema = z.object({
    id: z.string(),
    title: z.string(),
    createdAt: date,
});
const defaultContentSchema = z.object({
    type: z.literal("default"),
});
const graphicContentSchema = z.object({
    type: z.literal("graphic"),
    description: z.string(),
});
const headlineContentSchema = z.object({
    type: z.literal("headline"),
});
const publishMetaSchema = z.object({
    status: z.literal("published"),
    articleId: z.string(),
    slug: z.string(),
    isHighlighted: z.boolean(),
    deriveSlugFromTitle: z.boolean(),
    publishedAt: date,
});
const publishDefaultContentSchema = defaultContentSchema.extend({
    type: z.literal("default"),
    description: z.string(),
    content: z.string(),
});
const publishVariant = z.discriminatedUnion("type", [
    baseArticleSchema.merge(publishMetaSchema.merge(publishDefaultContentSchema)),
    baseArticleSchema.merge(publishMetaSchema.merge(graphicContentSchema)),
    baseArticleSchema.merge(publishMetaSchema.merge(headlineContentSchema)),
]);
const draftMetaSchema = z.object({
    status: z.literal("draft"),
    articleId: z.string(),
    publishMeta: publishMetaSchema.omit({ status: true }),
    keyIdeas: z.string(),
    message: z.string(),
    submittedAt: date,
    updatedAt: date,
});
const draftDefaultContentSchema = defaultContentSchema.extend({
    type: z.literal("default"),
    content: z.string().nullable(),
    description: z.string(),
    isSynced: z.boolean(),
    syncDisabledAt: date.nullable(),
    editingUrl: z.string().url().or(z.literal("")),
    originalUrl: z.string().url().or(z.literal("")),
});
const draftVariantSchema = z.discriminatedUnion("type", [
    baseArticleSchema.merge(draftMetaSchema.merge(draftDefaultContentSchema)),
    baseArticleSchema.merge(draftMetaSchema.merge(graphicContentSchema)),
    baseArticleSchema.merge(draftMetaSchema.merge(headlineContentSchema)),
]);
const archiveMetaSchema = z.object({
    status: z.literal("archived"),
    archivedAt: date,
});
const archiveVariantSchema = z.discriminatedUnion("type", [
    baseArticleSchema.merge(archiveMetaSchema.merge(defaultContentSchema)),
    baseArticleSchema.merge(archiveMetaSchema.merge(graphicContentSchema)),
    baseArticleSchema.merge(archiveMetaSchema.merge(headlineContentSchema)),
]);
const articleSchema = z.union([
    publishVariant,
    draftVariantSchema,
    archiveVariantSchema,
]);
export const isStrictArticle = (article, type, status) => {
    return article.type === type && article.status === status;
};
export const parseArticle = (article, type, status) => {
    const parsed = articleSchema.safeParse(article);
    if (parsed.error || !isStrictArticle(parsed.data, type, status))
        throw new Error(parsed?.error?.message);
    return parsed.data;
};
