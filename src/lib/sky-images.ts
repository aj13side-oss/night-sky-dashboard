/**
 * Sky survey identifiers for HiPS2FITS and ESASky.
 * "mellinger" is better for large emission/dark nebulae; "dss2" for fine detail.
 */
export type SkyImageSurvey = "dss2" | "mellinger";

const HIPS_IDS: Record<SkyImageSurvey, string> = {
  dss2: "CDS/P/DSS2/color",
  mellinger: "CDS/P/Mellinger/color",
};

const ESA_HIPS: Record<SkyImageSurvey, string> = {
  dss2: "DSS2%20color",
  mellinger: "Mellinger%20color",
};

/**
 * Generate a sky survey thumbnail URL from CDS HiPS2FITS service.
 */
export function getSkyImageUrl(
  ra: number | null,
  dec: number | null,
  sizeArcmin: number | null,
  width = 200,
  height = 200,
  survey: SkyImageSurvey = "mellinger"
): string | null {
  if (ra == null || dec == null) return null;

  const fovDeg = calculateFov(sizeArcmin);

  const params = new URLSearchParams({
    hips: HIPS_IDS[survey],
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
 * Build an HiPS2FITS URL with explicit FOV in degrees (for FOV calculator).
 */
export function getSkyImageUrlWithFov(
  ra: number,
  dec: number,
  fovW: number,
  fovH: number,
  survey: SkyImageSurvey = "dss2"
): string {
  const w = fovW < 0.5 ? 1600 : fovW < 1 ? 1400 : 1200;
  const h = Math.round(w * (fovH / Math.max(fovW, 0.001)));
  const params = new URLSearchParams({
    hips: HIPS_IDS[survey],
    width: String(w),
    height: String(h),
    fov: String(fovW),
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
  sizeArcmin: number | null,
  survey: SkyImageSurvey = "mellinger"
): string {
  const fov = calculateFov(sizeArcmin);
  const target = encodeURIComponent(catalogId.replace(/\s+/g, ""));
  return `https://sky.esa.int/esasky-tap/embed.html?target=${target}&fov=${fov}&hips=${ESA_HIPS[survey]}`;
}
