import { classify, ktToKph, type Storm, type TrackPoint } from "./storm-utils";

type Point = [string, number, number, number, number | null];

function storm(input: {
  id: string;
  name: string;
  phase: Storm["phase"];
  location: string;
  points: Point[];
  forecast?: Array<[string, number, number]>;
  direction?: number;
  speedKt?: number;
  affectedAreas: string;
  radius: number;
  simulated: boolean;
  source?: string;
}): Storm {
  const track: TrackPoint[] = input.points.map(([time, lat, lon, windKt, pressure]) => ({
    time,
    lat,
    lon,
    windKt,
    pressure,
    status: input.phase === "passed" ? "ENDED" : "EX",
  }));
  const last = track[track.length - 1];
  if (!last) throw new Error(`Storm ${input.id} needs at least one track point`);
  const peakWindKt = Math.max(...track.map((point) => point.windKt));
  return {
    id: input.id,
    name: input.name,
    basin: "DK",
    basinName: input.location,
    active: input.phase !== "passed",
    phase: input.phase,
    status: input.phase === "passed" ? "ENDED" : "EX",
    category: classify(input.phase === "passed" ? "ENDED" : "EX", last.windKt),
    windKt: last.windKt,
    windKph: ktToKph(last.windKt),
    pressure: last.pressure,
    lat: last.lat,
    lon: last.lon,
    startedAt: track[0]!.time,
    updatedAt: last.time,
    track,
    forecast: (input.forecast ?? []).map(([time, lat, lon]) => ({ time, lat, lon })),
    peakWindKt,
    movement: { dirDeg: input.direction ?? null, speedKt: input.speedKt ?? null },
    advisory: null,
    affectedAreas: input.affectedAreas,
    affectedRadiusKm: input.radius,
    simulated: input.simulated,
    sourceLabel: input.source ?? null,
  };
}

const STORMS: Storm[] = [
  storm({
    id: "dk-freja-2026", name: "Storm Freja", phase: "active", location: "Lillebælt",
    points: [["2026-09-21T12:00:00Z", 55.25, 9.15, 50, 986], ["2026-09-21T16:00:00Z", 55.42, 9.48, 58, 978]],
    forecast: [["2026-09-21T18:00:00Z", 55.52, 9.65], ["2026-09-21T20:00:00Z", 55.58, 9.78], ["2026-09-21T23:00:00Z", 55.76, 10.18]],
    direction: 55, speedKt: 18, affectedAreas: "Fredericia, Middelfart and the Lillebælt area", radius: 48, simulated: true,
  }),
  storm({
    id: "dk-atlas-2026", name: "Storm Atlas", phase: "upcoming", location: "Western Jutland / North Sea",
    points: [["2026-09-22T06:00:00Z", 56.15, 5.55, 47, 988]],
    forecast: [["2026-09-22T10:00:00Z", 56.2, 6.2], ["2026-09-22T12:00:00Z", 56.18, 7.25], ["2026-09-22T14:00:00Z", 56.16, 8.2]],
    direction: 90, speedKt: 22, affectedAreas: "Esbjerg, Ringkøbing and the western coast", radius: 90, simulated: true,
  }),
  storm({
    id: "dk-nova-2026", name: "Storm Nova", phase: "upcoming", location: "Zealand",
    points: [["2026-09-23T11:00:00Z", 55.1, 11.2, 42, 992]],
    forecast: [["2026-09-23T14:00:00Z", 55.32, 11.65], ["2026-09-23T16:00:00Z", 55.52, 12.02], ["2026-09-23T18:00:00Z", 55.68, 12.56]],
    direction: 50, speedKt: 16, affectedAreas: "Western Zealand, Roskilde and Copenhagen", radius: 70, simulated: true,
  }),
  storm({
    id: "dk-elias-2026", name: "Storm Elias", phase: "active", location: "Aarhus Bay",
    points: [["2026-09-21T09:00:00Z", 56.0, 10.25, 38, 995], ["2026-09-21T15:00:00Z", 56.2, 10.42, 44, 990]],
    forecast: [["2026-09-21T19:00:00Z", 56.55, 10.25], ["2026-09-21T22:00:00Z", 56.92, 10.05]],
    direction: 340, speedKt: 14, affectedAreas: "Aarhus, Djursland and southern Aalborg", radius: 58, simulated: true,
  }),
  storm({
    id: "dk-saga-2026", name: "Storm Saga", phase: "passed", location: "Odense / Funen",
    points: [["2026-09-15T10:00:00Z", 54.95, 9.25, 35, 997], ["2026-09-15T14:00:00Z", 55.28, 10.05, 41, 992], ["2026-09-15T18:00:00Z", 55.55, 10.82, 30, 1000]],
    direction: 55, speedKt: 15, affectedAreas: "Odense, central Funen and the Great Belt", radius: 52, simulated: true,
  }),
  storm({
    id: "dk-bodil-2013", name: "Storm Bodil", phase: "passed", location: "North Sea / North Zealand",
    points: [["2013-12-05T12:00:00Z", 56.1, 5.8, 52, null], ["2013-12-05T18:00:00Z", 56.4, 8.1, 71, null], ["2013-12-06T00:00:00Z", 56.2, 10.8, 58, null]],
    direction: 90, affectedAreas: "Western coast, North Zealand and Roskilde Fjord", radius: 120, simulated: false,
    source: "DMI storm archive · 5–7 December 2013",
  }),
  storm({
    id: "dk-malik-2022", name: "Storm Malik", phase: "passed", location: "North Sea / Kattegat",
    points: [["2022-01-29T12:00:00Z", 56.5, 6.0, 44, null], ["2022-01-29T20:00:00Z", 56.7, 8.7, 54, null], ["2022-01-30T04:00:00Z", 56.4, 11.3, 43, null]],
    direction: 110, affectedAreas: "West coast, Kattegat, Bornholm and Roskilde Fjord", radius: 130, simulated: false,
    source: "DMI storm archive · 29–30 January 2022",
  }),
  storm({
    id: "dk-pia-2023", name: "Storm Pia", phase: "passed", location: "Western Jutland / Kattegat",
    points: [["2023-12-21T12:00:00Z", 56.6, 6.2, 48, null], ["2023-12-21T18:00:00Z", 56.8, 8.2, 59, null], ["2023-12-22T00:00:00Z", 57.0, 11.0, 49, null]],
    direction: 90, affectedAreas: "Thyborøn, the west coast, Kattegat and Roskilde Fjord", radius: 125, simulated: false,
    source: "DMI storm archive · 21–22 December 2023",
  }),
];

export async function loadDenmarkStorms(): Promise<Storm[]> {
  return STORMS;
}