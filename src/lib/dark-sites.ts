export interface DarkSite {
  name: string;
  lat: number;
  lng: number;
  bortle: number;
  country: string;
  designation?: string; // e.g. "IDA Dark Sky Park"
}

export const DARK_SITES: DarkSite[] = [
  // Europe
  { name: "Pic du Midi", lat: 42.9369, lng: 0.1411, bortle: 1, country: "FR", designation: "IDA Dark Sky Reserve" },
  { name: "Alqueva", lat: 38.22, lng: -7.16, bortle: 1, country: "PT", designation: "IDA Dark Sky Reserve" },
  { name: "Cévennes National Park", lat: 44.35, lng: 3.58, bortle: 2, country: "FR", designation: "IDA Dark Sky Reserve" },
  { name: "Galloway Forest Park", lat: 55.08, lng: -4.63, bortle: 2, country: "GB", designation: "IDA Dark Sky Park" },
  { name: "Kerry International", lat: 51.77, lng: -9.85, bortle: 2, country: "IE", designation: "IDA Dark Sky Reserve" },
  { name: "Zselic Starry Sky Park", lat: 46.23, lng: 17.77, bortle: 2, country: "HU", designation: "IDA Dark Sky Park" },
  { name: "Westhavelland", lat: 52.72, lng: 12.33, bortle: 3, country: "DE", designation: "IDA Dark Sky Reserve" },
  { name: "Brecon Beacons", lat: 51.88, lng: -3.44, bortle: 3, country: "GB", designation: "IDA Dark Sky Reserve" },
  { name: "Aosta Valley", lat: 45.74, lng: 7.32, bortle: 2, country: "IT" },
  { name: "Hortobágy National Park", lat: 47.58, lng: 21.15, bortle: 2, country: "HU", designation: "IDA Dark Sky Park" },

  // North America
  { name: "Cherry Springs State Park", lat: 41.66, lng: -77.82, bortle: 1, country: "US", designation: "IDA Gold Tier" },
  { name: "Big Bend National Park", lat: 29.25, lng: -103.25, bortle: 1, country: "US", designation: "IDA Dark Sky Park" },
  { name: "Natural Bridges NM", lat: 37.6, lng: -110.01, bortle: 1, country: "US", designation: "IDA Dark Sky Park" },
  { name: "Death Valley National Park", lat: 36.46, lng: -116.87, bortle: 1, country: "US", designation: "IDA Gold Tier" },
  { name: "Jasper National Park", lat: 52.87, lng: -117.95, bortle: 1, country: "CA", designation: "IDA Dark Sky Preserve" },
  { name: "Mont-Mégantic", lat: 45.45, lng: -71.15, bortle: 2, country: "CA", designation: "IDA Dark Sky Reserve" },
  { name: "Grand Canyon National Park", lat: 36.1, lng: -112.11, bortle: 2, country: "US", designation: "IDA Dark Sky Park" },
  { name: "Joshua Tree National Park", lat: 33.87, lng: -115.90, bortle: 2, country: "US" },
  { name: "Bryce Canyon National Park", lat: 37.59, lng: -112.19, bortle: 2, country: "US", designation: "IDA Dark Sky Park" },
  { name: "Great Basin National Park", lat: 38.98, lng: -114.30, bortle: 1, country: "US", designation: "IDA Dark Sky Park" },

  // Southern Hemisphere & other
  { name: "NamibRand Nature Reserve", lat: -25.07, lng: 15.99, bortle: 1, country: "NA", designation: "IDA Gold Tier" },
  { name: "Aoraki Mackenzie", lat: -44.00, lng: 170.47, bortle: 1, country: "NZ", designation: "IDA Dark Sky Reserve" },
  { name: "Atacama Desert", lat: -24.63, lng: -70.40, bortle: 1, country: "CL" },
  { name: "Warrumbungle National Park", lat: -31.28, lng: 149.00, bortle: 2, country: "AU", designation: "IDA Dark Sky Park" },
];

/**
 * Haversine distance in km
 */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Bortle exposure multiplier — how much more exposure you need vs Bortle 1
 */
export const BORTLE_MULTIPLIERS: Record<number, { multiplier: number; limitingMag: number }> = {
  1: { multiplier: 1.0, limitingMag: 7.6 },
  2: { multiplier: 1.2, limitingMag: 7.1 },
  3: { multiplier: 1.5, limitingMag: 6.6 },
  4: { multiplier: 2.0, limitingMag: 6.2 },
  5: { multiplier: 3.0, limitingMag: 5.9 },
  6: { multiplier: 4.0, limitingMag: 5.5 },
  7: { multiplier: 6.0, limitingMag: 5.0 },
  8: { multiplier: 10.0, limitingMag: 4.5 },
  9: { multiplier: 20.0, limitingMag: 4.0 },
};
