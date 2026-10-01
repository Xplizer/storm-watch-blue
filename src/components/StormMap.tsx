import { useEffect, useRef, useState } from "react";
import type { Storm } from "@/lib/storm-utils";
import { positionAt, severity } from "@/lib/storm-utils";
import { bandFor } from "@/lib/storm-severity";

declare global {
  interface Window {
    __stormMapReady?: () => void;
    google?: any;
  }
}

let loader: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (loader) return loader;
  const key = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY'];
  const channel = import.meta.env['VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID'];
  loader = new Promise<void>((resolve, reject) => {
    if (!key) {
      reject(new Error("Map key missing"));
      return;
    }
    window.__stormMapReady = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__stormMapReady${channel ? `&channel=${channel}` : ""}`;
    script.async = true;
    script.onerror = () => reject(new Error("Map failed to load"));
    document.head.appendChild(script);
  });
  return loader;
}

export function StormMap({
  storms,
  me,
  selectedId,
  onSelect,
  onOpen,
  time = null,
}: {
  storms: Storm[];
  me: { lat: number; lon: number } | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen?: (storm: Storm) => void;
  time?: number | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !ref.current || mapRef.current) return;
        mapRef.current = new window.google.maps.Map(ref.current, {
          center: { lat: 56.0, lng: 10.5 },
          zoom: 6,
          disableDefaultUI: true,
          zoomControl: true,
          backgroundColor: "#0b1a2b",
          styles: [
            { elementType: "geometry", stylers: [{ color: "#12263f" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#8fb4d9" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0b1a2b" }] },
            { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1a2b" }] },
            { featureType: "road", stylers: [{ visibility: "off" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#24405f" }] },
          ],
        });
      })
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps) return;
    const g = window.google.maps;

    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];

    const bounds = new g.LatLngBounds();
    let hasBounds = false;

    storms.forEach((storm) => {
      const color = bandFor(storm).hex;
      const dim = selectedId !== null && selectedId !== storm.id;
      const pos = time === null ? { lat: storm.lat, lon: storm.lon } : positionAt(storm, time);
      const path = storm.track.map((p) => ({ lat: p.lat, lng: p.lon }));
      if (path.length > 1) {
        const line = new g.Polyline({
          path,
          map,
          strokeColor: color,
          strokeOpacity: dim ? 0.25 : 0.9,
          strokeWeight: dim ? 2 : 3,
        });
        line.addListener("click", () => onSelect(storm.id));
        overlaysRef.current.push(line);
      }

      if (storm.forecast.length > 0) {
        const forecastPath = [
          { lat: storm.lat, lng: storm.lon },
          ...storm.forecast.map((p) => ({ lat: p.lat, lng: p.lon })),
        ];
        overlaysRef.current.push(
          new g.Polyline({
            path: forecastPath,
            map,
            strokeOpacity: 0,
            icons: [
              {
                icon: { path: "M 0,-1 0,1", strokeOpacity: dim ? 0.3 : 1, strokeColor: color, scale: 3 },
                offset: "0",
                repeat: "14px",
              },
            ],
          }),
        );
      }

      if (!pos) {
        path.forEach((p) => {
          bounds.extend(p);
          hasBounds = true;
        });
        return;
      }
      const marker = new g.Marker({
        position: { lat: pos.lat, lng: pos.lon },
        map,
        title: `${storm.name} — ${storm.category}`,
        icon: {
          path: g.SymbolPath.CIRCLE,
          scale: 5 + severity(storm.windKt) * 2,
          fillColor: color,
          fillOpacity: dim ? 0.35 : 0.95,
          strokeColor: "#e8f4ff",
          strokeWeight: storm.active ? 2 : 0.5,
        },
      });
      marker.addListener("click", () => {
        onSelect(storm.id);
        onOpen?.(storm);
      });
      overlaysRef.current.push(marker);

      if (storm.affectedRadiusKm > 0) {
        overlaysRef.current.push(
          new g.Circle({
            map,
            center: { lat: pos.lat, lng: pos.lon },
            radius: storm.affectedRadiusKm * 1000,
            strokeColor: color,
            strokeOpacity: dim ? 0.2 : 0.5,
            strokeWeight: 1,
            fillColor: color,
            fillOpacity: dim ? 0.05 : 0.12,
            clickable: false,
          }),
        );
      }

      path.forEach((p) => {
        bounds.extend(p);
        hasBounds = true;
      });
    });

    if (me) {
      overlaysRef.current.push(
        new g.Marker({
          position: { lat: me.lat, lng: me.lon },
          map,
          title: "Dit område",
          icon: {
            path: g.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: "#ffffff",
            fillOpacity: 1,
            strokeColor: "#3b8ee6",
            strokeWeight: 4,
          },
        }),
      );
      bounds.extend({ lat: me.lat, lng: me.lon });
      hasBounds = true;
    }

    const selected = storms.find((s) => s.id === selectedId);
    const selPos = selected
      ? (time === null ? { lat: selected.lat, lon: selected.lon } : positionAt(selected, time))
      : null;
    if (selected && selPos) {
      map.panTo({ lat: selPos.lat, lng: selPos.lon });
      if ((map.getZoom() ?? 6) < 7) map.setZoom(7);
    } else if (!selected && hasBounds && time === null) {
      map.fitBounds(bounds, 40);
    }
  }, [storms, me, selectedId, onSelect, onOpen, time]);

  if (error) {
    return (
      <div className="glass-card flex h-full items-center justify-center rounded-3xl p-6 text-center text-sm text-muted-foreground">
        Stormkortet kunne ikke indlæses lige nu.
      </div>
    );
  }

  return <div ref={ref} className="h-full w-full rounded-3xl" />;
}

export default StormMap;
