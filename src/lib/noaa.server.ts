import {
  BASIN_NAMES,
  classify,
  ktToKph,
  type ForecastPoint,
  type Storm,
  type TrackPoint,
} from "./storm-utils";

const BTK_INDEX = "https://ftp.nhc.noaa.gov/atcf/btk/";
const CURRENT = "https://www.nhc.noaa.gov/CurrentStorms.json";

type ActiveInfo = {
  id: string;
  name: string;
  movementDir: number | null;
  movementSpeed: number | null;
  forecastAdvisoryUrl: string | null;
  lastUpdate: string | null;
};

async function getText(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "StormWatch/1.0" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

function parseAtcfCoord(raw: string): number | null {
  const m = raw.trim().match(/^(\d+)([NSEW])$/);
  if (!m) return null;
  const value = Number(m[1]) / 10;
  return m[2] === "S" || m[2] === "W" ? -value : value;
}

function parseTime(stamp: string): string | null {
  const m = stamp.trim().match(/^(\d{4})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:00:00Z`;
}

/** Parse an ATCF b-deck (best track) file into a storm. */
function parseBestTrack(id: string, text: string): Storm | null {
  const seen = new Set<string>();
  const track: TrackPoint[] = [];
  let name = "";
  let basin = id.slice(0, 2).toUpperCase();

  for (const line of text.split("\n")) {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 12) continue;
    if (parts[4] !== "BEST") continue;
    const time = parseTime(parts[2] ?? "");
    const lat = parseAtcfCoord(parts[6] ?? "");
    const lon = parseAtcfCoord(parts[7] ?? "");
    if (!time || lat === null || lon === null) continue;
    if (seen.has(time)) continue;
    seen.add(time);
    basin = (parts[0] || basin).toUpperCase();
    const candidate = parts[27] ?? "";
    if (candidate && !/^\d+$/.test(candidate) && candidate !== "INVEST") name = candidate;
    track.push({
      time,
      lat,
      lon,
      windKt: Number(parts[8]) || 0,
      pressure: Number(parts[9]) || null,
      status: parts[10] || "LO",
    });
  }

  if (track.length === 0) return null;
  track.sort((a, b) => a.time.localeCompare(b.time));
  const last = track[track.length - 1]!;
  const peakWindKt = track.reduce((max, p) => Math.max(max, p.windKt), 0);
  const pretty = name
    ? name.charAt(0) + name.slice(1).toLowerCase()
    : `${basin}${id.slice(2, 4)}`;

  return {
    id,
    name: pretty,
    basin,
    basinName: BASIN_NAMES[basin] ?? basin,
    active: false,
    phase: "passed",
    status: last.status,
    category: classify(last.status, last.windKt),
    windKt: last.windKt,
    windKph: ktToKph(last.windKt),
    pressure: last.pressure,
    lat: last.lat,
    lon: last.lon,
    startedAt: track[0]!.time,
    updatedAt: last.time,
    track,
    forecast: [],
    peakWindKt,
    movement: { dirDeg: null, speedKt: null },
    advisory: null,
    affectedAreas: BASIN_NAMES[basin] ?? basin,
    affectedRadiusKm: 100,
    simulated: false,
    sourceLabel: "NOAA best-track archive",
  };
}

/** Pull the headline and summary paragraph out of an NHC advisory product. */
function parseAdvisoryText(text: string): { headline: string | null; summary: string | null } {
  const clean = text.replace(/\r/g, "");
  const headlineMatch = clean.match(/^\.\.\.(.+?)\.\.\.\s*$/m);
  const headline = headlineMatch ? headlineMatch[1]!.replace(/\s+/g, " ").trim() : null;

  let summary: string | null = null;
  const summaryStart = clean.search(/SUMMARY OF .*INFORMATION/);
  if (summaryStart >= 0) {
    const block = clean.slice(summaryStart);
    const lines = block
      .split("\n")
      .slice(1)
      .map((l) => l.trim())
      .filter((l) => l && !/^-+$/.test(l));
    const picked: string[] = [];
    for (const line of lines) {
      if (/^(FORECAST|OUTLOOK|REPEAT|\$\$)/.test(line)) break;
      picked.push(line);
      if (picked.length >= 8) break;
    }
    if (picked.length) summary = picked.join(" · ");
  }
  return { headline, summary };
}

/** Pull forecast positions out of an NHC forecast advisory text product. */
function parseForecastAdvisory(text: string, from: Date): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  const re = /(?:FORECAST|OUTLOOK) VALID (\d{2})\/(\d{2})(\d{2})Z\s+(\d+(?:\.\d+)?)([NS])\s+(\d+(?:\.\d+)?)([EW])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const day = Number(m[1]);
    const hour = Number(m[2]);
    const minute = Number(m[3]);
    const date = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), day, hour, minute),
    );
    if (date.getTime() < from.getTime() - 36 * 3600 * 1000) {
      date.setUTCMonth(date.getUTCMonth() + 1);
    }
    const lat = Number(m[4]) * (m[5] === "S" ? -1 : 1);
    const lon = Number(m[6]) * (m[7] === "W" ? -1 : 1);
    points.push({ time: date.toISOString(), lat, lon });
  }
  return points;
}

async function fetchActive(): Promise<ActiveInfo[]> {
  try {
    const res = await fetch(CURRENT, { headers: { "User-Agent": "StormWatch/1.0" } });
    if (!res.ok) return [];
    const json = (await res.json()) as { activeStorms?: Array<Record<string, unknown>> };
    return (json.activeStorms ?? []).map((s) => ({
      id: String(s['id'] ?? "").toLowerCase(),
      name: String(s['name'] ?? ""),
      movementDir: typeof s['movementDir'] === "number" ? s['movementDir'] : null,
      movementSpeed: typeof s['movementSpeed'] === "number" ? s['movementSpeed'] : null,
      forecastAdvisoryUrl:
        (s['forecastAdvisory'] as { url?: string } | undefined)?.url ?? null,
      lastUpdate: (s['lastUpdate'] as string | undefined) ?? null,
    }));
  } catch {
    return [];
  }
}

async function listBestTrackFiles(): Promise<string[]> {
  const html = await getText(BTK_INDEX);
  const ids = new Set<string>();
  for (const m of html.matchAll(/b(al|ep|cp)(\d{2})(\d{4})\.dat/gi)) {
    const num = Number(m[2]);
    if (num >= 90) continue; // invests, not named systems
    ids.add(`${m[1]!.toLowerCase()}${m[2]}${m[3]}`);
  }
  return [...ids];
}

let cache: { at: number; data: Storm[] } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function loadStorms(): Promise<Storm[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const [ids, active] = await Promise.all([listBestTrackFiles(), fetchActive()]);
  const activeById = new Map(active.map((a) => [a.id, a]));
  for (const a of active) if (!ids.includes(a.id)) ids.push(a.id);

  const settled = await Promise.allSettled(
    ids.map(async (id) => parseBestTrack(id, await getText(`${BTK_INDEX}b${id}.dat`))),
  );

  const storms: Storm[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) storms.push(r.value);
  }

  await Promise.allSettled(
    storms.map(async (storm) => {
      const info = activeById.get(storm.id);
      if (!info) return;
      storm.active = true;
      if (info.name) storm.name = info.name;
      storm.movement = { dirDeg: info.movementDir, speedKt: info.movementSpeed };
      if (!info.forecastAdvisoryUrl) return;
      try {
        const raw = await getText(info.forecastAdvisoryUrl);
        const text = raw.replace(/<[^>]+>/g, " ");
        storm.forecast = parseForecastAdvisory(
          text,
          new Date(info.lastUpdate ?? Date.now()),
        );
        const { headline, summary } = parseAdvisoryText(text);
        storm.advisory = {
          url: info.forecastAdvisoryUrl,
          issuedAt: info.lastUpdate,
          headline,
          summary,
        };
      } catch {
        /* forecast is optional */
      }
    }),
  );

  storms.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  cache = { at: Date.now(), data: storms };
  return storms;
}
