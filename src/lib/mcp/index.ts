import { defineMcp } from "@lovable.dev/mcp-js";
import searchObjects from "./tools/search-objects";
import getObject from "./tools/get-object";
import nearestDarkSites from "./tools/nearest-dark-sites";
import astroWeather from "./tools/astro-weather";

export default defineMcp({
  name: "cosmic-frame-mcp",
  title: "Cosmic Frame",
  version: "0.1.0",
  instructions:
    "Public astrophotography planning tools from Cosmic Frame. Search the deep-sky catalog, look up an object's imaging metadata (magnitude, size, moon tolerance, recommended filter, exposure guides), find the nearest dark-sky sites to a location, and get an astronomy-oriented weather forecast. All tools are read-only and use public data.",
  tools: [searchObjects, getObject, nearestDarkSites, astroWeather],
});
