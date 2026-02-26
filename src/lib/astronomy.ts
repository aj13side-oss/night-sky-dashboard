// Astronomy calculation utilities

export function getMoonPhase(date: Date = new Date()): { phase: number; name: string; illumination: number; emoji: string } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let r = year % 100;
  r %= 19;
  if (r > 9) r -= 19;
  r = ((r * 11) % 30) + month + day;
  if (month < 3) r += 2;
  r -= (year < 2000) ? 4 : 8.3;
  r = Math.floor(r + 0.5) % 30;
  if (r < 0) r += 30;

  const phase = r;
  const illumination = Math.round((1 - Math.cos((phase / 29.53) * 2 * Math.PI)) / 2 * 100);

  let name: string;
  let emoji: string;
  if (phase === 0) { name = "New Moon"; emoji = "🌑"; }
  else if (phase < 7) { name = "Waxing Crescent"; emoji = "🌒"; }
  else if (phase === 7) { name = "First Quarter"; emoji = "🌓"; }
  else if (phase < 15) { name = "Waxing Gibbous"; emoji = "🌔"; }
  else if (phase === 15) { name = "Full Moon"; emoji = "🌕"; }
  else if (phase < 22) { name = "Waning Gibbous"; emoji = "🌖"; }
  else if (phase === 22) { name = "Last Quarter"; emoji = "🌗"; }
  else { name = "Waning Crescent"; emoji = "🌘"; }

  return { phase, name, illumination, emoji };
}

export function getSunTimes(date: Date = new Date(), lat = 48.8566, lng = 2.3522) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const declination = -23.45 * Math.cos(toRad((360 / 365) * (dayOfYear + 10)));
  const hourAngle = toDeg(Math.acos(
    (Math.cos(toRad(90.833)) / (Math.cos(toRad(lat)) * Math.cos(toRad(declination)))) -
    Math.tan(toRad(lat)) * Math.tan(toRad(declination))
  ));

  const solarNoon = 720 - 4 * lng - date.getTimezoneOffset();
  const sunriseMin = solarNoon - hourAngle * 4;
  const sunsetMin = solarNoon + hourAngle * 4;

  const toTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const astroHourAngle = toDeg(Math.acos(
    (Math.cos(toRad(108)) / (Math.cos(toRad(lat)) * Math.cos(toRad(declination)))) -
    Math.tan(toRad(lat)) * Math.tan(toRad(declination))
  ));
  const astroTwilightStart = solarNoon - astroHourAngle * 4;
  const astroTwilightEnd = solarNoon + astroHourAngle * 4;

  return {
    sunrise: toTime(sunriseMin),
    sunset: toTime(sunsetMin),
    solarNoon: toTime(solarNoon),
    dayLength: toTime(sunsetMin - sunriseMin),
    astroTwilightStart: toTime(astroTwilightStart),
    astroTwilightEnd: toTime(astroTwilightEnd),
  };
}

export interface PlanetEphemeris {
  name: string;
  constellation: string;
  magnitude: number;
  riseTime: string;
  setTime: string;
  visible: boolean;
}

