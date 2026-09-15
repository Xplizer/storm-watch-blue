import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { NotebookPen, Trash2, Plus } from "lucide-react";
import { stormsQueryOptions } from "@/lib/storm-queries";
import { BottomNav } from "@/components/BottomNav";
import { BandBadge } from "@/components/SeverityBand";
import { bandFor } from "@/lib/storm-severity";
import { formatDateTime, ktToKph, type Storm } from "@/lib/storm-utils";
import { useJournal, type JournalEntry } from "@/hooks/useJournal";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Storm Journal — Log & Compare Your Observations | StormWatch" },
      {
        name: "description",
        content:
          "Log what you saw during a storm — wind, pressure and notes — and compare your readings side by side with NOAA's official measurements.",
      },
      { property: "og:title", content: "Storm Journal — Log & Compare Your Observations" },
      {
        property: "og:description",
        content: "Record your own storm observations and see how they compare with NOAA data.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JournalPage,
});

function localInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** NOAA track point nearest in time to an observation. */
function noaaAt(storm: Storm, iso: string) {
  const t = new Date(iso).getTime();
  let best = storm.track[0] ?? null;
  let bestGap = Infinity;
  for (const p of storm.track) {
    const gap = Math.abs(new Date(p.time).getTime() - t);
    if (gap < bestGap) {
      bestGap = gap;
      best = p;
    }
  }
  return best ? { point: best, gapHours: Math.round(bestGap / 3600000) } : null;
}

function Diff({ mine, noaa, unit }: { mine: number | null; noaa: number | null; unit: string }) {
  if (mine === null || noaa === null) return <span className="text-muted-foreground">—</span>;
  const d = Math.round(mine - noaa);
  const colour = Math.abs(d) <= 5 ? "var(--band-depression)" : "var(--band-hurricane)";
  return (
    <span className="font-semibold" style={{ color: colour }}>
      {d > 0 ? "+" : ""}
      {d} {unit}
    </span>
  );
}

function JournalPage() {
  const { data } = useQuery(stormsQueryOptions);
  const { entries, add, remove } = useJournal();
  const storms = useMemo(() => data?.storms ?? [], [data]);

  const [open, setOpen] = useState(false);
  const [stormId, setStormId] = useState("");
  const [observedAt, setObservedAt] = useState(() => localInputValue(new Date()));
  const [windKph, setWindKph] = useState("");
  const [pressure, setPressure] = useState("");
  const [place, setPlace] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const storm = storms.find((s) => s.id === stormId);
    add({
      stormId: storm?.id ?? null,
      stormName: storm?.name ?? "Unnamed weather",
      observedAt: new Date(observedAt).toISOString(),
      windKph: windKph ? Number(windKph) : null,
      pressure: pressure ? Number(pressure) : null,
      place: place.trim(),
      notes: notes.trim(),
    });
    setWindKph("");
    setPressure("");
    setNotes("");
    setOpen(false);
  };

  const field =
    "mt-1 w-full rounded-2xl border border-border bg-input/40 px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary";
  const label = "text-[11px] uppercase tracking-widest text-muted-foreground";

  return (
    <main className="bg-sky-gradient min-h-screen text-foreground">
      <div className="mx-auto max-w-md px-5 pb-32 pt-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <NotebookPen className="size-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Storm journal</h1>
              <p className="text-[11px] text-muted-foreground">
                {entries.length} observation{entries.length === 1 ? "" : "s"} · saved on this device
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-full bg-primary p-2.5 text-primary-foreground"
            aria-label="Add an observation"
          >
            <Plus className={`size-4 transition-transform ${open ? "rotate-45" : ""}`} />
          </button>
        </header>

        {open && (
          <form onSubmit={submit} className="glass-card shadow-lift mt-5 rounded-3xl p-4">
            <label className="block">
              <span className={label}>Storm</span>
              <select
                value={stormId}
                onChange={(e) => setStormId(e.target.value)}
                className={field}
              >
                <option value="">Unnamed weather</option>
                {storms.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.category}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block">
              <span className={label}>When you saw it</span>
              <input
                type="datetime-local"
                value={observedAt}
                onChange={(e) => setObservedAt(e.target.value)}
                className={field}
                required
              />
            </label>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block">
                <span className={label}>Wind km/h</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={windKph}
                  onChange={(e) => setWindKph(e.target.value)}
                  placeholder="e.g. 95"
                  className={field}
                />
              </label>
              <label className="block">
                <span className={label}>Pressure hPa</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={pressure}
                  onChange={(e) => setPressure(e.target.value)}
                  placeholder="e.g. 985"
                  className={field}
                />
              </label>
            </div>

            <label className="mt-3 block">
              <span className={label}>Where you were</span>
              <input
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Harbour road, Nassau"
                className={field}
              />
            </label>

            <label className="mt-3 block">
              <span className={label}>What you observed</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Horizontal rain, power out, palm trees bent double…"
                className={field}
              />
            </label>

            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Save observation
            </button>
          </form>
        )}

        <div className="mt-5 space-y-3">
          {entries.length === 0 && !open && (
            <div className="glass-card rounded-3xl p-6 text-center text-sm text-muted-foreground">
              Nothing logged yet. Tap + to record what a storm looked like where you are — your
              notes sit next to NOAA's official readings for the same moment.
            </div>
          )}

          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              storm={storms.find((s) => s.id === entry.stormId) ?? null}
              onDelete={() => remove(entry.id)}
            />
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Comparisons use the NOAA best-track reading closest in time to your observation.
        </p>
      </div>
      <BottomNav />
    </main>
  );
}

