"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { familyName } from "@/lib/labels";
import { BUYER_HUB, HOUSE_PLACE, kmFromHub, placeGeo } from "@/lib/places";
import { loadPiles } from "@/lib/store";

type LeafletNs = {
  map: (el: HTMLElement, opts: object) => {
    remove: () => void;
    fitBounds: (b: unknown, opts?: object) => void;
  };
  tileLayer: (url: string, opts: object) => { addTo: (m: unknown) => void };
  circleMarker: (
    latlng: [number, number],
    opts: object,
  ) => { addTo: (m: unknown) => unknown; bindPopup: (html: string) => void };
  featureGroup: (layers: unknown[]) => { getBounds: () => unknown };
};

function loadLeaflet(): Promise<LeafletNs> {
  const w = window as Window & { L?: LeafletNs };
  if (w.L) return Promise.resolve(w.L);
  return new Promise((resolve, reject) => {
    if (!document.getElementById("kn-leaflet-css")) {
      const link = document.createElement("link");
      link.id = "kn-leaflet-css";
      link.rel = "stylesheet";
      link.href = "/leaflet/leaflet.css";
      document.head.appendChild(link);
    }
    const existing = document.getElementById("kn-leaflet-js") as HTMLScriptElement | null;
    const finish = () => {
      const L = (window as Window & { L?: LeafletNs }).L;
      if (L) resolve(L);
      else reject(new Error("leaflet"));
    };
    if (existing) {
      if (w.L) finish();
      else existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("leaflet")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.id = "kn-leaflet-js";
    script.src = "/leaflet/leaflet.js";
    script.onload = finish;
    script.onerror = () => reject(new Error("leaflet"));
    document.body.appendChild(script);
  });
}

export default function FirozabadMap() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const pins = useMemo(() => {
    const piles = loadPiles();
    const byPlace = new Map<string, string[]>();
    for (const pile of piles) {
      const place = pile.locality || HOUSE_PLACE[pile.householdId] || "Ramnagar";
      const names = byPlace.get(place) ?? [];
      const name = familyName(pile.householdId, "en");
      if (!names.includes(name)) names.push(name);
      byPlace.set(place, names);
    }
    const rows = [...byPlace.entries()].map(([locality, families]) => ({
      locality,
      families,
      km: kmFromHub(locality),
      geo: placeGeo(locality),
    }));
    rows.sort((a, b) => a.km - b.km);
    return rows;
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let map: { remove: () => void } | null = null;
    let alive = true;
    loadLeaflet()
      .then((L) => {
        if (!alive || !host.current) return;
        try {
          const created = L.map(host.current, {
            scrollWheelZoom: false,
            zoomControl: true,
          });
          map = created;
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "&copy; OpenStreetMap",
            maxZoom: 18,
          }).addTo(created);
          const hub = placeGeo(BUYER_HUB);
          const layers: unknown[] = [];
          const hubMark = L.circleMarker([hub.lat, hub.lng], {
            radius: 14,
            color: "#8b1e14",
            fillColor: "#8b1e14",
            fillOpacity: 0.95,
          });
          hubMark.addTo(created);
          hubMark.bindPopup(`${BUYER_HUB} · buyer mandi`);
          layers.push(hubMark);
          for (const pin of pins) {
            const mark = L.circleMarker([pin.geo.lat, pin.geo.lng], {
              radius: 11,
              color: "#8b1e14",
              fillColor: "#f6efe4",
              fillOpacity: 0.95,
              weight: 3,
            });
            mark.addTo(created);
            mark.bindPopup(
              `${pin.locality} · ~${pin.km} km<br/>${pin.families.slice(0, 6).join(", ")}`,
            );
            layers.push(mark);
          }
          created.fitBounds(L.featureGroup(layers).getBounds(), {
            padding: [28, 28],
          });
          window.setTimeout(() => {
            try {
              (created as { invalidateSize?: () => void }).invalidateSize?.();
            } catch {
              /* ignore */
            }
          }, 80);
          if (alive) setReady(true);
        } catch {
          if (alive) setFailed(true);
        }
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
      map?.remove();
    };
  }, [pins]);

  return (
    <div>
      <div ref={host} className="kn-map" />
      {!ready && !failed ? (
        <p className="mt-3 text-base text-[#5c4638]">Map opening…</p>
      ) : null}
      {failed ? (
        <div className="kn-map-fallback mt-3 p-5">
          <p className="text-lg font-bold">Firozabad · schematic</p>
          <p className="mt-2 text-sm text-[#5c4638]">
            Mandi at the centre. Families by locality. Nearer listed first.
          </p>
        </div>
      ) : null}
      <ul className="mt-6 space-y-3">
        <li className="kn-row">
          <span className="kn-dot kn-dot-red" />
          <div>
            <p className="font-bold">{BUYER_HUB}</p>
            <p className="text-sm text-[#5c4638]">Buyer mandi · 0 km</p>
          </div>
        </li>
        {pins.map((pin) => (
          <li key={pin.locality} className="kn-row">
            <span className="kn-dot kn-dot-red" />
            <div>
              <p className="font-bold">
                {pin.locality} · ~{pin.km} km
              </p>
              <p className="text-sm text-[#5c4638]">{pin.families.join(" · ")}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
