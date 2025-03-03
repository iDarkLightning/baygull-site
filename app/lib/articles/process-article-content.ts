// import { Marked } from "marked";
import { UTApi } from "uploadthing/server";
import DOMPurify from "isomorphic-dompurify";
import parse from "node-html-parser";

// export const processArticleContent = async (mdContent: string) => {
//   const marked = new Marked({
//     async: true,
//   });
//   const utapi = new UTApi();

//   marked.use({
//     walkTokens: async (token) => {
//       if (token.type === "image") {
//         const blob = await fetch(token.href).then((res) => res.blob());
//         const [res] = await utapi.uploadFiles([new File([blob], "test.png")]);

//         if (res.error) throw new Error("Error uploading file!");

//         token.href = res.data.ufsUrl;
//       }
//     },
//   });

//   try {
//     const parsed = await marked.parse(mdContent);

//     return DOMPurify.sanitize(parsed);
//   } catch (err) {
//     throw err;
//   }
// };
