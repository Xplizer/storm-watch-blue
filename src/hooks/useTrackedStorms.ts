import { useCallback, useEffect, useState } from "react";

const KEY = "stormwatch:tracked";

export function useTrackedStorms() {
  const [tracked, setTracked] = useState<string[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    try {
      setTracked(JSON.parse(raw) as string[]);
    } catch {
      localStorage.removeItem(KEY);
    }
  }, []);

  const toggle = useCallback((id: string) => {
    setTracked((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { tracked, toggle, isTracked: (id: string) => tracked.includes(id) };
}
