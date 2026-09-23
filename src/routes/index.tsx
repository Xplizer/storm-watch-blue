import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  CloudLightning,
  Crosshair,
  Loader2,
  RefreshCw,
  Bell,
  BellRing,
  AlertTriangle,
  Map as MapIcon,
} from "lucide-react";
import { stormsQueryOptions } from "@/lib/storm-queries";
import { getLocalConditions } from "@/lib/storms.functions";
import { approachToPoint, formatDateTime, type Storm } from "@/lib/storm-utils";
import { StormCard } from "@/components/StormCard";
import { StormSheet } from "@/components/StormSheet";
import { BottomNav } from "@/components/BottomNav";
import { useMyLocation } from "@/hooks/useMyLocation";
import { useTrackedStorms } from "@/hooks/useTrackedStorms";
import { useStormAlerts } from "@/hooks/useStormAlerts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StormWatch Denmark — Storm Tracker (School Demo)" },
      {
        name: "description",
        content:
          "Follow upcoming, active and passed storms around Denmark — from Lillebælt and Esbjerg to Aarhus, Aalborg, Odense and Copenhagen. A school-project demo with simulated storms.",
      },
      { property: "og:title", content: "StormWatch Denmark — Storm Tracker" },
      {
        property: "og:description",
        content:
          "Storm positions, paths and affected areas around Denmark, with proximity alerts for your own area.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { data, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery(stormsQueryOptions);
  const { location, status, locate } = useMyLocation();
  const { tracked, toggle } = useTrackedStorms();
  const [tab, setTab] = useState<"incoming" | "past">("incoming");
  const [sheet, setSheet] = useState<Storm | null>(null);

  const storms = data?.storms ?? [];
  const { alerts, permission, requestPermission } = useStormAlerts(storms, location, tracked);

  const local = useQuery({
    queryKey: ["local-conditions", location?.lat, location?.lon],
    queryFn: () => getLocalConditions({ data: location! }),
    enabled: !!location,
    staleTime: 10 * 60 * 1000,
  });

  const incoming = useMemo(
    () =>
      storms
        .filter((s) => s.phase !== "passed")
        .sort((a, b) => {
          if (a.phase !== b.phase) return a.phase === "active" ? -1 : 1;
          if (!location) return b.windKt - a.windKt;
          return approachToPoint(a, location).closestKm - approachToPoint(b, location).closestKm;
        }),
    [storms, location],
  );
  const past = useMemo(
    () =>
      storms
        .filter((s) => s.phase === "passed")
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [storms],
  );

  const list = tab === "incoming" ? incoming : past;
  const nearest = location && incoming.length > 0 ? incoming[0]! : null;
  const nearestApproach = nearest && location ? approachToPoint(nearest, location) : null;

  return (
    <main className="bg-sky-gradient min-h-screen text-foreground">
      <div className="mx-auto max-w-md px-5 pb-32 pt-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="absolute inset-0 animate-storm-pulse rounded-full bg-primary/40" />
              <CloudLightning className="relative size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">StormWatch</h1>
              <p className="text-[11px] text-muted-foreground">
                {isFetching ? "Updating…" : `Live · updated ${formatDateTime(new Date(dataUpdatedAt || Date.now()).toISOString())}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              aria-label="Refresh storm data"
              className="rounded-full bg-secondary p-2.5 text-secondary-foreground"
            >
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={locate}
              aria-label="Use my location"
              className="rounded-full bg-secondary p-2.5 text-secondary-foreground"
            >
              {status === "locating" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Crosshair className="size-4" />
              )}
            </button>
          </div>
        </header>

        {data?.error && (
          <p className="mt-4 rounded-2xl bg-destructive/15 p-3 text-center text-sm text-destructive-foreground">
            {data.error}
          </p>
        )}

        {!location && (
          <button
            onClick={locate}
            className="glass-card mt-5 flex w-full items-center gap-3 rounded-3xl p-4 text-left"
          >
            <Crosshair className="size-5 shrink-0 text-primary" />
            <span className="text-sm">
              <span className="font-semibold">Set your area</span>
              <span className="block text-muted-foreground">
                See how far each storm is and get alerts when one closes in.
              </span>
            </span>
          </button>
        )}

        {status === "denied" && !location && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Location access was blocked — enable it in your browser settings to get proximity alerts.
          </p>
        )}

        {nearest && nearestApproach && (
          <section className="bg-storm-gradient shadow-lift mt-5 rounded-[1.75rem] p-5 text-primary-foreground">
            <p className="text-xs uppercase tracking-widest opacity-75">Closest to you</p>
            <div className="mt-1 flex items-end justify-between">
              <h2 className="text-4xl font-bold tracking-tight">{nearest.name}</h2>
              <span className="text-sm font-medium opacity-85">
                {nearestApproach.distanceKm.toLocaleString()} km
              </span>
            </div>
            <p className="mt-1 text-sm opacity-85">{nearest.category}</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div>
                <p className="text-xl font-semibold">{nearest.windKph}</p>
                <p className="text-[11px] opacity-70">km/h winds</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{nearest.pressure ?? "—"}</p>
                <p className="text-[11px] opacity-70">hPa</p>
              </div>
              <div>
                <p className="text-xl font-semibold">
                  {nearestApproach.closestKm.toLocaleString()}
                </p>
                <p className="text-[11px] opacity-70">km closest</p>
              </div>
            </div>
          </section>
        )}

        {local.data && !local.data.error && (
          <div className="glass-card mt-4 flex items-center justify-between rounded-2xl p-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {local.data.place ?? "Your area"}
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {local.data.description ?? "Current conditions"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold">
                {local.data.temperatureC !== null ? `${Math.round(local.data.temperatureC)}°` : "—"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                wind {local.data.windKph !== null ? `${Math.round(local.data.windKph)} km/h` : "—"}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => requestPermission()}
          className="glass-card mt-4 flex w-full items-center gap-3 rounded-2xl p-4 text-left"
        >
          {permission === "granted" ? (
            <BellRing className="size-5 shrink-0 text-primary" />
          ) : (
            <Bell className="size-5 shrink-0 text-primary" />
          )}
          <span className="text-sm">
            <span className="font-semibold">
              {permission === "granted" ? "Alerts are on" : "Turn on storm alerts"}
            </span>
            <span className="block text-muted-foreground">
              {permission === "granted"
                ? `${tracked.length} storm${tracked.length === 1 ? "" : "s"} tracked · alerts at 1500, 800, 400 and 150 km`
                : "Get notified when a tracked storm closes in on your area."}
            </span>
          </span>
        </button>

        {alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-2 rounded-2xl bg-destructive/15 p-3 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-semibold">{alert.title}</p>
                  <p className="text-muted-foreground">{alert.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="glass-card mt-6 grid grid-cols-2 gap-1 rounded-full p-1">
          {(["incoming", "past"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full py-2 text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t === "incoming" ? `Incoming (${incoming.length})` : `Past (${past.length})`}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {isLoading && (
            <p className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Loading live storms from NOAA…
            </p>
          )}
          {!isLoading && list.length === 0 && (
            <p className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
              {tab === "incoming"
                ? "No named storms are active right now."
                : "No storms recorded for this season yet."}
            </p>
          )}
          {list.map((storm) => (
            <StormCard
              key={storm.id}
              storm={storm}
              me={location}
              tracked={tracked.includes(storm.id)}
              onOpen={setSheet}
              onTrack={toggle}
            />
          ))}
        </div>

        <Link
          to="/map"
          className="mt-6 flex items-center justify-center gap-2 rounded-full bg-secondary py-3 text-sm font-semibold text-secondary-foreground"
        >
          <MapIcon className="size-4" />
          Open the storm map
        </Link>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Source: NOAA National Hurricane Center best-track and advisory data.
        </p>
      </div>

      {sheet && (
        <StormSheet
          storm={sheet}
          me={location}
          tracked={tracked.includes(sheet.id)}
          onTrack={toggle}
          onClose={() => setSheet(null)}
        />
      )}
      <BottomNav />
    </main>
  );
}
