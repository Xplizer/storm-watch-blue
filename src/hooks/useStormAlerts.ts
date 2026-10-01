import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { approachToPoint, ktToMs, type Storm } from "@/lib/storm-utils";
import type { MyLocation } from "./useMyLocation";

const FIRED_KEY = "stormwatch:alerts-fired";

/** Distance rings (km) that trigger an alert as a storm closes in. */
const RINGS = [1500, 800, 400, 150];

export type StormAlert = {
  id: string;
  stormId: string;
  title: string;
  body: string;
  at: string;
};

function loadFired(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function useStormAlerts(
  storms: Storm[],
  location: MyLocation | null,
  tracked: string[],
) {
  const [alerts, setAlerts] = useState<StormAlert[]>([]);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const firedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    firedRef.current = new Set(loadFired());
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported" as const;
    if (window.top !== window.self) {
      toast.info("Åbn appen i sin egen fane for at slå notifikationer til.");
      return "blocked" as const;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "denied") {
      toast.error("Notifikationer er blokeret. Slå dem til i browserens indstillinger for siden.");
    }
    return result;
  }, []);

  useEffect(() => {
    if (!location || storms.length === 0) return;
    const fresh: StormAlert[] = [];

    for (const storm of storms) {
      if (!storm.active || !tracked.includes(storm.id)) continue;
      const { distanceKm, closestKm, closestAt } = approachToPoint(storm, location);

      for (const ring of RINGS) {
        if (Math.min(distanceKm, closestKm) > ring) continue;
        const key = `${storm.id}:${ring}`;
        if (firedRef.current.has(key)) continue;
        firedRef.current.add(key);
        const inside = distanceKm <= ring;
        fresh.push({
          id: key,
          stormId: storm.id,
          title: `${storm.name} er ${inside ? "inden for" : "forventet inden for"} ${ring} km`,
          body:
            (inside
              ? `${storm.category} · ${ktToMs(storm.windKt)} m/s · ${distanceKm} km fra dit område.`
              : `Tætteste passage ${closestKm} km${closestAt ? ` omkring ${new Date(closestAt).toLocaleString("da-DK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}.`) +
            (storm.simulated ? " Simulation." : ""),
          at: new Date().toISOString(),
        });
        break;
      }
    }

    if (fresh.length === 0) return;
    localStorage.setItem(FIRED_KEY, JSON.stringify([...firedRef.current]));
    setAlerts((prev) => [...fresh, ...prev].slice(0, 20));

    for (const alert of fresh) {
      toast.warning(alert.title, { description: alert.body });
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(alert.title, { body: alert.body, tag: alert.id });
        } catch {
          /* notification display is best effort */
        }
      }
    }
  }, [storms, location, tracked]);

  return { alerts, permission, requestPermission };
}
