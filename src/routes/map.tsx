import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Crosshair, Loader2 } from "lucide-react";
import { stormsQueryOptions } from "@/lib/storm-queries";
import { StormMap } from "@/components/StormMap";
import { StormSheet } from "@/components/StormSheet";
import { BottomNav } from "@/components/BottomNav";
import { useMyLocation } from "@/hooks/useMyLocation";
import { useTrackedStorms } from "@/hooks/useTrackedStorms";
import { type Storm } from "@/lib/storm-utils";
import { bandFor } from "@/lib/storm-severity";
import { BandLegend } from "@/components/SeverityBand";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Storm Map Denmark — Paths & Affected Areas | StormWatch" },
      {
        name: "description",
        content:
          "See storms around Denmark on one map, with the path travelled, the expected path and the areas they affect.",
      },
      { property: "og:title", content: "Storm Map Denmark — Paths & Affected Areas" },
      {
        property: "og:description",
        content: "Storm positions, tracks and affected areas across Denmark on one map.",
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

  const storms = data?.storms ?? [];
  const order = { active: 0, upcoming: 1, passed: 2 } as const;
  const shown = [...storms].sort((a, b) => order[a.phase] - order[b.phase]);
  const selected = shown.find((s) => s.id === selectedId) ?? null;
  const activeCount = storms.filter((s) => s.phase === "active").length;

  return (
    <main className="bg-sky-gradient min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-32 pt-10">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Storm map · Denmark</h1>
            <p className="text-xs text-muted-foreground">
              {shown.length} storms ({activeCount} active) · solid line = path travelled, dotted =
              expected path, circle = affected area
            </p>
          </div>
          <button
            onClick={locate}
            aria-label="Center on my area"
            className="rounded-full bg-secondary p-2.5 text-secondary-foreground"
          >
            {status === "locating" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Crosshair className="size-4" />
            )}
          </button>
        </header>

        <div className="glass-card shadow-lift mt-4 h-[58vh] overflow-hidden rounded-3xl">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading live storm tracks…
            </div>
          ) : (
            <ClientOnly
              fallback={
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Preparing map…
                </div>
              }
            >
              <StormMap
                storms={active}
                me={location}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onOpen={setSheet}
              />
            </ClientOnly>
          )}
        </div>

        <div className="mt-3">
          <BandLegend />
        </div>

        <div className="mt-4 space-y-2">
          {active.map((storm) => (
            <button
              key={storm.id}
              onClick={() => setSheet(storm)}
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
                  {bandFor(storm).label} · {storm.basinName}
                </p>
              </div>
              <span className="text-sm font-bold">
                {storm.windKph} <span className="text-[10px] font-medium opacity-75">km/h</span>
              </span>
            </button>
          ))}
          {!isLoading && active.length === 0 && (
            <p className="glass-card rounded-2xl p-4 text-center text-sm text-muted-foreground">
              No named storms are active right now. Past storms are in the tracker.
            </p>
          )}
          {selected && (
            <p className="pt-1 text-center text-[11px] text-muted-foreground">
              {selected.name} is highlighted on the map — tap it for the full advisory
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Live data: NOAA National Hurricane Center · colours show storm severity
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
