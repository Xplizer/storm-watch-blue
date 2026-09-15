import type { Storm } from "./storm-utils";

export type BandKey = "post" | "depression" | "storm" | "hurricane" | "major";

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
  post: {
    key: "post",
    label: "Post-tropical",
    short: "Post-trop.",
    cssVar: "var(--band-post)",
    hex: "#8fa3bd",
    description: "Weakening or no longer tropical",
  },
  depression: {
    key: "depression",
    label: "Tropical depression",
    short: "Depression",
    cssVar: "var(--band-depression)",
    hex: "#7fd3f7",
    description: "Under 63 km/h winds",
  },
  storm: {
    key: "storm",
    label: "Tropical storm",
    short: "Trop. storm",
    cssVar: "var(--band-storm)",
    hex: "#3b8ee6",
    description: "63–117 km/h winds",
  },
  hurricane: {
    key: "hurricane",
    label: "Hurricane",
    short: "Hurricane",
    cssVar: "var(--band-hurricane)",
    hex: "#f0b03c",
    description: "Category 1–2 · 118–177 km/h",
  },
  major: {
    key: "major",
    label: "Major hurricane",
    short: "Major",
    cssVar: "var(--band-major)",
    hex: "#e8483f",
    description: "Category 3+ · over 177 km/h",
  },
};

export const BAND_ORDER: BandKey[] = ["depression", "storm", "hurricane", "major", "post"];

export function bandFor(storm: Pick<Storm, "windKt" | "status">): Band {
  const { windKt, status } = storm;
  if (windKt >= 96) return BANDS.major;
  if (windKt >= 64) return BANDS.hurricane;
  if (status === "EX" || status === "PT" || status === "LO") return BANDS.post;
  if (windKt >= 34) return BANDS.storm;
  return BANDS.depression;
}
