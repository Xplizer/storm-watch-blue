import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { approachToPoint, type Storm } from "@/lib/storm-utils";
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
      toast.info("Open the app in its own tab to enable notifications.");
      return "blocked" as const;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "denied") {
      toast.error("Notifications are blocked. Enable them in your browser site settings.");
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
          title: `${storm.name} is ${inside ? "within" : "forecast within"} ${ring} km`,
          body: inside
            ? `${storm.category} · ${storm.windKph} km/h · ${distanceKm} km from your area.`
            : `Closest approach ${closestKm} km${closestAt ? ` around ${new Date(closestAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}.`,
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
