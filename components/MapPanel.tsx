"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { School, GeoPoint } from "@/lib/types";
import { geocodeAddress } from "@/lib/geocode";
import MapSidebar from "./MapSidebar";

function makeIcon(label: string | number, isRanked: boolean, isSelected: boolean) {
  const bg = isSelected ? "#b5623a" : isRanked ? "#31503f" : "#8a8368";
  const size = isSelected ? 30 : isRanked ? 26 : 20;
  return L.divIcon({
    html: `<div style="
      background:${bg};color:#f6f4ee;width:${size}px;height:${size}px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-family:'Fraunces',serif;font-weight:600;font-size:${isRanked || isSelected ? 12 : 10}px;
      border:2px solid #f6f4ee;box-shadow:0 1px 3px rgba(0,0,0,0.35);
    ">${label}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function InitialFit({ points }: { points: GeoPoint[] }) {
  const map = useMap();
  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current || points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    didFit.current = true;
  }, [points, map]);
  return null;
}

// Recentre la carte quand le filtre (recherche / code postal) change, pour
// que la vue suive réellement ce qui est affiché dans la liste — c'est le
// lien qui manquait entre le filtre du panneau latéral et la carte.
// `filterKey` ne change que lorsque `query` ou `cp` bouge, jamais lorsque
// seul le classement ou le géocodage progresse, donc ce recentrage ne
// concurrence ni `InitialFit` (montage) ni `FlyToSelection` (clic sur une
// école).
function FilteredFit({ points, filterKey }: { points: GeoPoint[]; filterKey: string }) {
  const map = useMap();
  const prevKey = useRef(filterKey);
  useEffect(() => {
    if (prevKey.current === filterKey) return;
    prevKey.current = filterKey;
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lon]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [filterKey, points, map]);
  return null;
}

function FlyToSelection({
                          point,
                          onArrived,
                        }: {
  point: GeoPoint | null;
  onArrived: () => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!point) return;
    map.flyTo([point.lat, point.lon], 15, { duration: 0.8 });
    const t = setTimeout(onArrived, 850);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [point]);
  return null;
}

interface Props {
  schools: School[];
  ranking: string[];
  onRankChange: (id: string, rank: number | null) => void;
  focusId?: string;
}

export default function MapPanel({ schools, ranking, onRankChange, focusId }: Props) {
  const [points, setPoints] = useState<Record<string, GeoPoint | null>>({});
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [selectedId, setSelectedId] = useState<string>("");
  const [flyTarget, setFlyTarget] = useState<GeoPoint | null>(null);
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  // Miroir synchrone de `points`, lu par la boucle de géocodage séquentielle
  // ci-dessous pour savoir si une école a déjà été résolue entre-temps par
  // le géocodage prioritaire (voir plus bas) — `points` lui-même ne peut
  // pas être lu à jour depuis une boucle async démarrée avant sa mise à jour.
  const pointsRef = useRef<Record<string, GeoPoint | null>>({});
  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  // Filtre du panneau latéral : remonté ici (au lieu de vivre uniquement
  // dans MapSidebar) pour que la carte et la liste affichent toujours le
  // même sous-ensemble d'écoles.
  const [query, setQuery] = useState("");
  const [cp, setCp] = useState("");

  const rankOf = useMemo(() => {
    const map = new Map<string, number>();
    ranking.forEach((id, i) => map.set(id, i + 1));
    return map;
  }, [ranking]);

  const filteredSchools = useMemo(() => {
    const q = query.trim().toLowerCase();
    return schools.filter((s) => {
      if (cp && s.codePostal !== cp) return false;
      if (!q) return true;
      return [s.ecole, s.commune, s.circo, s.rne, s.adresse].some((f) =>
          f.toLowerCase().includes(q)
      );
    });
  }, [schools, query, cp]);

  const filterKey = `${query.trim().toLowerCase()}|${cp}`;

  useEffect(() => {
    let isCancelled = false;

    // Schools with coordinates already in the data: use them directly,
    // no network call needed.
    const withCoords: Record<string, GeoPoint | null> = {};
    const missing: School[] = [];
    schools.forEach((s) => {
      if (typeof s.latitude === "number" && typeof s.longitude === "number") {
        withCoords[s.id] = { lat: s.latitude, lon: s.longitude };
      } else {
        missing.push(s);
      }
    });

    setPoints(withCoords);
    setProgress({ done: schools.length - missing.length, total: schools.length });

    if (missing.length === 0) return;

    // Fallback: only geocode schools that truly lack coordinates.
    (async () => {
      for (const s of missing) {
        if (isCancelled) return;
        // Déjà résolue entre-temps par le géocodage prioritaire (l'école
        // ciblée par un clic "Voir sur la carte") : pas besoin de la
        // regéocoder, on avance juste la barre de progression.
        if (s.id in pointsRef.current) {
          setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
          continue;
        }
        const p = await geocodeAddress(s.adresse, s.commune, s.codePostal);
        if (isCancelled) return;
        setPoints((prev) => (s.id in prev ? prev : { ...prev, [s.id]: p }));
        setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      }
    })();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schools]);

  // Géocode en priorité l'école visée par focusId si sa position n'est pas
  // encore connue, au lieu d'attendre que la boucle séquentielle ci-dessus
  // arrive jusqu'à elle (ce qui pouvait prendre longtemps, ou ne jamais se
  // produire visuellement avant un bon moment) : c'est ce qui faisait que
  // cliquer sur une école sans coordonnées dans les données ne semblait
  // rien faire.
  useEffect(() => {
    if (!focusId) return;
    if (focusId in pointsRef.current) return;

    const school = schools.find((s) => s.id === focusId);
    if (!school) return;

    let cancelled = false;
    (async () => {
      const p = await geocodeAddress(school.adresse, school.commune, school.codePostal);
      if (cancelled) return;
      setPoints((prev) => (focusId in prev ? prev : { ...prev, [focusId]: p }));
    })();

    return () => {
      cancelled = true;
    };
  }, [focusId, schools]);

  // Centre/sélectionne automatiquement l'école visée par focusId (arrivée
  // depuis un clic sur une mini-carte dans un autre onglet). On mémorise le
  // focusId déjà "consommé" dans une ref plutôt que de comparer à
  // `selectedId` : sinon, dès qu'on sélectionne manuellement une autre
  // école sur la carte, `selectedId` change, l'effet se redéclenche, et il
  // réimposait l'ancienne école visée par focusId — impossible de choisir
  // autre chose tant que focusId ne changeait pas lui-même.
  const consumedFocusId = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!focusId || consumedFocusId.current === focusId) return;
    const p = points[focusId];
    if (p) {
      consumedFocusId.current = focusId;
      setSelectedId(focusId);
      setFlyTarget(p);
    }
  }, [focusId, points]);

  // Arriver depuis une autre page sur une école exclue par le filtre actif
  // ne doit pas la laisser invisible sans explication : on efface le
  // filtre pour que la carte et la liste la retrouvent.
  useEffect(() => {
    if (!focusId) return;
    const stillVisible = filteredSchools.some((s) => s.id === focusId);
    if (!stillVisible) {
      setQuery("");
      setCp("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const located = filteredSchools
      .map((s) => ({ school: s, point: points[s.id] }))
      .filter((x) => x.point) as { school: School; point: GeoPoint }[];

  const unlocated = schools.filter((s) => s.id in points && points[s.id] === null);

  const pointsReady = useMemo(() => {
    const map: Record<string, boolean> = {};
    schools.forEach((s) => {
      map[s.id] = !!points[s.id];
    });
    return map;
  }, [schools, points]);

  function handleSelect(id: string) {
    setSelectedId(id);
    const p = points[id];
    if (p) setFlyTarget(p);
  }

  function buildUnlocatedReport(unlocated: School[]): string {
    const header = "id\tecole\tcommune\tcodePostal\tadresse";
    const rows = unlocated.map(
        (s) => `${s.id}\t${s.ecole}\t${s.commune}\t${s.codePostal}\t${s.adresse}`
    );
    return [header, ...rows].join("\n");
  }

  async function copyUnlocatedToClipboard(unlocated: School[]) {
    const text = buildUnlocatedReport(unlocated);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard API can fail silently in some contexts; fall back to a
      // manual selection prompt so the user can still copy the data
      window.prompt("Copiez le texte ci-dessous :", text);
    }
  }

  function downloadUnlocatedCsv(unlocated: School[]) {
    const text = buildUnlocatedReport(unlocated);
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ecoles-non-localisees.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const filterActive = filteredSchools.length !== schools.length;

  return (
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-6">
        <p className="text-xs text-ink/50 mb-3 font-mono">
          {filterActive
              ? `${filteredSchools.length} / ${schools.length} écoles affichées`
              : `${schools.length} écoles`}
          {unlocated.length > 0 &&
              ` · ${unlocated.length} introuvable${unlocated.length > 1 ? "s" : ""}`}
        </p>

        <div className="flex flex-col md:flex-row gap-4" style={{ height: 600 }}>
          <div className="w-full md:w-[320px] shrink-0 border border-line rounded-sm bg-paper p-3 h-64 md:h-full">
            <MapSidebar
                schools={schools}
                filteredSchools={filteredSchools}
                query={query}
                cp={cp}
                onQueryChange={setQuery}
                onCpChange={setCp}
                rankOf={rankOf}
                selectedId={selectedId}
                onSelect={handleSelect}
                onRankChange={onRankChange}
                pointsReady={pointsReady}
            />
          </div>

          <div className="flex-1 rounded-sm overflow-hidden border border-line min-h-[320px]">
            <MapContainer
                center={[46.6, 2.2]}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom
            >
              <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {located.map(({ school, point }) => {
                const rank = rankOf.get(school.id);
                const isSelected = selectedId === school.id;
                return (
                    <Marker
                        key={school.id}
                        position={[point.lat, point.lon]}
                        icon={makeIcon(rank ?? "•", !!rank, isSelected)}
                        eventHandlers={{ click: () => setSelectedId(school.id) }}
                        ref={(m) => {
                          markerRefs.current[school.id] = m;
                        }}
                    >
                      <Popup>
                        <strong>
                          {rank ? `#${rank} — ` : ""}
                          {school.ecole}
                        </strong>
                        <br />
                        {school.adresse}
                        {school.niveau ? ` · ${school.niveau}` : ""}
                        <br />
                        <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                      {school.circo}
                    </span>
                      </Popup>
                    </Marker>
                );
              })}
              <InitialFit points={schools.map((s) => points[s.id]).filter(Boolean) as GeoPoint[]} />
              <FilteredFit points={located.map((l) => l.point)} filterKey={filterKey} />
              <FlyToSelection
                  point={flyTarget}
                  onArrived={() => {
                    if (selectedId) markerRefs.current[selectedId]?.openPopup();
                    setFlyTarget(null);
                  }}
              />
            </MapContainer>
          </div>
        </div>

        <div className="flex gap-4 mt-3 text-xs text-ink/50">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-moss inline-block" /> classée
        </span>
          <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8a8368] inline-block" /> non
          classée
        </span>
          <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-clay inline-block" /> sélectionnée
        </span>
        </div>

        {unlocated.length > 0 && (
            <div className="mt-4 text-sm text-ink/60">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium">
                  Non localisées ({unlocated.length}) :
                </p>
                <div className="flex gap-2">
                  <button
                      onClick={() => copyUnlocatedToClipboard(unlocated)}
                      className="text-xs border border-line rounded-sm px-2 py-1 hover:bg-wheat/50"
                  >
                    Copier
                  </button>
                  <button
                      onClick={() => downloadUnlocatedCsv(unlocated)}
                      className="text-xs border border-line rounded-sm px-2 py-1 hover:bg-wheat/50"
                  >
                    Exporter CSV
                  </button>
                </div>
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {unlocated.map((s) => (
                    <li key={s.id}>
                      {s.ecole} — {s.adresse || s.commune}
                    </li>
                ))}
              </ul>
            </div>
        )}
      </div>
  );
}