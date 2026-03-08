import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AuditStatus = "ok" | "flagged" | "unchecked";

interface AuditRow {
  id: string;
  target_table: string;
  target_id: string;
  status: AuditStatus;
  notes: string | null;
  checked_at: string;
}

/** Fetch all audit statuses for a given table */
export function useAuditStatuses(targetTable: string) {
  return useQuery<Record<string, AuditStatus>>({
    queryKey: ["image_audit", targetTable],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("image_audit_log")
        .select("target_id, status")
        .eq("target_table", targetTable);
      if (error) {
        console.warn("image_audit_log table may not exist:", error.message);
        return {};
      }
      const map: Record<string, AuditStatus> = {};
      for (const row of (data ?? []) as AuditRow[]) {
        map[row.target_id] = row.status as AuditStatus;
      }
      return map;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** Upsert an audit status */
export function useSetAuditStatus(targetTable: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ targetId, status }: { targetId: string; status: AuditStatus }) => {
      const { error } = await (supabase as any)
        .from("image_audit_log")
        .upsert(
          { target_table: targetTable, target_id: targetId, status, checked_at: new Date().toISOString() },
          { onConflict: "target_table,target_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["image_audit", targetTable] });
    },
  });
}

/** Image health result */
export interface ImageHealth {
  status: "ok" | "heavy" | "broken" | "slow";
  sizeKB?: number;
  loadTimeMs?: number;
}

const HEAVY_THRESHOLD_KB = 2000; // 2MB

/** Check a single image URL health */
export async function checkImageHealth(url: string): Promise<ImageHealth> {
  try {
    const start = performance.now();
    const response = await fetch(url, { method: "HEAD", mode: "no-cors" });
    const elapsed = performance.now() - start;

    // no-cors won't give us headers, so try with cors
    try {
      const corsResp = await fetch(url, { method: "HEAD" });
      const contentLength = corsResp.headers.get("content-length");
      const sizeKB = contentLength ? Math.round(parseInt(contentLength) / 1024) : undefined;

      if (!corsResp.ok) return { status: "broken" };
      if (sizeKB && sizeKB > HEAVY_THRESHOLD_KB) return { status: "heavy", sizeKB, loadTimeMs: elapsed };
      if (elapsed > 5000) return { status: "slow", sizeKB, loadTimeMs: elapsed };
      return { status: "ok", sizeKB, loadTimeMs: elapsed };
    } catch {
      // CORS blocked but image might still load in img tag
      if (elapsed > 5000) return { status: "slow", loadTimeMs: elapsed };
      return { status: "ok", loadTimeMs: elapsed };
    }
  } catch {
    return { status: "broken" };
  }
}
