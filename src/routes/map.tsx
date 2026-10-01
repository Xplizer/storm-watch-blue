import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Crosshair, Loader2, Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { stormsQueryOptions } from "@/lib/storm-queries";
import { StormMap } from "@/components/StormMap";
import { StormSheet } from "@/components/StormSheet";
import { BottomNav } from "@/components/BottomNav";
import { useMyLocation } from "@/hooks/useMyLocation";
import { useTrackedStorms } from "@/hooks/useTrackedStorms";
import { formatDateTime, ktToMs, phaseLabel, positionAt, timeline, type Storm } from "@/lib/storm-utils";
import { bandFor } from "@/lib/storm-severity";
import { BandLegend } from "@/components/SeverityBand";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Stormkort over Danmark — Ruter og berørte områder | StormWatch" },
      {
        name: "description",
        content:
          "Se storme omkring Danmark på ét kort med deres hidtidige og forventede ruter samt berørte områder.",
      },
      { property: "og:title", content: "Stormkort over Danmark — Ruter og berørte områder" },
      {
        property: "og:description",
        content: "Stormpositioner, ruter og berørte områder i Danmark samlet på ét kort.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { data, isLoading } = useQuery(stormsQueryOptions);
  const { location, status, locate } = useMyLocation();
  const { tracked, toggle } = useTrackedStorms();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Storm | null>(null);
  const mapBoxRef = useRef<HTMLDivElement>(null);

  const storms = data?.storms ?? [];
  const order = { active: 0, upcoming: 1, passed: 2 } as const;
  const shown = [...storms].sort((a, b) => order[a.phase] - order[b.phase]);
  const selected = shown.find((s) => s.id === selectedId) ?? null;
  const activeCount = storms.filter((s) => s.phase === "active").length;
  const [time, setTime] = useState<number | null>(null);

  // Time range: the selected storm, otherwise all recent (2026) storms.
  const rangeStorms = selected ? [selected] : shown.filter((s) => s.simulated);
  const times = rangeStorms.flatMap((s) => timeline(s).map((p) => p.t));
  const HOUR = 3600_000;
  const minT = times.length ? Math.floor(Math.min(...times) / HOUR) * HOUR : 0;
  const maxT = times.length ? Math.ceil(Math.max(...times) / HOUR) * HOUR : 0;
  const clampedTime = time === null ? null : Math.min(maxT, Math.max(minT, time));
  const visibleAtTime =
    clampedTime === null ? null : shown.filter((s) => positionAt(s, clampedTime)).length;

  return (
    <main className="bg-sky-gradient min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-32 pt-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Stormkort · Danmark</h1>
            <p className="text-xs text-muted-foreground">
              {shown.length} storme ({activeCount} aktive) · fuld linje = hidtidig rute, stiplet =
              forventet rute, cirkel = berørt område
            </p>
          </div>
          <button
            onClick={locate}
            aria-label="Centrer på mit område"
            className="rounded-full bg-secondary p-2.5 text-secondary-foreground"
          >
            {status === "locating" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Crosshair className="size-4" />
            )}
          </button>
        </header>

        <div
          ref={mapBoxRef}
          className="glass-card shadow-lift mt-4 h-[58vh] overflow-hidden rounded-3xl"
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Indlæser stormruter…
            </div>
          ) : (
            <ClientOnly
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Klargør kort…
                </div>
              }
            >
              <StormMap
                storms={shown}
                me={location}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onOpen={setSheet}
                time={clampedTime}
              />
            </ClientOnly>
          )}
        </div>

        {maxT > minT && (
          <div className="glass-card mt-3 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Clock className="size-4 text-primary" />
                {clampedTime === null ? "Bevæg dig gennem tiden" : formatDateTime(new Date(clampedTime).toISOString())}
              </p>
              {clampedTime !== null && (
                <button
                  onClick={() => setTime(null)}
                  className="rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold text-secondary-foreground"
                >
                  Vis alle
                </button>
              )}
            </div>
            <Slider
              className="mt-4"
              min={minT}
              max={maxT}
              step={HOUR}
              value={[clampedTime ?? minT]}
              onValueChange={([v]) => setTime(v ?? minT)}
              aria-label="Tid"
            />
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>{formatDateTime(new Date(minT).toISOString())}</span>
              <span>{formatDateTime(new Date(maxT).toISOString())}</span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {clampedTime === null
                ? selected
                  ? `Træk for at se ${selected.name} bevæge sig langs sin rute.`
                  : "Træk for at se stormene bevæge sig over Danmark."
                : `${visibleAtTime} ${visibleAtTime === 1 ? "storm" : "storme"} på kortet på dette tidspunkt`}
            </p>
          </div>
        )}

        <div className="mt-3">
          <BandLegend />
        </div>

        <div className="mt-4 space-y-2">
          {shown.map((storm) => (
            <button
              key={storm.id}
              onClick={() => {
                if (selectedId === storm.id) {
                  setSheet(storm);
                  return;
                }
                setSelectedId(storm.id);
                mapBoxRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className={`relative flex w-full items-center justify-between overflow-hidden rounded-2xl px-4 py-3 text-left transition-colors ${
                selectedId === storm.id ? "bg-primary text-primary-foreground" : "glass-card"
              }`}
            >
              <span
                className="absolute inset-y-0 left-0 w-1.5"
                style={{ backgroundColor: bandFor(storm).cssVar }}
                aria-hidden
              />
              <div className="pl-2">
                <p className="text-sm font-semibold">{storm.name}</p>
                <p className="text-[11px] opacity-75">
                  {phaseLabel(storm.phase)} · {bandFor(storm).label} · {storm.basinName}
                </p>
              </div>
              <span className="text-sm font-bold">
                {ktToMs(storm.windKt)} <span className="text-[10px] font-medium opacity-75">m/s</span>
              </span>
            </button>
          ))}
          {!isLoading && shown.length === 0 && (
            <p className="glass-card rounded-2xl p-4 text-center text-sm text-muted-foreground">
              Der er ingen storme at vise lige nu.
            </p>
          )}
          {selected && (
            <p className="pt-1 text-center text-[11px] text-muted-foreground">
              {selected.name} er markeret på kortet — tryk igen for at se alle detaljer
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Skoleprojekt · farverne viser stormstyrken
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
