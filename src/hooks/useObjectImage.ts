import { useQuery } from "@tanstack/react-query";

export interface ObjectImage {
  url: string;
  artist: string | null;
  date: string | null;
  license: string | null;
  licenseUrl: string | null;
  filePageUrl: string | null;
  source: "wikipedia" | "skyview" | "survey" | "forced";
  pageUrl: string | null;
}

const ASTRO_CATEGORIES = [
  "astronomy", "nebulae", "galaxies", "messier objects", "ngc objects",
  "star clusters", "planetary nebulae", "emission nebulae", "reflection nebulae",
  "supernova remnants", "galaxy clusters", "open clusters", "globular clusters",
  "astrophotography", "deep-sky objects",
];

/**
 * Extract the Wikimedia Commons filename from a full upload URL.
 * Example: https://upload.wikimedia.org/wikipedia/commons/a/ab/Some_Image.jpg → Some_Image.jpg
 */
function extractWikimediaFilename(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("wikimedia.org") && !u.hostname.includes("wikipedia.org")) return null;
    const parts = u.pathname.split("/");
    const last = parts[parts.length - 1];
    return last ? decodeURIComponent(last) : null;
  } catch {
    return null;
  }
}

/**
 * Fetch metadata (author, license, date) for a Wikimedia Commons file.
 */
async function fetchWikimediaMetadata(fileName: string): Promise<{
  artist: string | null;
  date: string | null;
  license: string | null;
  licenseUrl: string | null;
  filePageUrl: string;
}> {
  const filePageUrl = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}`;
  const defaults = { artist: null, date: null, license: null, licenseUrl: null, filePageUrl };

  try {
    const attrUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`;
    const attrRes = await fetch(attrUrl);
    if (!attrRes.ok) return defaults;

    const attrData = await attrRes.json();
    const attrPages = attrData?.query?.pages;
    if (!attrPages) return defaults;

    const attrPage = Object.values(attrPages)[0] as any;
    const meta = attrPage?.imageinfo?.[0]?.extmetadata;
    if (!meta) return defaults;

    const artist = meta.Artist?.value?.replace(/<[^>]*>/g, "").trim() || null;
    const license = meta.LicenseShortName?.value || null;
    const licenseUrl = meta.LicenseUrl?.value || null;

    let date: string | null = null;
    const rawDate = meta.DateTimeOriginal?.value || meta.DateTime?.value;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        date = !isNaN(d.getTime())
          ? d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : rawDate.split(" ")[0];
      } catch {
        date = rawDate.split(" ")[0];
      }
    }

    return { artist, date, license, licenseUrl, filePageUrl };
  } catch {
    return defaults;
  }
}

async function fetchObjectImage(
  catalogId: string,
  commonName: string | null,
  ra: number | null,
  dec: number | null,
  sizeArcmin: number | null,
  imageSearchQuery: string | null,
  forcedImageUrl: string | null
): Promise<ObjectImage> {
  // 1. Forced image URL — use directly, fetch metadata from Wikimedia
  if (forcedImageUrl) {
    const fileName = extractWikimediaFilename(forcedImageUrl);
    const meta = fileName
      ? await fetchWikimediaMetadata(fileName)
      : { artist: null, date: null, license: null, licenseUrl: null, filePageUrl: null };

    return {
      url: forcedImageUrl,
      artist: meta.artist ?? "Wikimedia Commons",
      date: meta.date,
      license: meta.license,
      licenseUrl: meta.licenseUrl,
      filePageUrl: meta.filePageUrl ?? null,
      source: "forced",
      pageUrl: meta.filePageUrl ?? null,
    };
  }

  // 2. Dynamic search via Wikipedia
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

  // 3. Fallback: NASA SkyView
  if (ra != null && dec != null) {
    const sizeDeg = sizeArcmin && sizeArcmin > 0 ? sizeArcmin / 60 : 1.0;
    const skyviewUrl = `https://skyview.gsfc.nasa.gov/cgi-bin/images?Survey=DSS2+Color&position=${ra},${dec}&Size=${sizeDeg}&Pixels=800&Return=JPG`;
    return {
      url: skyviewUrl,
      artist: "NASA/STScI Digital Sky Survey",
      date: null,
      license: "Public Domain",
      licenseUrl: null,
      filePageUrl: null,
      source: "skyview",
      pageUrl: "https://skyview.gsfc.nasa.gov/",
    };
  }

  return {
    url: "",
    artist: null,
    date: null,
    license: null,
    licenseUrl: null,
    filePageUrl: null,
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
    let artist: string | null = null;
    let date: string | null = null;
    let license: string | null = null;
    let licenseUrl: string | null = null;
    let filePageUrl: string | null = null;

    if (fileName) {
      const decodedName = decodeURIComponent(fileName);
      const meta = await fetchWikimediaMetadata(decodedName);
      artist = meta.artist;
      date = meta.date;
      license = meta.license;
      licenseUrl = meta.licenseUrl;
      filePageUrl = meta.filePageUrl;
    }

    return {
      url: src,
      artist: artist ?? "Wikimedia Commons",
      date,
      license,
      licenseUrl,
      filePageUrl,
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
  imageSearchQuery?: string | null,
  forcedImageUrl?: string | null
) {
  return useQuery({
    queryKey: ["object-image", catalogId, forcedImageUrl],
    queryFn: () =>
      fetchObjectImage(
        catalogId!,
        commonName ?? null,
        ra ?? null,
        dec ?? null,
        sizeArcmin ?? null,
        imageSearchQuery ?? null,
        forcedImageUrl ?? null
      ),
    enabled: !!catalogId,
    staleTime: Infinity,
    retry: 1,
  });
}
