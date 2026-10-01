import { Waves, ShieldCheck } from "lucide-react";
import { FLOOD_LABEL, type FloodRisk, type Storm } from "@/lib/storm-utils";
import { bandFor } from "@/lib/storm-severity";

const RISK_LEVEL: Record<FloodRisk, number> = { low: 1, moderate: 2, high: 3, severe: 4 };

export function WaterLevelCard({ storm }: { storm: Storm }) {
  const w = storm.water;
  return (
    <>
      <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Vandstand og oversvømmelsesrisiko
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
              Højeste forventede vandstand over normalen ved {w.places}.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Der er ingen vandstandsdata for denne storm.</p>
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
      "Hold afstand til væltede træer og nedfaldne elledninger.",
      "Tjek dit hjem for skader, og tag billeder til forsikringen.",
      "Undgå oversvømmede veje og kyststier, indtil vandet falder.",
      "Se til dine naboer, især ældre personer.",
    ];
  }
  const tips = [
    "Tag havemøbler, trampoliner og skraldespande ind, eller bind dem fast.",
    "Oplad din telefon og powerbanks, og hav en lommelygte klar.",
    "Hav vand, mad og medicin til mindst tre dage.",
    "Følg opdateringer fra DMI og politiet.",
  ];
  if (severe) {
    tips.push("Undgå at rejse — broer som Storebælt og Lillebælt kan lukke.");
    tips.push("Bliv indenfor og hold afstand til vinduer under den kraftigste vind.");
  }
  if (flood) {
    tips.push("Flyt værdigenstande op fra kældre og stueetager.");
    tips.push("Hold afstand til havne, moler og strande.");
  }
  return tips;
}

export function StormPreparation({ storm }: { storm: Storm }) {
  return (
    <>
      <h3 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {storm.phase === "passed" ? "Efter stormen" : "Sådan forbereder du dig"}
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
