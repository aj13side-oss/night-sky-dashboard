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
  /** DSS2 fallback URL the component can use if the main URL fails to load */
  fallbackUrl: string | null;
}

const STAR_TYPES = ["Star", "Double Star", "Variable Star", "Carbon Star", "Star System"];

const ASTRO_CATEGORIES = [
  "astronomy", "nebulae", "galaxies", "messier objects", "ngc objects",
  "star clusters", "planetary nebulae", "emission nebulae", "reflection nebulae",
  "supernova remnants", "galaxy clusters", "open clusters", "globular clusters",
  "astrophotography", "deep-sky objects",
];

// ── Wikimedia helpers ──────────────────────────────────────────────

/**
 * Build a Wikimedia thumbnail URL from a full-res commons URL.
 * .../commons/a/ab/File.jpg → .../commons/thumb/a/ab/File.jpg/{w}px-File.jpg
 */
function buildWikimediaThumbUrl(url: string, width: number): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("wikimedia.org") && !u.hostname.includes("wikipedia.org")) return null;
    if (u.pathname.includes("/thumb/")) {
      return url.replace(/\/\d+px-([^/]+)$/, `/${width}px-$1`);
    }
    const match = u.pathname.match(/\/wikipedia\/commons\/([\da-f]\/[\da-f]{2}\/(.+))$/i);
    if (!match) return null;
    const [, pathPart, fileName] = match;
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${pathPart}/${width}px-${fileName}`;
  } catch {
    return null;
  }
}

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

/** Use the Wikimedia API to get a thumbnail (most reliable for large files). */
async function getWikimediaThumbnailViaApi(fileName: string, width: number): Promise<string | null> {
  try {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&iiurlwidth=${width}&format=json&origin=*`;
    const res = await fetch(apiUrl);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as any;
    return page?.imageinfo?.[0]?.thumburl || null;
  } catch {
    return null;
  }
}

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
    const attrPage = Object.values(attrData?.query?.pages ?? {})[0] as any;
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
      } catch { date = rawDate.split(" ")[0]; }
    }
    return { artist, date, license, licenseUrl, filePageUrl };
  } catch {
    return defaults;
  }
}

// ── DSS2 helper ────────────────────────────────────────────────────

function buildDss2Url(ra: number, dec: number, sizeArcmin: number | null): string {
  const fovDeg = sizeArcmin && sizeArcmin > 0 ? Math.min(Math.max(sizeArcmin * 1.5 / 60, 0.05), 5) : 0.5;
  const fovDegThumb = fovDeg * 1.25;
  return `https://alasky.cds.unistra.fr/hips-image-services/hips2fits?hips=CDS/P/DSS2/color&ra=${ra}&dec=${dec}&fov=${fovDegThumb}&width=300&height=200&format=jpg`;
}

// ── Main fetch ─────────────────────────────────────────────────────

