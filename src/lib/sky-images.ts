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

  // Field of view in degrees — use object size or default to 0.25°
  const fovDeg = sizeArcmin ? Math.max(Math.min((sizeArcmin / 60) * 2.5, 5), 0.05) : 0.25;

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