function EntryCard({
  entry,
  storm,
  onDelete,
}: {
  entry: JournalEntry;
  storm: Storm | null;
  onDelete: () => void;
}) {
  const match = storm ? noaaAt(storm, entry.observedAt) : null;
  const noaaWind = match ? ktToKph(match.point.windKt) : null;
  const noaaPressure = match?.point.pressure ?? null;

  return (
    <article className="glass-card shadow-lift relative overflow-hidden rounded-3xl p-4">
      {storm && (
        <span
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: bandFor(storm).cssVar }}
          aria-hidden
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          {storm ? <BandBadge band={bandFor(storm)} /> : null}
          <h2 className="mt-1.5 text-lg font-semibold">{entry.stormName}</h2>
          <p className="text-[11px] text-muted-foreground">
            {formatDateTime(entry.observedAt)}
            {entry.place ? ` · ${entry.place}` : ""}
          </p>
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete this observation"
          className="rounded-full bg-secondary p-2 text-secondary-foreground"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {entry.notes && <p className="mt-3 text-sm leading-relaxed">{entry.notes}</p>}

      <div className="mt-4 rounded-2xl bg-secondary/40 p-3">
        <div className="grid grid-cols-4 gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span />
          <span className="text-right">You</span>
          <span className="text-right">NOAA</span>
          <span className="text-right">Diff</span>
        </div>
        <Row
          label="Wind km/h"
          mine={entry.windKph}
          noaa={noaaWind}
          unit="km/h"
        />
        <Row label="Pressure hPa" mine={entry.pressure} noaa={noaaPressure} unit="hPa" />
        <p className="mt-2 text-[11px] text-muted-foreground">
          {match
            ? `NOAA reading from ${formatDateTime(match.point.time)} (${match.gapHours}h from your note)`
            : "No NOAA storm linked to this observation."}
        </p>
      </div>
    </article>
  );
}

function Row({
  label,
  mine,
  noaa,
  unit,
}: {
  label: string;
  mine: number | null;
  noaa: number | null;
  unit: string;
}) {
  return (
    <div className="mt-1.5 grid grid-cols-4 items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{mine ?? "—"}</span>
      <span className="text-right font-semibold">{noaa ?? "—"}</span>
      <span className="text-right">
        <Diff mine={mine} noaa={noaa} unit={unit} />
      </span>
    </div>
  );
}
