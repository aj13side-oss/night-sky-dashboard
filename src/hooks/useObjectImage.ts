import { useQuery } from "@tanstack/react-query";
import { getSkyImageUrl, type SkyImageSurvey } from "@/lib/sky-images";

export interface ObjectImage {
  url: string;
  attribution: string | null;
  source: "wikipedia" | "survey";
  pageUrl: string | null;
}

/**
 * Search Wikipedia for an image of a celestial object.
 * Tries common_name first, then catalog_id.
 * Falls back to HiPS2FITS survey image.
 */
async function fetchObjectImage(
  catalogId: string,
  commonName: string | null,
  ra: number | null,
  dec: number | null,
  sizeArcmin: number | null
): Promise<ObjectImage> {
  // Try Wikipedia with multiple search terms
  const searchTerms = [
    commonName ? `${commonName} (nebula OR galaxy OR cluster)` : null,
    commonName,
    catalogId.replace(/\s+/g, " "),
    // Try alternate forms: "M 42" -> "Messier 42"
    catalogId.startsWith("M") ? `Messier ${catalogId.slice(1).trim()}` : null,
    catalogId.startsWith("NGC") ? `NGC ${catalogId.slice(3).trim()}` : null,
  ].filter(Boolean) as string[];

  for (const term of searchTerms) {
    const result = await tryWikipedia(term);
    if (result) return result;
  }

  // Fallback: HiPS2FITS survey
  const surveyUrl = getSkyImageUrl(ra, dec, sizeArcmin, 800, 500, "mellinger");
  return {
    url: surveyUrl ?? "",
    attribution: "CDS/P/Mellinger/color — Axel Mellinger",
    source: "survey",
    pageUrl: null,
  };
}

async function tryWikipedia(title: string): Promise<ObjectImage | null> {
  try {
    // Step 1: Search for the page
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title)}&srnamespace=0&srlimit=3&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results = searchData?.query?.search;
    if (!results || results.length === 0) return null;

    // Pick the best match
    const pageTitle = results[0].title;

    // Step 2: Get the page image (original resolution)
    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&piprop=original&format=json&origin=*`;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();
    const pages = imgData?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as any;
    const original = page?.original;
    if (!original?.source) return null;

    // Filter out SVG/icon images
    const src: string = original.source;
    if (src.endsWith(".svg") || src.endsWith(".svg.png")) return null;
    // Skip tiny images
    if (original.width && original.width < 300) return null;

    // Step 3: Get attribution from the image file
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
      } catch {
        // Attribution is best-effort
      }
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
  sizeArcmin: number | null | undefined
) {
  return useQuery({
    queryKey: ["object-image", catalogId],
    queryFn: () =>
      fetchObjectImage(
        catalogId!,
        commonName ?? null,
        ra ?? null,
        dec ?? null,
        sizeArcmin ?? null
      ),
    enabled: !!catalogId,
    staleTime: Infinity, // Images don't change
    retry: 1,
  });
}
