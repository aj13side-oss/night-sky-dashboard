import React, { createContext, useContext, useState, useEffect } from "react";

export interface ObservationLocation {
  name: string;
  lat: number;
  lng: number;
  timezone: string;
}

interface ObservationContextType {
  date: Date;
  setDate: (date: Date) => void;
  time: string;
  setTime: (time: string) => void;
  location: ObservationLocation;
  setLocation: (location: ObservationLocation) => void;
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
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
};

const ObservationContext = createContext<ObservationContextType | null>(null);

export const useObservation = () => {
  const ctx = useContext(ObservationContext);
  if (!ctx) throw new Error("useObservation must be used within ObservationProvider");
  return ctx;
};

export const ObservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("22:00");
  const [location, setLocationState] = useState<ObservationLocation>(
    loadStoredLocation() ?? defaultLocation
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const setLocation = (loc: ObservationLocation) => {
    setLocationState(loc);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(loc)); } catch {}
  };

  // Auto-detect on first visit (no stored location)
  useEffect(() => {
    if (loadStoredLocation()) return; // already have a saved location
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
      date, setDate, time, setTime, location, setLocation, isDetectingLocation
    }}>
      {children}
    </ObservationContext.Provider>
  );
};
