export type TrackPoint = {
  time: string; // ISO
  lat: number;
  lon: number;
  windKt: number;
  pressure: number | null;
  status: string; // ATCF status code
};

export type ForecastPoint = {
  time: string;
  lat: number;
  lon: number;
};

export type Storm = {
  id: string; // e.g. al052026
  name: string;
  basin: string; // AL / EP / CP
  basinName: string;
  active: boolean;
  status: string;
  category: string; // human label
  windKt: number;
  windKph: number;
  pressure: number | null;
  lat: number;
  lon: number;
  startedAt: string;
  updatedAt: string;
  track: TrackPoint[];
  forecast: ForecastPoint[];
  peakWindKt: number;
  movement: { dirDeg: number | null; speedKt: number | null };
  advisory: StormAdvisory | null;
};

export type StormAdvisory = {
  url: string;
  issuedAt: string | null;
  headline: string | null;
  summary: string | null;
};

export const BASIN_NAMES: Record<string, string> = {
  AL: "Atlantic",
  EP: "Eastern Pacific",
  CP: "Central Pacific",
};

export function ktToKph(kt: number) {
  return Math.round(kt * 1.852);
}

export function classify(status: string, windKt: number): string {
  if (status === "HU" || windKt >= 64) {
    if (windKt >= 137) return "Category 5 Hurricane";
    if (windKt >= 113) return "Category 4 Hurricane";
    if (windKt >= 96) return "Category 3 Hurricane";
    if (windKt >= 83) return "Category 2 Hurricane";
    return "Category 1 Hurricane";
  }
  if (status === "TS" || windKt >= 34) return "Tropical Storm";
  if (status === "TD") return "Tropical Depression";
  if (status === "EX") return "Post-Tropical Cyclone";
  if (status === "SD" || status === "SS") return "Subtropical Cyclone";
  if (status === "PT") return "Post-Tropical Remnant";
  return "Tropical Disturbance";
}

/** 1-5 visual severity from sustained wind (knots). */
export function severity(windKt: number): number {
  if (windKt >= 113) return 5;
  if (windKt >= 83) return 4;
  if (windKt >= 64) return 3;
  if (windKt >= 34) return 2;
  return 1;
}

export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export type Approach = {
  distanceKm: number;
  closestKm: number;
  closestAt: string | null;
  approaching: boolean;
};

/** Distance now, plus the closest point along the forecast track. */
export function approachToPoint(storm: Storm, me: { lat: number; lon: number }): Approach {
  const distanceKm = haversineKm({ lat: storm.lat, lon: storm.lon }, me);
  let closestKm = distanceKm;
  let closestAt: string | null = null;
  for (const p of storm.forecast) {
    const d = haversineKm(p, me);
    if (d < closestKm) {
      closestKm = d;
      closestAt = p.time;
    }
  }
  return { distanceKm, closestKm, closestAt, approaching: closestKm < distanceKm - 20 };
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function coordLabel(lat: number, lon: number) {
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? "E" : "W"}`;
}

export function compass(deg: number | null) {
  if (deg === null) return "—";
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16]!;
}
