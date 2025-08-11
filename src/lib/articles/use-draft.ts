import {
  useIsMutating,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useBlocker, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTRPC } from "../trpc/client";

export const useDraft = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const params = useParams({
    from: "/manage/_admin-layout/a/drafts/publish/$id",
  });

  const queryKey = useMemo(
    () =>
      trpc.article.draft.getById.queryKey({
        draftId: params.id,
      }),
    [params.id]
  );

  const { data, refetch, ...query } = useSuspenseQuery(
    trpc.article.draft.getById.queryOptions(
      {
        draftId: params.id,
      },
      {
        refetchOnWindowFocus: "always",
      }
    )
  );

  const isMutating = useIsMutating({
    predicate: (mut) => (mut.state.variables as { id: string }).id === data.id,
  });

  const [isUpdating, setIsUpdating] = useState(isMutating > 0);

  useEffect(() => setIsUpdating(isMutating > 0), [isMutating]);

  useBlocker({
    shouldBlockFn: () => {
      if (!isUpdating) return false;

      const shouldLeave = confirm(
        "Are you sure you want to leave? Changes you have made might not have been saved!"
      );
      return !shouldLeave;
    },
    enableBeforeUnload: isUpdating,
  });

  const cancelQueries = useCallback(async () => {
    await queryClient.cancelQueries({
      queryKey,
    });
  }, [queryClient, queryKey]);

  const getSnapshot = useCallback(async () => {
    return queryClient.getQueryData(queryKey);
  }, [queryKey, queryClient]);

  const shouldRefetch = useCallback(() => {
    return (
      queryClient.isMutating({
        predicate: (mut) =>
          (mut.state.variables as { id: string }).id === data.id,
      }) === 1
    );
  }, [queryClient, data.id]);

  return {
    data,
    query,
    queryKey,
    isUpdating,
    setIsUpdating,
    shouldRefetch,
    refetch,
    cancelQueries,
    getSnapshot,
  };
};
