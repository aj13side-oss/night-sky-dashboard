import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useUserRigs";

export function useFavorites() {
  const { userId } = useCurrentUser();
  const qc = useQueryClient();

  const { data: favorites } = useQuery({
    queryKey: ["favorites", userId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_favorites")
        .select("object_id")
        .eq("user_id", userId);
      return new Set<string>((data ?? []).map((f: any) => f.object_id));
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const toggleFavorite = useMutation({
    mutationFn: async (objectId: string) => {
      if (!userId) throw new Error("Not authenticated");
      const isFav = favorites?.has(objectId);
      if (isFav) {
        await (supabase as any)
          .from("user_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("object_id", objectId);
      } else {
        await (supabase as any)
          .from("user_favorites")
          .insert({ user_id: userId, object_id: objectId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const isFavorite = (objectId: string) => favorites?.has(objectId) ?? false;
  const count = favorites?.size ?? 0;

  return { favorites, isFavorite, toggleFavorite, count };
}
