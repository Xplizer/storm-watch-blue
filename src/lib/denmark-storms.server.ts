import { classify, ktToKph, type FloodRisk, type Storm, type TrackPoint } from "./storm-utils";

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
  water?: { peakCm: number; places: string; floodRisk: FloodRisk };
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
    water: input.water ?? null,
  };
}

const STORMS: Storm[] = [
  storm({
    id: "dk-freja-2026", name: "Storm Freja", phase: "active", location: "Lillebælt",
    points: [["2026-09-21T12:00:00Z", 55.25, 9.15, 50, 986], ["2026-09-21T16:00:00Z", 55.42, 9.48, 58, 978]],
    forecast: [["2026-09-21T18:00:00Z", 55.52, 9.65], ["2026-09-21T20:00:00Z", 55.58, 9.78], ["2026-09-21T23:00:00Z", 55.76, 10.18]],
    direction: 55, speedKt: 18, affectedAreas: "Fredericia, Middelfart og Lillebæltsområdet", radius: 48, water: { peakCm: 145, places: "Fredericia Havn, Middelfart og Kolding Fjord", floodRisk: "high" }, simulated: true,
  }),
  storm({
    id: "dk-atlas-2026", name: "Storm Atlas", phase: "upcoming", location: "Vestjylland / Nordsøen",
    points: [["2026-09-22T06:00:00Z", 56.15, 5.55, 47, 988]],
    forecast: [["2026-09-22T10:00:00Z", 56.2, 6.2], ["2026-09-22T12:00:00Z", 56.18, 7.25], ["2026-09-22T14:00:00Z", 56.16, 8.2]],
    direction: 90, speedKt: 22, affectedAreas: "Esbjerg, Ringkøbing og vestkysten", radius: 90, water: { peakCm: 260, places: "Esbjerg, Thyborøn og Vadehavskysten", floodRisk: "severe" }, simulated: true,
  }),
  storm({
    id: "dk-nova-2026", name: "Storm Nova", phase: "upcoming", location: "Sjælland",
    points: [["2026-09-23T11:00:00Z", 55.1, 11.2, 42, 992]],
    forecast: [["2026-09-23T14:00:00Z", 55.32, 11.65], ["2026-09-23T16:00:00Z", 55.52, 12.02], ["2026-09-23T18:00:00Z", 55.68, 12.56]],
    direction: 50, speedKt: 16, affectedAreas: "Vestsjælland, Roskilde og København", radius: 70, water: { peakCm: 120, places: "Roskilde Fjord, Køge Bugt og Københavns Havn", floodRisk: "moderate" }, simulated: true,
  }),
  storm({
    id: "dk-elias-2026", name: "Storm Elias", phase: "active", location: "Aarhus Bugt",
    points: [["2026-09-21T09:00:00Z", 56.0, 10.25, 38, 995], ["2026-09-21T15:00:00Z", 56.2, 10.42, 44, 990]],
    forecast: [["2026-09-21T19:00:00Z", 56.55, 10.25], ["2026-09-21T22:00:00Z", 56.92, 10.05]],
    direction: 340, speedKt: 14, affectedAreas: "Aarhus, Djursland og det sydlige Aalborg", radius: 58, water: { peakCm: 95, places: "Aarhus Havn og Kalø Vig", floodRisk: "moderate" }, simulated: true,
  }),
  storm({
    id: "dk-saga-2026", name: "Storm Saga", phase: "passed", location: "Odense / Fyn",
    points: [["2026-09-15T10:00:00Z", 54.95, 9.25, 35, 997], ["2026-09-15T14:00:00Z", 55.28, 10.05, 41, 992], ["2026-09-15T18:00:00Z", 55.55, 10.82, 30, 1000]],
    direction: 55, speedKt: 15, affectedAreas: "Odense, det centrale Fyn og Storebælt", radius: 52, water: { peakCm: 70, places: "Odense Fjord", floodRisk: "low" }, simulated: true,
  }),
  storm({
    id: "dk-bodil-2013", name: "Storm Bodil", phase: "passed", location: "Nordsøen / Nordsjælland",
    points: [["2013-12-05T12:00:00Z", 56.1, 5.8, 52, null], ["2013-12-05T18:00:00Z", 56.4, 8.1, 71, null], ["2013-12-06T00:00:00Z", 56.2, 10.8, 58, null]],
    direction: 90, affectedAreas: "Vestkysten, Nordsjælland og Roskilde Fjord", radius: 120, simulated: false,
    source: "DMI's stormarkiv · 5.–7. december 2013",
  }),
  storm({
    id: "dk-malik-2022", name: "Storm Malik", phase: "passed", location: "Nordsøen / Kattegat",
    points: [["2022-01-29T12:00:00Z", 56.5, 6.0, 44, null], ["2022-01-29T20:00:00Z", 56.7, 8.7, 54, null], ["2022-01-30T04:00:00Z", 56.4, 11.3, 43, null]],
    direction: 110, affectedAreas: "Vestkysten, Kattegat, Bornholm og Roskilde Fjord", radius: 130, simulated: false,
    source: "DMI's stormarkiv · 29.–30. januar 2022",
  }),
  storm({
    id: "dk-pia-2023", name: "Storm Pia", phase: "passed", location: "Vestjylland / Kattegat",
    points: [["2023-12-21T12:00:00Z", 56.6, 6.2, 48, null], ["2023-12-21T18:00:00Z", 56.8, 8.2, 59, null], ["2023-12-22T00:00:00Z", 57.0, 11.0, 49, null]],
    direction: 90, affectedAreas: "Thyborøn, vestkysten, Kattegat og Roskilde Fjord", radius: 125, simulated: false,
    source: "DMI's stormarkiv · 21.–22. december 2023",
  }),
];

export async function loadDenmarkStorms(): Promise<Storm[]> {
  return STORMS;
}