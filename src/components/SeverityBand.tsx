import { BANDS, BAND_ORDER, bandFor, type Band } from "@/lib/storm-severity";
import type { Storm } from "@/lib/storm-utils";

export function BandBadge({ band, className = "" }: { band: Band; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${className}`}
      style={{ backgroundColor: `color-mix(in oklab, ${band.cssVar} 22%, transparent)`, color: band.cssVar }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: band.cssVar }} />
      {band.label}
    </span>
  );
}

/** Colour band showing where this storm sits on the severity scale. */
export function SeverityScale({ storm }: { storm: Storm }) {
  const current = bandFor(storm);
  return (
    <div className="flex gap-1">
      {BAND_ORDER.map((key) => {
        const b = BANDS[key];
        const on = BAND_ORDER.indexOf(current.key) >= BAND_ORDER.indexOf(key);
        return (
          <span
            key={key}
            title={`${b.label} — ${b.description}`}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: on ? b.cssVar : "var(--secondary)" }}
          />
        );
      })}
    </div>
  );
}

export function BandLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {BAND_ORDER.map((key) => {
        const b = BANDS[key];
        return (
          <span key={key} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: b.cssVar }} />
            {b.short}
          </span>
        );
      })}
    </div>
  );
}
