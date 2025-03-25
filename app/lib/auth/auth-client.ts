import {
  UseMutationOptions,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { createAuthClient } from "better-auth/react";
import { useTRPC } from "../trpc/client";

export const authClient = createAuthClient({
  baseURL: process.env.BASE_URL,
});

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
