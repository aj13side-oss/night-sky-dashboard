// Celestial objects database with categories and image placeholders

export type ObjectCategory = "planets" | "deepsky" | "asteroids" | "showers" | "auroras";

export interface CelestialObject {
  id: string;
  name: string;
  category: ObjectCategory;
  type: string;
  constellation: string;
  magnitude: number;
  bestTime: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  imagePath?: string;
  visible: boolean;
}

export interface MeteorShower {
  id: string;
  name: string;
  category: "showers";
  peakDate: string;
  active: string;
  zhr: number;
  radiant: string;
  speed: number;
  parentBody: string;
  description: string;
  imagePath?: string;
}

export interface AuroraForecast {
  id: string;
  name: string;
  category: "auroras";
  kpIndex: number;
  probability: number;
  bestLatitude: string;
  description: string;
  imagePath?: string;
}

export function getPlanets(month: number): CelestialObject[] {
  return [
    { id: "mercury", name: "Mercury", category: "planets", type: "Terrestrial", constellation: ["Capricornus","Aquarius","Pisces","Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpius","Sagittarius"][month], magnitude: -0.3, bestTime: "06:00", difficulty: "Hard", description: "Closest planet to the Sun. Hard to observe due to low altitude.", visible: month >= 2 && month <= 5 },
    { id: "venus", name: "Venus", category: "planets", type: "Terrestrial", constellation: ["Pisces","Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpius","Sagittarius","Capricornus","Aquarius"][month], magnitude: -4.1, bestTime: "04:30", difficulty: "Easy", description: "Brightest planet. Visible as morning or evening star.", visible: true },
    { id: "mars", name: "Mars", category: "planets", type: "Terrestrial", constellation: ["Gemini","Cancer","Cancer","Leo","Leo","Virgo","Virgo","Libra","Scorpius","Sagittarius","Capricornus","Aquarius"][month], magnitude: 1.2, bestTime: "23:00", difficulty: "Easy", description: "The Red Planet. Best observed near opposition.", visible: month >= 5 },
    { id: "jupiter", name: "Jupiter", category: "planets", type: "Gas Giant", constellation: ["Taurus","Taurus","Taurus","Gemini","Gemini","Gemini","Cancer","Cancer","Leo","Leo","Virgo","Virgo"][month], magnitude: -2.5, bestTime: "21:00", difficulty: "Easy", description: "Largest planet. Great Spot and Galilean moons visible.", visible: true },
    { id: "saturn", name: "Saturn", category: "planets", type: "Gas Giant", constellation: ["Aquarius","Aquarius","Pisces","Pisces","Pisces","Pisces","Pisces","Pisces","Pisces","Aquarius","Aquarius","Aquarius"][month], magnitude: 0.8, bestTime: "22:00", difficulty: "Easy", description: "Rings visible in small telescopes.", visible: month >= 3 && month <= 10 },
    { id: "uranus", name: "Uranus", category: "planets", type: "Ice Giant", constellation: "Taurus", magnitude: 5.7, bestTime: "22:30", difficulty: "Hard", description: "Requires binoculars or telescope. Faint blue-green disc.", visible: month >= 8 || month <= 3 },
    { id: "neptune", name: "Neptune", category: "planets", type: "Ice Giant", constellation: "Pisces", magnitude: 7.8, bestTime: "21:30", difficulty: "Hard", description: "Requires telescope. Tiny blue disc.", visible: month >= 6 && month <= 12 },
  ];
}

