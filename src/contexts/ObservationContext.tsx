import React, { createContext, useContext, useState } from "react";

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
}

const defaultLocation: ObservationLocation = {
  name: "Brullioles, FR",
  lat: 45.7333,
  lng: 4.4833,
  timezone: "Europe/Paris",
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
  const [location, setLocation] = useState<ObservationLocation>(defaultLocation);

  return (
    <ObservationContext.Provider value={{ date, setDate, time, setTime, location, setLocation }}>
      {children}
    </ObservationContext.Provider>
  );
};
