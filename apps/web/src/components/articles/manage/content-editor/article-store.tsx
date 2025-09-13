import { createPlatePlugin } from "platejs/react";

export const ArticleStorePlugin = createPlatePlugin({
  key: "article-store",
  options: {
    articleId: "",
    setIsUpdating: (val: boolean) => {},
  },
});