export function getDeepSkyObjects(month: number): CelestialObject[] {
  const all: CelestialObject[] = [
    { id: "m42", name: "M42 — Orion Nebula", category: "deepsky", type: "Emission Nebula", constellation: "Orion", magnitude: 4.0, bestTime: "22:00", difficulty: "Easy", description: "The brightest nebula. Spectacular in any instrument.", visible: month >= 10 || month <= 2 },
    { id: "ngc2237", name: "NGC 2237 — Rosette Nebula", category: "deepsky", type: "Emission Nebula", constellation: "Monoceros", magnitude: 9.0, bestTime: "23:30", difficulty: "Hard", description: "Large rose-shaped nebula. Best with narrowband filters.", visible: month >= 11 || month <= 2 },
    { id: "m27", name: "M27 — Dumbbell Nebula", category: "deepsky", type: "Planetary Nebula", constellation: "Vulpecula", magnitude: 7.5, bestTime: "22:00", difficulty: "Medium", description: "Bright planetary nebula. Dumbbell shape visible in telescopes.", visible: month >= 5 && month <= 9 },
    { id: "m57", name: "M57 — Ring Nebula", category: "deepsky", type: "Planetary Nebula", constellation: "Lyra", magnitude: 8.8, bestTime: "22:30", difficulty: "Medium", description: "Classic ring shape. Near Vega.", visible: month >= 5 && month <= 10 },
    { id: "m1", name: "M1 — Crab Nebula", category: "deepsky", type: "Supernova Remnant", constellation: "Taurus", magnitude: 8.4, bestTime: "23:00", difficulty: "Hard", description: "Remnant of the 1054 supernova. Challenging but rewarding.", visible: month >= 9 || month <= 3 },
    { id: "ngc7000", name: "NGC 7000 — North America Nebula", category: "deepsky", type: "Emission Nebula", constellation: "Cygnus", magnitude: 4.0, bestTime: "22:00", difficulty: "Medium", description: "Large emission nebula shaped like North America.", visible: month >= 5 && month <= 10 },
    { id: "ic1396", name: "IC 1396 — Elephant's Trunk", category: "deepsky", type: "Emission Nebula", constellation: "Cepheus", magnitude: 3.5, bestTime: "22:00", difficulty: "Medium", description: "Large, faint nebula with the famous Elephant Trunk.", visible: month >= 6 && month <= 11 },
    { id: "m31", name: "M31 — Andromeda Galaxy", category: "deepsky", type: "Galaxy", constellation: "Andromeda", magnitude: 3.4, bestTime: "21:00", difficulty: "Easy", description: "Nearest large galaxy. Visible to the naked eye.", visible: month >= 7 || month <= 1 },
    { id: "m51", name: "M51 — Whirlpool Galaxy", category: "deepsky", type: "Galaxy", constellation: "Canes Venatici", magnitude: 8.4, bestTime: "23:00", difficulty: "Medium", description: "Classic face-on spiral with companion NGC 5195.", visible: month >= 2 && month <= 7 },
    { id: "m81", name: "M81 — Bode's Galaxy", category: "deepsky", type: "Galaxy", constellation: "Ursa Major", magnitude: 6.9, bestTime: "22:00", difficulty: "Medium", description: "Beautiful spiral. Pair with M82.", visible: month >= 1 && month <= 6 },
    { id: "m104", name: "M104 — Sombrero Galaxy", category: "deepsky", type: "Galaxy", constellation: "Virgo", magnitude: 8.0, bestTime: "23:30", difficulty: "Medium", description: "Distinctive sombrero shape with prominent dust lane.", visible: month >= 2 && month <= 6 },
    { id: "m33", name: "M33 — Triangulum Galaxy", category: "deepsky", type: "Galaxy", constellation: "Triangulum", magnitude: 5.7, bestTime: "22:00", difficulty: "Medium", description: "Third largest in Local Group. Face-on spiral.", visible: month >= 8 || month <= 1 },
    { id: "m45", name: "M45 — Pleiades", category: "deepsky", type: "Open Cluster", constellation: "Taurus", magnitude: 1.6, bestTime: "21:00", difficulty: "Easy", description: "The Seven Sisters. Stunning in binoculars.", visible: month >= 9 || month <= 3 },
    { id: "m13", name: "M13 — Hercules Cluster", category: "deepsky", type: "Globular Cluster", constellation: "Hercules", magnitude: 5.8, bestTime: "22:00", difficulty: "Easy", description: "Brightest northern globular. Resolves in 6\" scopes.", visible: month >= 3 && month <= 9 },
    { id: "ngc884", name: "NGC 869/884 — Double Cluster", category: "deepsky", type: "Open Cluster", constellation: "Perseus", magnitude: 3.7, bestTime: "21:30", difficulty: "Easy", description: "Two open clusters side by side. Breathtaking in binoculars.", visible: month >= 8 || month <= 2 },
    { id: "m3", name: "M3", category: "deepsky", type: "Globular Cluster", constellation: "Canes Venatici", magnitude: 6.2, bestTime: "00:00", difficulty: "Easy", description: "One of the brightest globulars. Rich star field.", visible: month >= 2 && month <= 7 },
  ];
  return all;
}

