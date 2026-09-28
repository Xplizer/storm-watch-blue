import { Waves, ShieldCheck } from "lucide-react";
import { FLOOD_LABEL, type FloodRisk, type Storm } from "@/lib/storm-utils";
import { bandFor } from "@/lib/storm-severity";

const RISK_LEVEL: Record<FloodRisk, number> = { low: 1, moderate: 2, high: 3, severe: 4 };

export function WaterLevelCard({ storm }: { storm: Storm }) {
  const w = storm.water;
  return (
    <>
      <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Water level & flood risk
      </h3>
      <div className="glass-card mt-3 rounded-2xl p-4">
        {w ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className="size-5 text-primary" />
                <p className="text-sm font-semibold">{FLOOD_LABEL[w.floodRisk]}</p>
              </div>
              <p className="text-xl font-bold">
                +{(w.peakCm / 100).toFixed(2)} <span className="text-xs font-medium">m</span>
              </p>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 rounded-full ${n <= RISK_LEVEL[w.floodRisk] ? "bg-primary" : "bg-secondary"}`}
                />
              ))}
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground">
              Highest water above normal expected at {w.places}.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No water level data available for this storm.</p>
        )}
      </div>
    </>
  );
}

function tipsFor(storm: Storm): string[] {
  const band = bandFor(storm).key;
  const severe = band === "storm" || band === "violent" || band === "hurricane";
  const flood = storm.water && RISK_LEVEL[storm.water.floodRisk] >= 3;
  if (storm.phase === "passed") {
    return [
      "Stay away from fallen trees and downed power lines.",
      "Check your home for damage and photograph it for insurance.",
      "Avoid flooded roads and coastal paths until the water drops.",
      "Check in on neighbours, especially elderly people.",
    ];
  }
  const tips = [
    "Bring in or tie down garden furniture, trampolines and bins.",
    "Charge your phone and power banks; keep a torch ready.",
    "Keep water, food and medicine for at least 3 days.",
    "Follow updates from DMI and the police.",
  ];
  if (severe) {
    tips.push("Avoid travelling — bridges like Storebælt and Lillebælt may close.");
    tips.push("Stay indoors and away from windows during the strongest winds.");
  }
  if (flood) {
    tips.push("Move valuables up from basements and ground floors.");
    tips.push("Keep away from harbours, piers and beaches.");
  }
  return tips;
}

export function StormPreparation({ storm }: { storm: Storm }) {
  return (
    <>
      <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {storm.phase === "passed" ? "After the storm" : "How to prepare"}
      </h3>
      <ul className="glass-card mt-3 space-y-2.5 rounded-2xl p-4">
        {tipsFor(storm).map((tip) => (
          <li key={tip} className="flex items-start gap-2 text-sm">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            {tip}
          </li>
        ))}
      </ul>
    </>
  );
}
