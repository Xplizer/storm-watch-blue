import { useCallback, useEffect, useState } from "react";

export type JournalEntry = {
  id: string;
  stormId: string | null;
  stormName: string;
  observedAt: string; // ISO
  windKph: number | null;
  pressure: number | null;
  place: string;
  notes: string;
};

const KEY = "stormwatch:journal";

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        setEntries(JSON.parse(raw) as JournalEntry[]);
      } catch {
        localStorage.removeItem(KEY);
      }
    }
    setLoaded(true);
  }, []);

  const save = useCallback((next: JournalEntry[]) => {
    setEntries(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const add = useCallback(
    (entry: Omit<JournalEntry, "id">) => {
      setEntries((prev) => {
        const next = [{ ...entry, id: crypto.randomUUID() }, ...prev].sort((a, b) =>
          b.observedAt.localeCompare(a.observedAt),
        );
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { entries, add, remove, save, loaded };
}
