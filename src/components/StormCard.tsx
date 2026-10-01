import { MapPin, Clock, Star } from "lucide-react";
import {
  approachToPoint,
  formatDate,
  formatDateTime,
  ktToMs,
  phaseLabel,
  type Storm,
} from "@/lib/storm-utils";
import { bandFor } from "@/lib/storm-severity";
import { BandBadge, SeverityScale } from "./SeverityBand";

export function StormCard({
  storm,
  me,
  tracked,
  onOpen,
  onTrack,
}: {
  storm: Storm;
  me: { lat: number; lon: number } | null;
  tracked: boolean;
  onOpen: (storm: Storm) => void;
  onTrack: (id: string) => void;
}) {
  const approach = me ? approachToPoint(storm, me) : null;
  const band = bandFor(storm);

  return (
    <div className="glass-card shadow-lift relative overflow-hidden rounded-3xl p-4">
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: band.cssVar }}
        aria-hidden
      />
      <button onClick={() => onOpen(storm)} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <BandBadge band={band} />
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                {phaseLabel(storm.phase)}
              </span>
            </div>
            <h3 className="mt-1.5 text-2xl font-semibold tracking-tight">{storm.name}</h3>
            <p className="text-xs text-muted-foreground">{storm.category}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-bold leading-none" style={{ color: band.cssVar }}>
              {ktToMs(storm.windKt)}
            </span>
            <span className="text-[11px] text-muted-foreground">m/s vind</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {storm.basinName}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Berørte områder: {storm.affectedAreas}</p>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <SeverityScale storm={storm} />
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-foreground/80">
            {storm.phase === "passed" ? (
              formatDate(storm.updatedAt)
            ) : (
              <>
                <Clock className="size-3.5 text-primary" />
                {approach
                  ? `${approach.distanceKm.toLocaleString("da-DK")} km væk`
                  : formatDateTime(storm.phase === "upcoming" ? storm.startedAt : storm.updatedAt)}
              </>
            )}
          </span>
        </div>
      </button>

      {storm.active && (
        <button
          onClick={() => onTrack(storm.id)}
          className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-colors ${
            tracked ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          <Star className={`size-3.5 ${tracked ? "fill-current" : ""}`} />
          {tracked ? "Følges — advarsler er slået til" : "Følg og advar mig"}
        </button>
      )}
    </div>
  );
}
