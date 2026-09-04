import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CloudLightning, Gauge, MapPin, Wind, Droplets, Clock, X } from "lucide-react";
import { storms, type Storm } from "@/data/storms";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StormWatch — Live Storm Tracker for iPhone" },
      {
        name: "description",
        content:
          "Track incoming storms in real time, see wind speed, pressure and ETA, and browse the history of storms that already passed.",
      },
      { property: "og:title", content: "StormWatch — Live Storm Tracker" },
      {
        property: "og:description",
        content: "Follow incoming storms and review past storms on a clean, storm-blue mobile dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const severityLabel = ["", "Minor", "Moderate", "Strong", "Severe", "Extreme"];

function SeverityBar({ level }: { level: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-5 rounded-full ${i <= level ? "bg-storm-gradient" : "bg-secondary"}`}
        />
      ))}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StormCard({ storm, onOpen }: { storm: Storm; onOpen: (s: Storm) => void }) {
  const incoming = storm.status === "incoming";
  return (
    <button
      onClick={() => onOpen(storm)}
      className="glass-card shadow-lift w-full rounded-3xl p-4 text-left transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{storm.category}</p>
          <h3 className="mt-0.5 text-2xl font-semibold tracking-tight">{storm.name}</h3>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-3xl font-bold leading-none text-primary">{storm.windKph}</span>
          <span className="text-[11px] text-muted-foreground">km/h gusts</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <MapPin className="size-3.5" />
        {storm.region}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <SeverityBar level={storm.severity} />
        <span className="text-xs font-medium text-foreground/80">
          {incoming ? (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5 text-primary" />
              in {storm.etaHours}h
            </span>
          ) : (
            formatDate(storm.date)
          )}
        </span>
      </div>
    </button>
  );
}

function StormSheet({ storm, onClose }: { storm: Storm; onClose: () => void }) {
  const stats = [
    { icon: Wind, label: "Wind gusts", value: `${storm.windKph} km/h` },
    { icon: Gauge, label: "Pressure", value: `${storm.pressure} hPa` },
    { icon: Droplets, label: "Rainfall", value: `${storm.rainMm} mm` },
    {
      icon: storm.status === "incoming" ? Clock : CloudLightning,
      label: storm.status === "incoming" ? "Distance" : "Occurred",
      value: storm.status === "incoming" ? `${storm.distanceKm} km` : formatDate(storm.date),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-sky-deep/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-[2rem] border-t border-border bg-card p-6 pb-10">
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-secondary" />
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">
              {severityLabel[storm.severity]} · {storm.category}
            </p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">{storm.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{storm.region}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close storm details"
            className="rounded-full bg-secondary p-2 text-secondary-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-foreground/85">{storm.summary}</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="glass-card rounded-2xl p-3">
              <Icon className="size-4 text-primary" />
              <p className="mt-2 text-lg font-semibold">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Index() {
  const [tab, setTab] = useState<"incoming" | "past">("incoming");
  const [selected, setSelected] = useState<Storm | null>(null);

  const list = useMemo(() => storms.filter((s) => s.status === tab), [tab]);
  const next = storms.filter((s) => s.status === "incoming").sort((a, b) => a.etaHours - b.etaHours)[0];

  return (
    <main className="bg-sky-gradient min-h-screen text-foreground">
      <div className="mx-auto max-w-md px-5 pb-16 pt-12">
        <header className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute inset-0 animate-storm-pulse rounded-full bg-primary/40" />
            <CloudLightning className="relative size-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">StormWatch</h1>
        </header>

        {next && (
          <section className="bg-storm-gradient shadow-lift mt-6 rounded-[1.75rem] p-5">
            <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Next storm</p>
            <div className="mt-1 flex items-end justify-between">
              <h2 className="text-4xl font-bold tracking-tight text-primary-foreground">{next.name}</h2>
              <span className="text-sm font-medium text-primary-foreground/80">ETA {next.etaHours}h</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-primary-foreground">
              <div>
                <p className="text-xl font-semibold">{next.windKph}</p>
                <p className="text-[11px] opacity-70">km/h</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{next.pressure}</p>
                <p className="text-[11px] opacity-70">hPa</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{next.distanceKm}</p>
                <p className="text-[11px] opacity-70">km away</p>
              </div>
            </div>
          </section>
        )}

        <div className="glass-card mt-6 grid grid-cols-2 gap-1 rounded-full p-1">
          {(["incoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "incoming" ? "Incoming" : "Past storms"}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {list.map((s) => (
            <StormCard key={s.id} storm={s} onOpen={setSelected} />
          ))}
        </div>
      </div>

      {selected && <StormSheet storm={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}
