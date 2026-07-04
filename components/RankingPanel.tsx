"use client";

import { useMemo, useState } from "react";
import { School } from "@/lib/types";
import RankBadge from "./RankBadge";
import SchoolMiniMap from "./SchoolMiniMap";
import { REFERENCE_POINT } from "@/lib/referencePoint";
import { haversineKm } from "@/lib/distance";
import { decodeSchoolType } from "@/lib/schoolType";

interface Props {
    rankedSchools: School[];
    onReorder: (fromIndex: number, toIndex: number) => void;
    onRemove: (id: string) => void;
    onMove: (index: number, dir: -1 | 1) => void;
    onSelectSchool?: (id: string) => void;
}

function StatCard({
                      label,
                      value,
                      sub,
                  }: {
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div className="border border-line rounded-sm bg-white/60 px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide font-mono text-ink/40 mb-1">
                {label}
            </p>
            <p className="font-display text-sm text-ink truncate" title={value}>
                {value}
            </p>
            {sub && <p className="text-[11px] text-ink/45 font-mono mt-0.5">{sub}</p>}
        </div>
    );
}

export default function RankingPanel({
                                         rankedSchools,
                                         onReorder,
                                         onRemove,
                                         onMove,
                                         onSelectSchool,
                                     }: Props) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    const distances = useMemo(
        () =>
            rankedSchools.map((s) => ({
                s,
                d:
                    s.latitude && s.longitude
                        ? haversineKm(REFERENCE_POINT.lat, REFERENCE_POINT.lon, s.latitude, s.longitude)
                        : null,
            })),
        [rankedSchools]
    );

    const stats = useMemo(() => {
        const withDist = distances.filter(
            (x): x is { s: School; d: number } => x.d !== null
        );
        const avg = withDist.length
            ? withDist.reduce((sum, x) => sum + x.d, 0) / withDist.length
            : null;
        const closest = withDist.length
            ? withDist.reduce((a, b) => (a.d < b.d ? a : b))
            : null;
        const farthest = withDist.length
            ? withDist.reduce((a, b) => (a.d > b.d ? a : b))
            : null;

        const byNiveau = new Map<string, number>();
        rankedSchools.forEach((s) => {
            const key = s.niveau || "Non précisé";
            byNiveau.set(key, (byNiveau.get(key) || 0) + 1);
        });

        return { avg, closest, farthest, byNiveau };
    }, [distances, rankedSchools]);

    if (rankedSchools.length === 0) {
        return (
            <div className="max-w-5xl mx-auto px-5 md:px-8 py-16 text-center">
                <p className="text-ink/50 text-sm">
                    Votre classement est vide. Allez dans « Toutes les écoles » pour en
                    ajouter.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-5 md:px-8 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 no-print">
                <StatCard label="Écoles classées" value={String(rankedSchools.length)} />
                <StatCard
                    label="Distance moyenne"
                    value={stats.avg !== null ? `≈ ${stats.avg.toFixed(1)} km` : "—"}
                />
                <StatCard
                    label="Plus proche"
                    value={stats.closest ? stats.closest.s.ecole : "—"}
                    sub={stats.closest ? `${stats.closest.d.toFixed(1)} km` : undefined}
                />
                <StatCard
                    label="Plus éloignée"
                    value={stats.farthest ? stats.farthest.s.ecole : "—"}
                    sub={stats.farthest ? `${stats.farthest.d.toFixed(1)} km` : undefined}
                />
            </div>

            {stats.byNiveau.size > 1 && (
                <div className="flex flex-wrap gap-1.5 mb-4 no-print">
                    {[...stats.byNiveau.entries()].map(([niveau, count]) => (
                        <span
                            key={niveau}
                            className="text-[11px] font-mono px-2 py-1 rounded-full border border-line text-ink/60 bg-white/50"
                        >
                            {niveau} · {count}
                        </span>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <p className="text-xs text-ink/50 font-mono">
                    Glissez-déposez pour réordonner, ou utilisez les flèches.
                </p>
                <div className="flex items-center gap-4 text-xs text-ink/50 no-print">
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
            </div>

            <ul className="flex flex-col gap-3">
                {rankedSchools.map((s, i) => {
                    const distanceKm = distances[i]?.d ?? null;
                    const typeInfo = decodeSchoolType(s.ecole);
                    const isDragging = dragIndex === i;

                    return (
                        <li
                            key={s.id}
                            draggable
                            title={`${s.adresse}, ${s.codePostal} ${s.commune}`}
                            onDragStart={() => setDragIndex(i)}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setOverIndex(i);
                            }}
                            onDragEnd={() => {
                                if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
                                    onReorder(dragIndex, overIndex);
                                }
                                setDragIndex(null);
                                setOverIndex(null);
                            }}
                            className={`ranking-row flex flex-col sm:flex-row gap-3 border rounded-sm p-3 bg-white/60 cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                isDragging ? "opacity-50 scale-[0.99]" : "hover:shadow-md"
                            } ${
                                overIndex === i && dragIndex !== null && dragIndex !== i
                                    ? "border-clay bg-wheat/60"
                                    : "border-line"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="badge-pop">
                                    <RankBadge n={i + 1} />
                                </span>
                                {s.latitude && s.longitude ? (
                                    <SchoolMiniMap
                                        lat={s.latitude}
                                        lon={s.longitude}
                                        onSelect={onSelectSchool ? () => onSelectSchool(s.id) : undefined}
                                    />
                                ) : (
                                    <span className="w-full h-40 sm:w-56 sm:h-44 shrink-0 rounded-sm border border-line bg-wheat/20" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-display text-[15px] leading-snug text-ink">
                                        {s.ecole}
                                    </p>
                                    {typeInfo && (
                                        <span className="text-[10px] uppercase tracking-wide font-medium text-moss border border-moss/40 rounded-full px-2 py-0.5">
                          {typeInfo.label}
                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-ink/60">
                                    {s.commune}
                                    {s.niveau ? ` · ${s.niveau}` : ""} ·{" "}
                                    <span className="font-mono">{s.circo.replace(/^IEN\s+/, "")}</span>
                                </p>
                                <div className="flex items-center gap-2">
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

                            <div className="flex items-center gap-1 no-print shrink-0 self-start sm:self-center">
                                <button
                                    onClick={() => onMove(i, -1)}
                                    disabled={i === 0}
                                    aria-label="Monter"
                                    className="w-7 h-7 flex items-center justify-center rounded-sm border border-line text-ink/60 hover:text-moss hover:border-moss disabled:opacity-30 disabled:hover:text-ink/60 disabled:hover:border-line transition-colors"
                                >
                                    ↑
                                </button>
                                <button
                                    onClick={() => onMove(i, 1)}
                                    disabled={i === rankedSchools.length - 1}
                                    aria-label="Descendre"
                                    className="w-7 h-7 flex items-center justify-center rounded-sm border border-line text-ink/60 hover:text-moss hover:border-moss disabled:opacity-30 disabled:hover:text-ink/60 disabled:hover:border-line transition-colors"
                                >
                                    ↓
                                </button>
                                <button
                                    onClick={() => onRemove(s.id)}
                                    aria-label="Retirer"
                                    className="w-7 h-7 flex items-center justify-center rounded-sm border border-line text-ink/60 hover:text-clay hover:border-clay ml-1 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>

            <style jsx>{`
                .ranking-row {
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
                    .ranking-row,
                    .badge-pop {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}