import { createPlatePlugin } from "platejs/react";

export const DraftStorePlugin = createPlatePlugin({
  key: "draft-store",
  options: {
    draftId: "",
    setIsUpdating: (val: boolean) => {},
  },
});
