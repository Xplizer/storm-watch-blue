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
  id: string;
  name: string;
  basin: string;
  basinName: string;
  active: boolean;
  phase: "upcoming" | "active" | "passed";
  status: string;
  category: string;
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
  affectedAreas: string;
  affectedRadiusKm: number;
  simulated: boolean;
  sourceLabel: string | null;
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

export function ktToMs(kt: number) {
  return Math.round(kt * 0.514444);
}

export function phaseLabel(phase: Storm["phase"]) {
  if (phase === "upcoming") return "Upcoming";
  if (phase === "active") return "Active";
  return "Passed";
}

export function classify(status: string, windKt: number): string {
  const ms = windKt * 0.514444;
  if (status === "ENDED") return "Passed storm";
  if (ms >= 32.7) return "Hurricane-force storm";
  if (ms >= 28.5) return "Violent storm";
  if (ms >= 24.5) return "Storm";
  if (ms >= 17.2) return "Gale";
  return "Strong wind";
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
