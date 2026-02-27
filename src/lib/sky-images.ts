/**
 * Generate a sky survey thumbnail URL from CDS HiPS2FITS service.
 * Uses DSS2 color survey — free, no API key, CORS-friendly.
 */
export function getSkyImageUrl(
  ra: number | null,
  dec: number | null,
  sizeArcmin: number | null,
  width = 200,
  height = 200
): string | null {
  if (ra == null || dec == null) return null;

  const fovDeg = calculateFov(sizeArcmin);

  const params = new URLSearchParams({
    hips: "CDS/P/DSS2/color",
    width: String(width),
    height: String(height),
    fov: String(fovDeg),
    projection: "TAN",
    coordsys: "icrs",
    ra: String(ra),
    dec: String(dec),
    format: "jpg",
  });

  return `https://alasky.cds.unistra.fr/hips-image-services/hips2fits?${params.toString()}`;
}

/**
 * Calculate FOV in degrees from size_max (arcmin).
 * (size_max / 60) * 1.5 margin, clamped [0.05°, 5.0°], default 1.0°.
 */
export function calculateFov(sizeArcmin: number | null): number {
  if (!sizeArcmin || sizeArcmin <= 0) return 1.0;
  return Math.max(0.05, Math.min((sizeArcmin / 60) * 1.5, 5.0));
}

/**
 * Generate an ESASky embed URL for interactive sky viewing.
 */
export function getEsaSkyEmbedUrl(
  catalogId: string,
  sizeArcmin: number | null
): string {
  const fov = calculateFov(sizeArcmin);
  const target = encodeURIComponent(catalogId.replace(/\s+/g, ""));
  return `https://sky.esa.int/esasky-tap/embed.html?target=${target}&fov=${fov}&hips=DSS2%20color`;
}
