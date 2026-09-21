import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Storm } from "./storm-utils";

export const getStorms = createServerFn({ method: "GET" }).handler(async (): Promise<{
  storms: Storm[];
  fetchedAt: string;
  error: string | null;
}> => {
  try {
    const { loadDenmarkStorms } = await import("./denmark-storms.server");
    return { storms: await loadDenmarkStorms(), fetchedAt: new Date().toISOString(), error: null };
  } catch (err) {
    console.error("Denmark storm data failed", err);
    return {
      storms: [],
      fetchedAt: new Date().toISOString(),
      error: "Storm data is temporarily unavailable.",
    };
  }
});

const coords = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export type LocalConditions = {
  place: string | null;
  description: string | null;
  temperatureC: number | null;
  windKph: number | null;
  gustKph: number | null;
  precipitationMm: number | null;
  error: string | null;
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

export const getLocalConditions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => coords.parse(input))
  .handler(async ({ data }): Promise<LocalConditions> => {
    const empty: LocalConditions = {
      place: null,
      description: null,
      temperatureC: null,
      windKph: null,
      gustKph: null,
      precipitationMm: null,
      error: null,
    };

    const lovableKey = process.env['LOVABLE_API_KEY'];
    const mapsKey = process.env['GOOGLE_MAPS_API_KEY'];
    if (!lovableKey || !mapsKey) {
      return { ...empty, error: "Local weather is not configured." };
    }
    const headers = {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": mapsKey,
    };

    const [weatherRes, geoRes] = await Promise.all([
      fetch(
        `${GATEWAY}/weather/v1/currentConditions:lookup?location.latitude=${data.lat}&location.longitude=${data.lon}`,
        { headers },
      ),
      fetch(
        `${GATEWAY}/maps/api/geocode/json?latlng=${data.lat},${data.lon}&result_type=locality|administrative_area_level_1`,
        { headers },
      ),
    ]);

    if (!weatherRes.ok) {
      const body = await weatherRes.text();
      console.error(`Weather lookup failed [${weatherRes.status}]: ${body}`);
      return { ...empty, error: `Local weather unavailable (${weatherRes.status}).` };
    }

    const w = (await weatherRes.json()) as Record<string, any>;
    let place: string | null = null;
    if (geoRes.ok) {
      const g = (await geoRes.json()) as { results?: Array<{ formatted_address?: string }> };
      place = g.results?.[0]?.formatted_address ?? null;
    }

    return {
      place,
      description: w['weatherCondition']?.description?.text ?? null,
      temperatureC: w['temperature']?.degrees ?? null,
      windKph: w['wind']?.speed?.value ?? null,
      gustKph: w['wind']?.gust?.value ?? null,
      precipitationMm: w['precipitation']?.qpf?.quantity ?? null,
      error: null,
    };
  });
