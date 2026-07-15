import React, { createContext, useContext, useState, useEffect } from "react";
import { readCustomLocation, saveCustomLocation, clearCustomLocation, type CustomLocation } from "@/lib/custom-location";

export interface ObservationLocation {
  name: string;
  lat: number;
  lng: number;
  timezone: string;
  /** True when the active location was set via the "custom spot" flow. */
  isCustom?: boolean;
}

interface ObservationContextType {
  date: Date;
  setDate: (date: Date) => void;
  time: string;
  setTime: (time: string) => void;
  location: ObservationLocation;
  setLocation: (location: ObservationLocation) => void;
  /** Save a custom user-defined spot (map/coords + label). */
  setCustomLocation: (loc: CustomLocation) => void;
  /** Drop the custom spot and revert to the default location. */
  clearCustom: () => void;
  isDetectingLocation: boolean;
}

const STORAGE_KEY = "cf_observation_location";

const defaultLocation: ObservationLocation = {
  name: "Brullioles, FR",
  lat: 45.7333,
  lng: 4.4833,
  timezone: "Europe/Paris",
};

const loadStoredLocation = (): ObservationLocation | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ObservationLocation;
    if (parsed?.name && /brullioles/i.test(parsed.name) && parsed.name !== "Brullioles, FR" && !parsed.isCustom) {
      parsed.name = "Brullioles, FR";
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch {}
    }
    return parsed;
  } catch {}
  return null;
};

const customToLocation = (c: CustomLocation): ObservationLocation => ({
  name: c.label,
  lat: c.lat,
  lng: c.lng,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  isCustom: true,
});

const ObservationContext = createContext<ObservationContextType>({
  date: new Date(),
  setDate: () => {},
  time: "22:00",
  setTime: () => {},
  location: defaultLocation,
  setLocation: () => {},
  setCustomLocation: () => {},
  clearCustom: () => {},
  isDetectingLocation: false,
});

export const useObservation = () => useContext(ObservationContext);

export const ObservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("22:00");
  const [location, setLocationState] = useState<ObservationLocation>(() => {
    // Custom location wins over the last regular location on boot.
    const custom = readCustomLocation();
    if (custom) return customToLocation(custom);
    return loadStoredLocation() ?? defaultLocation;
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const setLocation = (loc: ObservationLocation) => {
    setLocationState(loc);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)); } catch {}
    // Any regular selection clears the one-slot custom spot.
    if (!loc.isCustom) clearCustomLocation();
  };

  const setCustomLocation = (loc: CustomLocation) => {
    saveCustomLocation(loc);
    const next = customToLocation(loc);
    setLocationState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const clearCustom = () => {
    clearCustomLocation();
    setLocationState(defaultLocation);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLocation)); } catch {}
  };

  // Auto-detect on first visit (no stored location and no custom spot)
  useEffect(() => {
    if (readCustomLocation()) return;
    if (loadStoredLocation()) return;
    if (!navigator.geolocation) return;
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        let name = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
          const country = data.address?.country_code?.toUpperCase();
          if (city && country) name = `${city}, ${country}`;
          else if (city) name = city;
        } catch {}
        setLocation({ name, lat, lng, timezone });
        setIsDetectingLocation(false);
      },
      () => setIsDetectingLocation(false),
      { timeout: 8000 }
    );
  }, []);

  return (
    <ObservationContext.Provider value={{
      date, setDate, time, setTime, location, setLocation, setCustomLocation, clearCustom, isDetectingLocation
    }}>
      {children}
    </ObservationContext.Provider>
  );
};
