export type Storm = {
  id: string;
  name: string;
  category: string;
  windKph: number;
  pressure: number;
  region: string;
  distanceKm: number;
  etaHours: number;
  severity: 1 | 2 | 3 | 4 | 5;
  status: "incoming" | "past";
  date: string;
  summary: string;
  rainMm: number;
};

export const storms: Storm[] = [
  {
    id: "s1",
    name: "Nordvind",
    category: "Severe Gale",
    windKph: 118,
    pressure: 968,
    region: "North Sea → Jutland",
    distanceKm: 340,
    etaHours: 9,
    severity: 4,
    status: "incoming",
    date: "2026-09-05T04:00:00Z",
    summary: "Deep low pressure tracking east. Coastal flooding likely along the west coast.",
    rainMm: 62,
  },
  {
    id: "s2",
    name: "Kelda",
    category: "Storm",
    windKph: 96,
    pressure: 981,
    region: "Skagerrak → Zealand",
    distanceKm: 610,
    etaHours: 21,
    severity: 3,
    status: "incoming",
    date: "2026-09-05T16:00:00Z",
    summary: "Fast-moving front with heavy squalls and scattered thunder cells.",
    rainMm: 38,
  },
  {
    id: "s3",
    name: "Brimir",
    category: "Tropical Remnant",
    windKph: 74,
    pressure: 993,
    region: "Atlantic → Faroe Islands",
    distanceKm: 1240,
    etaHours: 46,
    severity: 2,
    status: "incoming",
    date: "2026-09-06T18:00:00Z",
    summary: "Weakening remnant, mainly persistent rain and gusty coastal winds.",
    rainMm: 91,
  },
  {
    id: "s4",
    name: "Vela",
    category: "Hurricane-force",
    windKph: 147,
    pressure: 949,
    region: "Norwegian Sea",
    distanceKm: 0,
    etaHours: 0,
    severity: 5,
    status: "past",
    date: "2026-08-28T02:00:00Z",
    summary: "Record gusts of 164 km/h recorded offshore. Widespread power outages.",
    rainMm: 108,
  },
  {
    id: "s5",
    name: "Torden",
    category: "Thunderstorm Complex",
    windKph: 81,
    pressure: 989,
    region: "Central Denmark",
    distanceKm: 0,
    etaHours: 0,
    severity: 3,
    status: "past",
    date: "2026-08-14T19:30:00Z",
    summary: "Over 4,200 lightning strikes in six hours with local flash flooding.",
    rainMm: 74,
  },
  {
    id: "s6",
    name: "Aslaug",
    category: "Gale",
    windKph: 88,
    pressure: 984,
    region: "Baltic Sea",
    distanceKm: 0,
    etaHours: 0,
    severity: 2,
    status: "past",
    date: "2026-07-30T11:00:00Z",
    summary: "Sustained gales disrupted ferry routes for most of the day.",
    rainMm: 21,
  },
];
