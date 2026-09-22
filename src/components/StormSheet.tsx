import { useQuery } from "@tanstack/react-query";
import { X, Wind, Gauge, Navigation, CalendarDays, Star, Thermometer, MapPin } from "lucide-react";
import {
  approachToPoint,
  compass,
  coordLabel,
  formatDate,
  formatDateTime,
  ktToKph,
  ktToMs,
  phaseLabel,
  type Storm,
} from "@/lib/storm-utils";
import { bandFor } from "@/lib/storm-severity";
import { getLocalConditions } from "@/lib/storms.functions";
import { BandBadge, SeverityScale } from "./SeverityBand";

export function StormSheet({
  storm,
  me,
  tracked,
  onTrack,
  onClose,
}: {
  storm: Storm;
  me: { lat: number; lon: number } | null;
  tracked: boolean;
  onTrack: (id: string) => void;
  onClose: () => void;
}) {
  const approach = me ? approachToPoint(storm, me) : null;
  const band = bandFor(storm);

  const conditions = useQuery({
    queryKey: ["storm-conditions", storm.id, storm.lat, storm.lon],
    queryFn: () => getLocalConditions({ data: { lat: storm.lat, lon: storm.lon } }),
    enabled: storm.active,
    staleTime: 10 * 60 * 1000,
  });

  const stats = [
    { icon: Wind, label: "Wind", value: `${ktToMs(storm.windKt)} m/s` },
    { icon: Gauge, label: "Pressure", value: storm.pressure ? `${storm.pressure} hPa` : "—" },
    {
      icon: Navigation,
      label: "Moving",
      value: storm.movement.speedKt
        ? `${compass(storm.movement.dirDeg)} ${ktToKph(storm.movement.speedKt)} km/h`
        : compass(storm.movement.dirDeg),
    },
    { icon: Wind, label: "Peak wind", value: `${ktToMs(storm.peakWindKt)} m/s` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-sky-deep/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border-t border-border bg-card p-6 pb-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-secondary" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <BandBadge band={band} />
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
                {phaseLabel(storm.phase)}
              </span>
            </div>
            <h2 className="mt-1.5 text-3xl font-semibold tracking-tight">{storm.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {storm.category} · {storm.basinName}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close storm details"
            className="rounded-full bg-secondary p-2 text-secondary-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4">
          <SeverityScale storm={storm} />
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          {storm.phase === "upcoming"
            ? `Expected ${formatDateTime(storm.startedAt)}`
            : storm.phase === "active"
              ? `Ongoing since ${formatDateTime(storm.startedAt)}`
              : `${formatDate(storm.startedAt)} – ${formatDate(storm.updatedAt)}`}
        </div>
        <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" />
          {storm.affectedAreas} · {coordLabel(storm.lat, storm.lon)}
        </p>
        {storm.sourceLabel ? (
          <p className="mt-1 text-[11px] text-muted-foreground">Source: {storm.sourceLabel}</p>
        ) : (
          <p className="mt-1 text-[11px] text-muted-foreground">Simulation</p>
        )}

        {approach && (
          <div className="bg-storm-gradient mt-4 rounded-2xl p-4 text-primary-foreground">
            <p className="text-xs uppercase tracking-widest opacity-75">Relative to your area</p>
            <p className="mt-1 text-2xl font-bold">{approach.distanceKm.toLocaleString()} km away</p>
            {storm.forecast.length > 0 && (
              <p className="mt-1 text-sm opacity-85">
                Closest forecast approach {approach.closestKm.toLocaleString()} km
                {approach.closestAt ? ` on ${formatDateTime(approach.closestAt)}` : ""}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          {stats.map(({ icon: Icon, label, value }, i) => (
            <div key={`${label}-${i}`} className="glass-card rounded-2xl p-3">
              <Icon className="size-4 text-primary" />
              <p className="mt-2 text-lg font-semibold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {storm.active && (
          <>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Conditions at the storm
            </h3>
            <div className="glass-card mt-3 flex items-center justify-between rounded-2xl p-4">
              {conditions.isLoading ? (
                <p className="text-sm text-muted-foreground">Checking conditions…</p>
              ) : conditions.data && !conditions.data.error ? (
                <>
                  <div>
                    <p className="text-sm font-medium">
                      {conditions.data.description ?? "Current conditions"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {conditions.data.place ?? coordLabel(storm.lat, storm.lon)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="flex items-center gap-1 text-xl font-semibold">
                      <Thermometer className="size-4 text-primary" />
                      {conditions.data.temperatureC !== null
                        ? `${Math.round(conditions.data.temperatureC)}°`
                        : "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      gusts{" "}
                      {conditions.data.gustKph !== null
                        ? `${Math.round(conditions.data.gustKph)} km/h`
                        : "—"}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Live conditions for this position are unavailable.
                </p>
              )}
            </div>
          </>
        )}

        {storm.advisory && (
          <>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Latest advisory
            </h3>
            <div className="glass-card mt-3 rounded-2xl p-4">
              {storm.advisory.headline && (
                <p className="text-sm font-semibold">{storm.advisory.headline}</p>
              )}
              {storm.advisory.summary && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {storm.advisory.summary}
                </p>
              )}
              {storm.advisory.issuedAt && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Issued {formatDateTime(storm.advisory.issuedAt)} by the National Hurricane Center
                </p>
              )}
              <a
                href={storm.advisory.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
              >
                <FileText className="size-3.5" />
                Read the full advisory
              </a>
            </div>
          </>
        )}

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Path so far
        </h3>
        <ol className="mt-3 space-y-2">
          {storm.track
            .slice(-8)
            .reverse()
            .map((p) => (
              <li key={p.time} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{formatDateTime(p.time)}</span>
                <span className="font-medium">
                  {coordLabel(p.lat, p.lon)} · {ktToKph(p.windKt)} km/h
                </span>
              </li>
            ))}
        </ol>

        {storm.active && (
          <button
            onClick={() => onTrack(storm.id)}
            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold ${
              tracked ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            <Star className={`size-4 ${tracked ? "fill-current" : ""}`} />
            {tracked ? "Tracking this storm" : "Track & alert me"}
          </button>
        )}
      </div>
    </div>
  );
}
