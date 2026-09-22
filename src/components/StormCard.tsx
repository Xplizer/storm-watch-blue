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
            <BandBadge band={band} />
            <h3 className="mt-1.5 text-2xl font-semibold tracking-tight">{storm.name}</h3>
            <p className="text-xs text-muted-foreground">{storm.category}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-bold leading-none" style={{ color: band.cssVar }}>
              {storm.windKph}
            </span>
            <span className="text-[11px] text-muted-foreground">km/h winds</span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          {storm.basinName} · {Math.abs(storm.lat).toFixed(1)}°{storm.lat >= 0 ? "N" : "S"}{" "}
          {Math.abs(storm.lon).toFixed(1)}°{storm.lon >= 0 ? "E" : "W"}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1">
            <SeverityScale storm={storm} />
          </div>
          <span className="flex items-center gap-1 text-xs font-medium text-foreground/80">
            {storm.active ? (
              <>
                <Clock className="size-3.5 text-primary" />
                {approach ? `${approach.distanceKm.toLocaleString()} km away` : "Live"}
              </>
            ) : (
              formatDate(storm.updatedAt)
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
          {tracked ? "Tracking — alerts on" : "Track & alert me"}
        </button>
      )}
    </div>
  );
}
