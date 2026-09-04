import { X, Wind, Gauge, Navigation, CalendarDays, Star } from "lucide-react";
import {
  approachToPoint,
  compass,
  coordLabel,
  formatDate,
  formatDateTime,
  ktToKph,
  severity,
  type Storm,
} from "@/lib/storm-utils";
import { SeverityBar } from "./StormCard";

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
  const stats = [
    { icon: Wind, label: "Current winds", value: `${storm.windKph} km/h` },
    { icon: Gauge, label: "Pressure", value: storm.pressure ? `${storm.pressure} hPa` : "—" },
    {
      icon: Navigation,
      label: "Moving",
      value: storm.movement.speedKt
        ? `${compass(storm.movement.dirDeg)} ${ktToKph(storm.movement.speedKt)} km/h`
        : "—",
    },
    { icon: Wind, label: "Peak winds", value: `${ktToKph(storm.peakWindKt)} km/h` },
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
            <p className="text-xs uppercase tracking-widest text-primary">
              {storm.active ? "Active" : "Ended"} · {storm.basinName}
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">{storm.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{storm.category}</p>
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
          <SeverityBar level={severity(storm.windKt)} />
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          {formatDate(storm.startedAt)} – {formatDate(storm.updatedAt)}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Last position {coordLabel(storm.lat, storm.lon)} · updated{" "}
          {formatDateTime(storm.updatedAt)}
        </p>

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
