import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbDarkSite {
  id: string;
  name: string;
  slug: string;
  description_fr: string | null;
  description_en: string | null;
  latitude: number;
  longitude: number;
  bortle: number;
  region: string | null;
  country: string;
  category: string | null;
  website: string | null;
  is_official_rice: boolean;
}

// Countries we surface today. Cheap to extend later.
const ALLOWED_COUNTRIES = ["FR", "BE", "CH", "IT", "ES", "DE"];

export function useDarkSites() {
  return useQuery<DbDarkSite[]>({
    queryKey: ["dark_sites", ALLOWED_COUNTRIES],
    staleTime: 1000 * 60 * 60, // 1h — table changes rarely
    gcTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("dark_sites")
        .select(
          "id,name,slug,description_fr,description_en,latitude,longitude,bortle,region,country,category,website,is_official_rice"
        )
        .in("country", ALLOWED_COUNTRIES);
      if (error) throw error;
      return (data ?? []) as DbDarkSite[];
    },
  });
}