export function getPlanetEphemerides(date: Date = new Date()): PlanetEphemeris[] {
  const month = date.getMonth();
  const planets: PlanetEphemeris[] = [
    { name: "Mercury", constellation: ["Capricornus", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpius", "Sagittarius"][month], magnitude: -0.3, riseTime: "05:42", setTime: "16:30", visible: month >= 2 && month <= 5 },
    { name: "Venus", constellation: ["Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpius", "Sagittarius", "Capricornus", "Aquarius"][month], magnitude: -4.1, riseTime: "04:15", setTime: "15:20", visible: true },
    { name: "Mars", constellation: ["Gemini", "Cancer", "Cancer", "Leo", "Leo", "Virgo", "Virgo", "Libra", "Scorpius", "Sagittarius", "Capricornus", "Aquarius"][month], magnitude: 1.2, riseTime: "22:30", setTime: "10:45", visible: month >= 5 },
    { name: "Jupiter", constellation: ["Taurus", "Taurus", "Taurus", "Gemini", "Gemini", "Gemini", "Cancer", "Cancer", "Leo", "Leo", "Virgo", "Virgo"][month], magnitude: -2.5, riseTime: "19:00", setTime: "05:30", visible: true },
    { name: "Saturn", constellation: ["Aquarius", "Aquarius", "Pisces", "Pisces", "Pisces", "Pisces", "Pisces", "Pisces", "Pisces", "Aquarius", "Aquarius", "Aquarius"][month], magnitude: 0.8, riseTime: "21:15", setTime: "07:00", visible: month >= 3 && month <= 10 },
  ];
  return planets;
}

export interface CelestialObject {
  name: string;
  type: "Galaxy" | "Nebula" | "Cluster" | "Planet" | "Double Star";
  constellation: string;
  magnitude: number;
  bestTime: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

export function getTonightObjects(): CelestialObject[] {
  const now = new Date();
  const month = now.getMonth();

  const winterObjects: CelestialObject[] = [
    { name: "M42 - Orion Nebula", type: "Nebula", constellation: "Orion", magnitude: 4.0, bestTime: "22:00", difficulty: "Easy" },
    { name: "M45 - Pleiades", type: "Cluster", constellation: "Taurus", magnitude: 1.6, bestTime: "21:00", difficulty: "Easy" },
    { name: "M1 - Crab Nebula", type: "Nebula", constellation: "Taurus", magnitude: 8.4, bestTime: "23:00", difficulty: "Hard" },
    { name: "NGC 2237 - Rosette", type: "Nebula", constellation: "Monoceros", magnitude: 9.0, bestTime: "23:30", difficulty: "Hard" },
    { name: "M35", type: "Cluster", constellation: "Gemini", magnitude: 5.3, bestTime: "22:30", difficulty: "Medium" },
  ];

  const springObjects: CelestialObject[] = [
    { name: "M81 - Bode's Galaxy", type: "Galaxy", constellation: "Ursa Major", magnitude: 6.9, bestTime: "22:00", difficulty: "Medium" },
    { name: "M51 - Whirlpool Galaxy", type: "Galaxy", constellation: "Canes Venatici", magnitude: 8.4, bestTime: "23:00", difficulty: "Medium" },
    { name: "M104 - Sombrero Galaxy", type: "Galaxy", constellation: "Virgo", magnitude: 8.0, bestTime: "23:30", difficulty: "Medium" },
    { name: "M3", type: "Cluster", constellation: "Canes Venatici", magnitude: 6.2, bestTime: "00:00", difficulty: "Easy" },
    { name: "M13 - Hercules Cluster", type: "Cluster", constellation: "Hercules", magnitude: 5.8, bestTime: "01:00", difficulty: "Easy" },
  ];

  const summerObjects: CelestialObject[] = [
    { name: "M31 - Andromeda Galaxy", type: "Galaxy", constellation: "Andromeda", magnitude: 3.4, bestTime: "23:00", difficulty: "Easy" },
    { name: "M27 - Dumbbell Nebula", type: "Nebula", constellation: "Vulpecula", magnitude: 7.5, bestTime: "22:00", difficulty: "Medium" },
    { name: "M57 - Ring Nebula", type: "Nebula", constellation: "Lyra", magnitude: 8.8, bestTime: "22:30", difficulty: "Medium" },
    { name: "Albireo", type: "Double Star", constellation: "Cygnus", magnitude: 3.1, bestTime: "22:00", difficulty: "Easy" },
    { name: "M13 - Hercules Cluster", type: "Cluster", constellation: "Hercules", magnitude: 5.8, bestTime: "21:30", difficulty: "Easy" },
  ];

  const autumnObjects: CelestialObject[] = [
    { name: "M31 - Andromeda Galaxy", type: "Galaxy", constellation: "Andromeda", magnitude: 3.4, bestTime: "21:00", difficulty: "Easy" },
    { name: "NGC 7331", type: "Galaxy", constellation: "Pegasus", magnitude: 9.5, bestTime: "22:00", difficulty: "Hard" },
    { name: "M33 - Triangulum Galaxy", type: "Galaxy", constellation: "Triangulum", magnitude: 5.7, bestTime: "22:30", difficulty: "Medium" },
    { name: "NGC 869/884 - Double Cluster", type: "Cluster", constellation: "Perseus", magnitude: 3.7, bestTime: "21:30", difficulty: "Easy" },
    { name: "M76 - Little Dumbbell", type: "Nebula", constellation: "Perseus", magnitude: 10.1, bestTime: "23:00", difficulty: "Hard" },
  ];

  if (month >= 11 || month <= 1) return winterObjects;
  if (month >= 2 && month <= 4) return springObjects;
  if (month >= 5 && month <= 7) return summerObjects;
  return autumnObjects;
}

export function getWeatherConditions() {
  return {
    temperature: 4,
    humidity: 65,
    cloudCover: 15,
    transparency: "Good",
    seeing: "Average",
    windSpeed: 12,
    dewPoint: -2,
    bortleScale: 5,
    sqm: 20.5,
  };
}
