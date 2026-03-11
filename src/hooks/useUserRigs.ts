import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export interface UserRig {
  id: string;
  name: string;
  telescope_id: string | null;
  camera_id: string | null;
  mount_id: string | null;
  filter_ids: string[] | null;
  accessory_ids: string[] | null;
  is_current: boolean | null;
  notes: string | null;
  cached_calculations: Record<string, any> | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  return { userId, loading };
}

export function useUserRigs() {
  const { userId } = useCurrentUser();

  return useQuery({
    queryKey: ["user_rigs", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_rigs")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as UserRig[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

interface SaveRigInput {
  name: string;
  notes?: string;
  is_current?: boolean;
  telescope_id: string | null;
  camera_id: string | null;
  mount_id: string | null;
  filter_ids: string[] | null;
  accessory_ids: string[] | null;
  cached_calculations?: Record<string, any>;
}

export function useSaveRig() {
  const qc = useQueryClient();
  const { userId } = useCurrentUser();

  return useMutation({
    mutationFn: async (input: SaveRigInput) => {
      if (!userId) throw new Error("Not authenticated");

      // If setting as current, unset others first
      if (input.is_current) {
        await supabase
          .from("user_rigs")
          .update({ is_current: false })
          .eq("user_id", userId);
      }

      const { error } = await supabase.from("user_rigs").insert({
        user_id: userId,
        name: input.name,
        notes: input.notes ?? null,
        is_current: input.is_current ?? false,
        telescope_id: input.telescope_id,
        camera_id: input.camera_id,
        mount_id: input.mount_id,
        filter_ids: input.filter_ids,
        accessory_ids: input.accessory_ids,
        cached_calculations: input.cached_calculations ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_rigs"] }),
  });
}

export function useDeleteRig() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_rigs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_rigs"] }),
  });
}
