import { useQuery } from "@tanstack/react-query";

export interface ObjectImage {
  url: string;
  attribution: string | null;
  source: "wikipedia" | "skyview" | "survey";
  pageUrl: string | null;
}

const ASTRO_CATEGORIES = [
  "astronomy", "nebulae", "galaxies", "messier objects", "ngc objects",
  "star clusters", "planetary nebulae", "emission nebulae", "reflection nebulae",
  "supernova remnants", "galaxy clusters", "open clusters", "globular clusters",
  "astrophotography", "deep-sky objects",
];

async function fetchObjectImage(
  catalogId: string,
  commonName: string | null,
  ra: number | null,
  dec: number | null,
  sizeArcmin: number | null,
  imageSearchQuery: string | null
): Promise<ObjectImage> {
  // Use image_search_query from DB first, then fallback terms
  const searchTerms = [
    imageSearchQuery,
    commonName,
    catalogId.replace(/\s+/g, " "),
    catalogId.startsWith("M") ? `Messier ${catalogId.slice(1).trim()}` : null,
  ].filter(Boolean) as string[];

  for (const term of searchTerms) {
    const result = await tryWikipedia(term);
    if (result) return result;
  }

  // Fallback: NASA SkyView (coordinate-based, always accurate)
  if (ra != null && dec != null) {
    const sizeDeg = sizeArcmin && sizeArcmin > 0 ? sizeArcmin / 60 : 1.0;
    const skyviewUrl = `https://skyview.gsfc.nasa.gov/cgi-bin/images?Survey=DSS2+Color&position=${ra},${dec}&Size=${sizeDeg}&Pixels=800&Return=JPG`;
    return {
      url: skyviewUrl,
      attribution: "NASA SkyView — DSS2 Color",
      source: "skyview",
      pageUrl: "https://skyview.gsfc.nasa.gov/",
    };
  }

  return {
    url: "",
    attribution: null,
    source: "survey",
    pageUrl: null,
  };
}

async function tryWikipedia(title: string): Promise<ObjectImage | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title)}&srnamespace=0&srlimit=3&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results = searchData?.query?.search;
    if (!results || results.length === 0) return null;

    const pageTitle = results[0].title;

    // Check categories for astronomy relevance
    const catUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=categories&cllimit=50&format=json&origin=*`;
    const catRes = await fetch(catUrl);
    if (catRes.ok) {
      const catData = await catRes.json();
      const pages = catData?.query?.pages;
      if (pages) {
        const page = Object.values(pages)[0] as any;
        const cats: string[] = (page?.categories || []).map((c: any) =>
          (c.title || "").replace("Category:", "").toLowerCase()
        );
        const isAstro = cats.some((cat) =>
          ASTRO_CATEGORIES.some((kw) => cat.includes(kw))
        );
        if (!isAstro) return null;
      }
    }

    // Get original image
    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&piprop=original&format=json&origin=*`;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();
    const pages = imgData?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as any;
    const original = page?.original;
    if (!original?.source) return null;

    const src: string = original.source;
    if (src.endsWith(".svg") || src.endsWith(".svg.png")) return null;
    if (original.width && original.width < 300) return null;

    // Attribution
    const fileName = src.split("/").pop()?.split("?")[0];
    let attribution: string | null = null;
    if (fileName) {
      try {
        const attrUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(decodeURIComponent(fileName))}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`;
        const attrRes = await fetch(attrUrl);
        if (attrRes.ok) {
          const attrData = await attrRes.json();
          const attrPages = attrData?.query?.pages;
          if (attrPages) {
            const attrPage = Object.values(attrPages)[0] as any;
            const meta = attrPage?.imageinfo?.[0]?.extmetadata;
            if (meta) {
              const artist = meta.Artist?.value?.replace(/<[^>]*>/g, "").trim();
              const license = meta.LicenseShortName?.value;
              const parts = [artist, license].filter(Boolean);
              attribution = parts.length > 0 ? parts.join(" · ") : null;
            }
          }
        }
      } catch { /* best-effort */ }
    }

    return {
      url: src,
      attribution: attribution ?? "Wikimedia Commons",
      source: "wikipedia",
      pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
    };
  } catch {
    return null;
  }
}

export function useObjectImage(
  catalogId: string | undefined,
  commonName: string | null | undefined,
  ra: number | null | undefined,
  dec: number | null | undefined,
  sizeArcmin: number | null | undefined,
  imageSearchQuery?: string | null
) {
  return useQuery({
    queryKey: ["object-image", catalogId],
    queryFn: () =>
      fetchObjectImage(
        catalogId!,
        commonName ?? null,
        ra ?? null,
        dec ?? null,
        sizeArcmin ?? null,
        imageSearchQuery ?? null
      ),
    enabled: !!catalogId,
    staleTime: Infinity,
    retry: 1,
  });
}
