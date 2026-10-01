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
  water: { peakCm: number; places: string; floodRisk: FloodRisk } | null;
};

export type StormAdvisory = {
  url: string;
  issuedAt: string | null;
  headline: string | null;
  summary: string | null;
};

export const BASIN_NAMES: Record<string, string> = {
  AL: "Atlanterhavet",
  EP: "Det østlige Stillehav",
  CP: "Det centrale Stillehav",
};

export function ktToKph(kt: number) {
  return Math.round(kt * 1.852);
}

export function ktToMs(kt: number) {
  return Math.round(kt * 0.514444);
}

export function phaseLabel(phase: Storm["phase"]) {
  if (phase === "upcoming") return "På vej";
  if (phase === "active") return "Aktiv";
  return "Overstået";
}

export function classify(status: string, windKt: number): string {
  const ms = windKt * 0.514444;
  if (status === "ENDED") return "Overstået storm";
  if (ms >= 32.7) return "Orkan";
  if (ms >= 28.5) return "Stærk storm";
  if (ms >= 24.5) return "Storm";
  if (ms >= 17.2) return "Hård kuling";
  return "Kraftig vind";
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
  return new Date(iso).toLocaleDateString("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("da-DK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function coordLabel(lat: number, lon: number) {
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? "Ø" : "V"}`;
}

export function compass(deg: number | null) {
  if (deg === null) return "—";
  const dirs = ["N", "NNØ", "NØ", "ØNØ", "Ø", "ØSØ", "SØ", "SSØ", "S", "SSV", "SV", "VSV", "V", "VNV", "NV", "NNV"];
  return dirs[Math.round(deg / 22.5) % 16]!;
}

export type FloodRisk = "low" | "moderate" | "high" | "severe";

export const FLOOD_LABEL: Record<FloodRisk, string> = {
  low: "Lav risiko for oversvømmelse",
  moderate: "Moderat risiko for oversvømmelse",
  high: "Høj risiko for oversvømmelse",
  severe: "Meget høj risiko for oversvømmelse",
};

/** All timed points of a storm (track then forecast). */
export function timeline(storm: Storm) {
  return [
    ...storm.track.map((p) => ({ t: Date.parse(p.time), lat: p.lat, lon: p.lon })),
    ...storm.forecast.map((p) => ({ t: Date.parse(p.time), lat: p.lat, lon: p.lon })),
  ].sort((a, b) => a.t - b.t);
}

/** Interpolated position at time t, or null when the storm isn't present then. */
export function positionAt(storm: Storm, t: number): { lat: number; lon: number } | null {
  const pts = timeline(storm);
  if (pts.length === 0) return null;
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  if (t < first.t - 3600_000 || t > last.t + 3600_000) return null;
  if (t <= first.t) return first;
  if (t >= last.t) return last;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    if (t <= b.t) {
      const f = (t - a.t) / (b.t - a.t || 1);
      return { lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f };
    }
  }
  return last;
}
