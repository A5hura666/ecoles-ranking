"use client";

import { useMemo, useState } from "react";
import { School } from "@/lib/types";
import RankBadge from "./RankBadge";
import SchoolMiniMap from "./SchoolMiniMap";
import { REFERENCE_POINT } from "@/lib/referencePoint";
import { haversineKm } from "@/lib/distance";
import { decodeSchoolType } from "@/lib/schoolType";

interface Props {
    schools: School[];
    ranking: string[];
    onToggle: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onSelectSchool?: (id: string) => void;
}

type SortMode = "alpha" | "distance";

export default function AllSchoolsPanel({
                                            schools,
                                            ranking,
                                            onToggle,
                                            onSelectAll,
                                            onDeselectAll,
                                            onSelectSchool,
                                        }: Props) {
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortMode>("alpha");

    const rankOf = useMemo(() => {
        const map = new Map<string, number>();
        ranking.forEach((id, i) => map.set(id, i + 1));
        return map;
    }, [ranking]);

    const distanceOf = useMemo(() => {
        const map = new Map<string, number>();
        schools.forEach((s) => {
            if (s.latitude && s.longitude) {
                map.set(
                    s.id,
                    haversineKm(REFERENCE_POINT.lat, REFERENCE_POINT.lon, s.latitude, s.longitude)
                );
            }
        });
        return map;
    }, [schools]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const base = !q
            ? schools
            : schools.filter((s) =>
                [s.ecole, s.commune, s.circo, s.rne, s.adresse, s.codePostal].some((f) =>
                    f.toLowerCase().includes(q)
                )
            );

        if (sortBy === "distance") {
            return [...base].sort((a, b) => {
                const da = distanceOf.get(a.id) ?? Infinity;
                const db = distanceOf.get(b.id) ?? Infinity;
                return da - db;
            });
        }
        return base;
    }, [schools, query, sortBy, distanceOf]);

    return (
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-6">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une école, une commune, une circonscription…"
                className="w-full border border-line rounded-sm px-4 py-2.5 text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-moss/40 mb-3"
            />

            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-xs text-ink/50 font-mono shrink-0">
                        {filtered.length} école{filtered.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex bg-wheat/40 rounded-full p-0.5 text-xs no-print">
                        <button
                            onClick={() => setSortBy("alpha")}
                            className={`px-3 py-1 rounded-full transition-colors ${
                                sortBy === "alpha"
                                    ? "bg-moss text-paper"
                                    : "text-ink/50 hover:text-ink"
                            }`}
                        >
                            A → Z
                        </button>
                        <button
                            onClick={() => setSortBy("distance")}
                            className={`px-3 py-1 rounded-full transition-colors ${
                                sortBy === "distance"
                                    ? "bg-moss text-paper"
                                    : "text-ink/50 hover:text-ink"
                            }`}
                        >
                            Proximité
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap no-print">
                    <button
                        onClick={onSelectAll}
                        className="text-sm px-3 py-2 rounded-sm border border-moss text-moss hover:bg-moss hover:text-paper transition-colors"
                    >
                        Tout sélectionner
                    </button>
                    <button
                        onClick={onDeselectAll}
                        className="text-sm px-3 py-2 rounded-sm border border-line text-ink/60 hover:text-clay hover:border-clay/60 transition-colors"
                    >
                        Tout désélectionner
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-ink/50 mb-3">
          <span className="flex items-center gap-1.5">
            <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: "#3b6e8f" }}
            />
              {REFERENCE_POINT.label}
          </span>
                <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-clay inline-block" />
            école
          </span>
            </div>

            <ul className="flex flex-col gap-2">
                {filtered.map((s, i) => {
                    const rank = rankOf.get(s.id);
                    const distanceKm = distanceOf.get(s.id) ?? null;
                    const typeInfo = decodeSchoolType(s.ecole);

                    return (
                        <li
                            key={s.id}
                            title={`${s.adresse}, ${s.codePostal} ${s.commune}`}
                            style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}
                            className={`school-row flex flex-col sm:flex-row gap-3 border rounded-sm p-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                                rank
                                    ? "border-moss/40 bg-wheat/50"
                                    : "border-line bg-white/50 hover:bg-white"
                            }`}
                        >
                            <div className="flex items-start gap-3 min-w-0">
                                {rank ? (
                                    <span className="badge-pop shrink-0">
        <RankBadge n={rank} />
    </span>
                                ) : (
                                    <span
                                        className="w-8 h-8 shrink-0 rounded-full border border-dashed border-line/70 flex items-center justify-center text-ink/30 text-sm"
                                        aria-hidden="true"
                                    >
    +
</span>
                                )}

                                {s.latitude && s.longitude ? (
                                    <SchoolMiniMap
                                        lat={s.latitude}
                                        lon={s.longitude}
                                        onSelect={onSelectSchool ? () => onSelectSchool(s.id) : undefined}
                                        className="h-40 flex-1 min-w-0 sm:flex-none sm:w-40 sm:h-32 md:w-56 md:h-44"
                                    />
                                ) : (
                                    <span className="h-40 flex-1 min-w-0 sm:flex-none sm:w-40 sm:h-32 md:w-56 md:h-44 shrink-0 rounded-sm border border-line bg-wheat/20" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-display text-[15px] leading-snug text-ink truncate">
                                        {s.ecole}
                                    </p>
                                    {typeInfo && (
                                        <span className="text-[10px] uppercase tracking-wide font-medium text-moss border border-moss/40 rounded-full px-2 py-0.5 shrink-0">
                    {typeInfo.label}
                </span>
                                    )}
                                </div>
                                <p className="text-xs text-ink/60 truncate">
                                    {s.commune}
                                    {s.niveau ? ` · ${s.niveau}` : ""} ·{" "}
                                    <span className="font-mono">{s.circo.replace(/^IEN\s+/, "")}</span>
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {distanceKm !== null && (
                                        <p className="text-[11px] text-ink/45 font-mono">
                                            ≈ {distanceKm.toFixed(1)} km à vol d&apos;oiseau
                                        </p>
                                    )}
                                    {s.rne && (
                                        <p className="text-[11px] text-ink/35 font-mono">{s.rne}</p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => onToggle(s.id)}
                                className={`shrink-0 text-sm font-medium px-3 py-1.5 rounded-sm border transition-colors w-full sm:w-auto ${
                                    rank
                                        ? "border-clay/60 text-clay hover:bg-clay hover:text-paper"
                                        : "border-moss text-moss hover:bg-moss hover:text-paper"
                                }`}
                            >
                                {rank ? "Retirer" : "Ajouter"}
                            </button>
                        </li>
                    );
                })}
                {filtered.length === 0 && (
                    <li className="text-sm text-ink/50 py-8 text-center">
                        Aucune école ne correspond à votre recherche.
                    </li>
                )}
            </ul>

            <style jsx>{`
                .school-row {
                    animation: rowIn 0.35s ease-out backwards;
                }
                .badge-pop {
                    display: inline-block;
                    animation: badgePop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes rowIn {
                    from {
                        opacity: 0;
                        transform: translateY(6px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes badgePop {
                    0% {
                        transform: scale(0.5);
                        opacity: 0;
                    }
                    60% {
                        transform: scale(1.15);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1);
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .school-row,
                    .badge-pop {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}