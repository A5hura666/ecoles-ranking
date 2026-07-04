"use client";

import { useMemo } from "react";
import { School } from "@/lib/types";

interface Props {
  /** Liste complète, utilisée uniquement pour construire la liste des
   *  codes postaux disponibles dans le menu déroulant. */
  schools: School[];
  /** Sous-ensemble déjà filtré par MapPanel (recherche + code postal) —
   *  c'est exactement ce qui est affiché ici ET sur la carte, pour que
   *  les deux ne divergent jamais. */
  filteredSchools: School[];
  query: string;
  cp: string;
  onQueryChange: (value: string) => void;
  onCpChange: (value: string) => void;
  rankOf: Map<string, number>;
  selectedId: string;
  onSelect: (id: string) => void;
  onRankChange: (id: string, rank: number | null) => void;
  pointsReady: Record<string, boolean>;
}

export default function MapSidebar({
                                     schools,
                                     filteredSchools,
                                     query,
                                     cp,
                                     onQueryChange,
                                     onCpChange,
                                     rankOf,
                                     selectedId,
                                     onSelect,
                                     onRankChange,
                                     pointsReady,
                                   }: Props) {
  const postalCodes = useMemo(() => {
    const set = new Set(schools.map((s) => s.codePostal).filter(Boolean));
    return Array.from(set).sort();
  }, [schools]);

  return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col gap-2 mb-3">
          <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Rechercher une école, une commune…"
              className="w-full border border-line rounded-sm px-3 py-2 text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-moss/40"
          />
          <select
              value={cp}
              onChange={(e) => onCpChange(e.target.value)}
              className="w-full border border-line rounded-sm px-3 py-2 text-sm bg-white/70 focus:outline-none focus:ring-2 focus:ring-moss/40"
          >
            <option value="">Tous les codes postaux</option>
            {postalCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-ink/50 mb-2 font-mono shrink-0">
          {filteredSchools.length} école{filteredSchools.length !== 1 ? "s" : ""}
        </p>

        <ul className="flex-1 overflow-y-auto flex flex-col gap-1.5 pr-1">
          {filteredSchools.map((s) => {
            const rank = rankOf.get(s.id);
            const ready = !!pointsReady[s.id];
            return (
                <li
                    key={s.id}
                    onClick={() => ready && onSelect(s.id)}
                    className={`border rounded-sm px-3 py-2 transition-colors ${
                        !ready
                            ? "opacity-40 cursor-not-allowed border-line"
                            : "cursor-pointer hover:bg-wheat/50 " +
                            (selectedId === s.id
                                ? "border-clay bg-wheat/60"
                                : rank
                                    ? "border-moss/40 bg-wheat/30"
                                    : "border-line bg-white/50")
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min={1}
                        value={rank ?? ""}
                        placeholder="—"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const v = e.target.value;
                          onRankChange(s.id, v === "" ? null : parseInt(v, 10));
                        }}
                        className="w-11 shrink-0 text-center border border-line rounded-sm py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-moss/40 bg-white"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-[13px] leading-snug text-ink truncate">
                        {s.ecole}
                      </p>
                      <p className="text-[11px] text-ink/55 truncate">
                        {s.commune} · {s.codePostal || "?"}
                      </p>
                    </div>
                  </div>
                </li>
            );
          })}
          {filteredSchools.length === 0 && (
              <li className="text-sm text-ink/50 py-8 text-center">
                Aucune école ne correspond.
              </li>
          )}
        </ul>
      </div>
  );
}