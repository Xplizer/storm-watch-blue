import type { Storm } from "./storm-utils";

export type BandKey = "strong" | "gale" | "storm" | "violent" | "hurricane";

export type Band = {
  key: BandKey;
  label: string;
  short: string;
  /** CSS variable holding the band colour (defined in styles.css). */
  cssVar: string;
  /** Hex equivalent, for the Google Maps overlays which cannot read CSS vars. */
  hex: string;
  description: string;
};

export const BANDS: Record<BandKey, Band> = {
  strong: {
    key: "strong",
    label: "Strong wind",
    short: "Strong wind",
    cssVar: "var(--band-post)",
    hex: "#8fa3bd",
    description: "Under 17 m/s",
  },
  gale: {
    key: "gale",
    label: "Gale",
    short: "Gale",
    cssVar: "var(--band-depression)",
    hex: "#7fd3f7",
    description: "17.2–24.4 m/s",
  },
  storm: {
    key: "storm",
    label: "Storm",
    short: "Storm",
    cssVar: "var(--band-storm)",
    hex: "#3b8ee6",
    description: "24.5–28.4 m/s",
  },
  violent: {
    key: "violent",
    label: "Violent storm",
    short: "Violent",
    cssVar: "var(--band-hurricane)",
    hex: "#f0b03c",
    description: "28.5–32.6 m/s",
  },
  hurricane: {
    key: "hurricane",
    label: "Hurricane force",
    short: "Hurricane force",
    cssVar: "var(--band-major)",
    hex: "#e8483f",
    description: "32.7 m/s and above",
  },
};

export const BAND_ORDER: BandKey[] = ["strong", "gale", "storm", "violent", "hurricane"];

export function bandFor(storm: Pick<Storm, "windKt">): Band {
  const ms = storm.windKt * 0.514444;
  if (ms >= 32.7) return BANDS.hurricane;
  if (ms >= 28.5) return BANDS.violent;
  if (ms >= 24.5) return BANDS.storm;
  if (ms >= 17.2) return BANDS.gale;
  return BANDS.strong;
}