async function fetchObjectImage(
  catalogId: string,
  commonName: string | null,
  ra: number | null,
  dec: number | null,
  sizeArcmin: number | null,
  imageSearchQuery: string | null,
  forcedImageUrl: string | null,
  objType: string | null,
  thumbWidth: number = 600
): Promise<ObjectImage> {
  // Build a DSS2 fallback URL for any object with coordinates
  const dss2Fallback = (ra != null && dec != null) ? buildDss2Url(ra, dec, sizeArcmin) : null;

  // 1. Forced image URL — try API thumbnail first, then direct construction
  if (forcedImageUrl) {
    const fileName = extractWikimediaFilename(forcedImageUrl);
    let displayUrl: string = forcedImageUrl;

    if (fileName) {
      // Strategy 1: API call (most reliable, handles huge files)
      const apiThumb = await getWikimediaThumbnailViaApi(fileName, thumbWidth);
      if (apiThumb) {
        displayUrl = apiThumb;
      } else {
        // Strategy 2: Direct URL construction
        const directThumb = buildWikimediaThumbUrl(forcedImageUrl, thumbWidth);
        if (directThumb) displayUrl = directThumb;
        // Strategy 3: raw URL as last resort (may be blocked for huge files)
      }

      const meta = await fetchWikimediaMetadata(fileName);
      return {
        url: displayUrl,
        artist: meta.artist ?? "Wikimedia Commons",
        date: meta.date,
        license: meta.license,
        licenseUrl: meta.licenseUrl,
        filePageUrl: meta.filePageUrl,
        source: "forced",
        pageUrl: meta.filePageUrl,
        fallbackUrl: dss2Fallback,
      };
    }

    // Non-Wikimedia forced URL
    return {
      url: forcedImageUrl,
      artist: null,
      date: null,
      license: null,
      licenseUrl: null,
      filePageUrl: null,
      source: "forced",
      pageUrl: null,
      fallbackUrl: dss2Fallback,
    };
  }

  // 2. Stars → skip Wikipedia, go straight to DSS2
  const isStar = objType && STAR_TYPES.some(t => objType.toLowerCase().includes(t.toLowerCase()));

  // 3. Dynamic search via Wikipedia (skip for stars)
  if (!isStar) {
    const searchTerms = [
      imageSearchQuery,
      commonName,
      catalogId.replace(/\s+/g, " "),
      catalogId.startsWith("M") ? `Messier ${catalogId.slice(1).trim()}` : null,
    ].filter(Boolean) as string[];

    for (const term of searchTerms) {
      const result = await tryWikipedia(term, thumbWidth, dss2Fallback);
      if (result) return result;
    }
  }

  // 4. Fallback: DSS2
  if (dss2Fallback) {
    return {
      url: dss2Fallback,
      artist: "DSS2 / CDS Strasbourg",
      date: null,
      license: "Public Domain",
      licenseUrl: null,
      filePageUrl: null,
      source: "survey",
      pageUrl: "https://aladin.cds.unistra.fr/",
      fallbackUrl: null,
    };
  }

  return {
    url: "",
    artist: null, date: null, license: null, licenseUrl: null,
    filePageUrl: null, source: "survey", pageUrl: null, fallbackUrl: null,
  };
}

async function tryWikipedia(title: string, thumbWidth: number = 400, fallbackUrl: string | null = null): Promise<ObjectImage | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title)}&srnamespace=0&srlimit=3&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const results = searchData?.query?.search;
    if (!results || results.length === 0) return null;

    const pageTitle = results[0].title;

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
        if (!cats.some(cat => ASTRO_CATEGORIES.some(kw => cat.includes(kw)))) return null;
      }
    }

    const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&piprop=thumbnail&pithumbsize=${thumbWidth}&format=json&origin=*`;
    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return null;
    const imgData = await imgRes.json();
    const pages = imgData?.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as any;
    const thumbnail = page?.thumbnail;
    if (!thumbnail?.source) return null;

    const src: string = thumbnail.source;
    if (src.endsWith(".svg") || src.endsWith(".svg.png")) return null;
    if (thumbnail.width && thumbnail.width < 200) return null;

    const fileName = src.split("/").pop()?.split("?")[0];
    let artist: string | null = null, date: string | null = null;
    let license: string | null = null, licenseUrl: string | null = null, filePageUrl: string | null = null;

    if (fileName) {
      const meta = await fetchWikimediaMetadata(decodeURIComponent(fileName));
      artist = meta.artist; date = meta.date;
      license = meta.license; licenseUrl = meta.licenseUrl; filePageUrl = meta.filePageUrl;
    }

    return {
      url: src, artist: artist ?? "Wikimedia Commons", date, license, licenseUrl, filePageUrl,
      source: "wikipedia",
      pageUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
      fallbackUrl,
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
  forcedImageUrl?: string | null,
  objType?: string | null,
  thumbWidth: number = 600
) {
  return useQuery({
    queryKey: ["object-image", catalogId, forcedImageUrl, thumbWidth],
    queryFn: () =>
      fetchObjectImage(
        catalogId!,
        commonName ?? null,
        ra ?? null,
        dec ?? null,
        sizeArcmin ?? null,
        imageSearchQuery ?? null,
        forcedImageUrl ?? null,
        objType ?? null,
        thumbWidth
      ),
    enabled: !!catalogId,
    staleTime: Infinity,
    retry: 1,
  });
}
