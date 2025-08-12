import { authClient } from "@baygull/auth/client";
import {
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { useTRPC } from "../trpc/client";

export const useSignIn = (opts: UseMutationOptions = {}) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation({
    mutationKey: ["user-sign-in"],
    mutationFn: async () => {
      const res = await authClient.signIn.social({ provider: "google" });

      if (!res.data) {
        throw new Error(JSON.stringify(res.error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.user.me.queryKey() });
    },
    ...opts,
  });
};

export const useSignOut = (opts: UseMutationOptions = {}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["user-sign-out"],
    mutationFn: async () => {
      const res = await authClient.signOut();

      if (!res.data) {
        throw new Error(JSON.stringify(res.error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.user.me.queryKey() });
    },
    ...opts,
  });
};
