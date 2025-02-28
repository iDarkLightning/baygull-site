import {
  queryOptions,
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { getUser } from "../server/auth-fns";
import { authClient } from "../auth-client";

export const getUserQuery = () =>
  queryOptions({
    queryKey: ["user-get"],
    queryFn: getUser,
  });

export const useSignIn = (opts: UseMutationOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["user-sign-in"],
    mutationFn: async () => {
      const res = await authClient.signIn.social({ provider: "google" });

      if (!res.data) {
        throw new Error(JSON.stringify(res.error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-get"] });
    },
    ...opts,
  });
};

export const useSignOut = (opts: UseMutationOptions = {}) => {
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
      queryClient.invalidateQueries({ queryKey: ["user-get"] });
    },
    ...opts,
  });
};
