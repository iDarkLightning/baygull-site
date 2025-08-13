import { useQuery } from "@tanstack/react-query";
import {
  MultiSelectTrigger,
  MultiSelectBody,
  MultiSelectItem,
} from "@baygull/ui/multi-select";
import { useTRPC } from "~/lib/trpc-client";
import { useMemo } from "react";

export const CollaboratorMultiSelect: React.FC<{
  includeMe?: boolean;
  isInvalid?: boolean;
}> = ({ includeMe = false, isInvalid = false }) => {
  const trpc = useTRPC();
  const usersQuery = useQuery(
    trpc.user.getUsers.queryOptions({
      includeMe,
    })
  );

  const displayMap = useMemo(() => {
    if (usersQuery.status !== "success") return undefined;

    const map = new Map<string, string>();
    usersQuery.data.forEach((user) => map.set(user.id, user.name));

    return map;
  }, [usersQuery.status]);

  return (
    <MultiSelectTrigger
      keyDisplayMap={displayMap}
      btnProps={{
        placeholder: "Add Collaborators...",
        isInvalid,
      }}
    >
      <MultiSelectBody>
        {usersQuery.data?.map((user) => (
          <MultiSelectItem
            value={user.id}
            textValue={user.name}
            id={user.id}
            key={user.id}
          >
            {user.image && (
              <img
                src={user.image}
                className="size-4 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <p className="text-xs font-medium">{user.name}</p>
          </MultiSelectItem>
        ))}
      </MultiSelectBody>
    </MultiSelectTrigger>
  );
};
