import { useCallback, useEffect, useState } from "react";

export type MyLocation = { lat: number; lon: number };

const KEY = "stormwatch:location";

export function useMyLocation() {
  const [location, setLocation] = useState<MyLocation | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "denied">("idle");

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        setLocation(JSON.parse(raw) as MyLocation);
        setStatus("ready");
      } catch {
        localStorage.removeItem(KEY);
      }
    }
  }, []);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("denied");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = {
          lat: Number(pos.coords.latitude.toFixed(4)),
          lon: Number(pos.coords.longitude.toFixed(4)),
        };
        localStorage.setItem(KEY, JSON.stringify(next));
        setLocation(next);
        setStatus("ready");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    );
  }, []);

  return { location, status, locate };
}