export function getAsteroids(month: number): CelestialObject[] {
  return [
    { id: "vesta", name: "4 Vesta", category: "asteroids", type: "Asteroid", constellation: ["Gemini","Gemini","Cancer","Leo","Leo","Virgo","Virgo","Libra","Scorpius","Sagittarius","Capricornus","Aquarius"][month], magnitude: 6.5, bestTime: "23:00", difficulty: "Medium", description: "Brightest asteroid. Sometimes visible to naked eye.", visible: true },
    { id: "ceres", name: "1 Ceres", category: "asteroids", type: "Dwarf Planet", constellation: ["Sagittarius","Capricornus","Capricornus","Aquarius","Aquarius","Pisces","Pisces","Aries","Taurus","Taurus","Gemini","Gemini"][month], magnitude: 7.2, bestTime: "22:00", difficulty: "Medium", description: "Largest asteroid / dwarf planet. Requires binoculars.", visible: true },
    { id: "pallas", name: "2 Pallas", category: "asteroids", type: "Asteroid", constellation: "Virgo", magnitude: 8.0, bestTime: "00:00", difficulty: "Hard", description: "Second largest asteroid. Needs telescope.", visible: month >= 2 && month <= 6 },
    { id: "juno", name: "3 Juno", category: "asteroids", type: "Asteroid", constellation: "Leo", magnitude: 8.7, bestTime: "23:30", difficulty: "Hard", description: "One of the largest main-belt asteroids.", visible: month >= 1 && month <= 5 },
  ];
}

export function getMeteorShowers(): MeteorShower[] {
  return [
    { id: "quadrantids", name: "Quadrantids", category: "showers", peakDate: "Jan 3-4", active: "Dec 28 – Jan 12", zhr: 120, radiant: "Boötes", speed: 41, parentBody: "2003 EH1", description: "Strong shower, but peak is short (6h). Best after midnight." },
    { id: "lyrids", name: "Lyrids", category: "showers", peakDate: "Apr 22-23", active: "Apr 16 – Apr 25", zhr: 18, radiant: "Lyra", speed: 49, parentBody: "C/1861 G1 Thatcher", description: "One of the oldest known showers. Occasional bright fireballs." },
    { id: "eta-aquarids", name: "Eta Aquariids", category: "showers", peakDate: "May 6-7", active: "Apr 19 – May 28", zhr: 50, radiant: "Aquarius", speed: 66, parentBody: "1P/Halley", description: "Debris from Halley's Comet. Best from southern hemisphere." },
    { id: "perseids", name: "Perseids", category: "showers", peakDate: "Aug 12-13", active: "Jul 17 – Aug 24", zhr: 100, radiant: "Perseus", speed: 59, parentBody: "109P/Swift–Tuttle", description: "The most popular shower. Warm summer nights, bright meteors." },
    { id: "draconids", name: "Draconids", category: "showers", peakDate: "Oct 8-9", active: "Oct 6 – Oct 10", zhr: 10, radiant: "Draco", speed: 20, parentBody: "21P/Giacobini-Zinner", description: "Best in the evening, unlike most showers. Variable rates." },
    { id: "orionids", name: "Orionids", category: "showers", peakDate: "Oct 21-22", active: "Oct 2 – Nov 7", zhr: 20, radiant: "Orion", speed: 66, parentBody: "1P/Halley", description: "Another Halley's Comet shower. Fast meteors with persistent trains." },
    { id: "leonids", name: "Leonids", category: "showers", peakDate: "Nov 17-18", active: "Nov 6 – Nov 30", zhr: 15, radiant: "Leo", speed: 71, parentBody: "55P/Tempel–Tuttle", description: "Famous for periodic storms. Very fast meteors." },
    { id: "geminids", name: "Geminids", category: "showers", peakDate: "Dec 14-15", active: "Dec 4 – Dec 20", zhr: 150, radiant: "Gemini", speed: 35, parentBody: "3200 Phaethon", description: "King of meteor showers. Bright, slow, colorful meteors." },
  ];
}

export function getAuroraForecast(): AuroraForecast[] {
  return [
    { id: "aurora-current", name: "Current Aurora Forecast", category: "auroras", kpIndex: 3, probability: 15, bestLatitude: "> 60° N/S", description: "Low geomagnetic activity. Aurora visible at high latitudes only." },
    { id: "aurora-3day", name: "3-Day Outlook", category: "auroras", kpIndex: 4, probability: 30, bestLatitude: "> 55° N/S", description: "Minor geomagnetic storm expected. Possible sightings at 55°+ latitude." },
  ];
}
