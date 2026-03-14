// Augment the __InternalSupabase schema to satisfy generic type helpers
import type { Database } from "./types";

declare module "./types" {
  interface Database {
    __InternalSupabase: {
      PostgrestVersion: "14.1";
      Tables: Record<never, never>;
      Views: Record<never, never>;
      Functions: Record<never, never>;
      Enums: Record<never, never>;
      CompositeTypes: Record<never, never>;
    };
  }
}
