"use client";

import dynamic from "next/dynamic";
import { useInView } from "@/lib/useInView";
import { REFERENCE_POINT } from "@/lib/referencePoint";

const MiniMap = dynamic(() => import("./MiniMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-wheat/20 animate-pulse" />,
});

interface Props {
    lat: number;
    lon: number;
    onSelect?: () => void;
    className?: string;
}

/** Mini-carte partagée entre AllSchoolsPanel et RankingPanel : montée
 *  seulement au scroll dans le viewport, et cliquable pour centrer la
 *  carte principale sur l'école (overlay au survol/focus).
 *
 *  `pointer-events-none` sur le wrapper de MiniMap : Leaflet intercepte et
 *  stoppe la propagation du clic natif sur son propre conteneur DOM, donc
 *  sans ça le onClick posé ci-dessous ne reçoit jamais l'événement. Comme
 *  la mini-carte n'a aucune interaction propre (zoom/pan/drag tous
 *  désactivés dans MiniMap), on peut la neutraliser sans rien perdre.
 *
 *  `draggable={false}` sur le conteneur externe évite par ailleurs
 *  d'interférer avec le drag natif de la ligne entière dans RankingPanel. */
export default function SchoolMiniMap({ lat, lon, onSelect, className = "" }: Props) {
    const { ref, inView } = useInView<HTMLDivElement>();
    const sizeClasses =
        className || "h-40 flex-1 min-w-0 sm:flex-none sm:w-56 sm:h-44";

    return (
        <div
            ref={ref}
            draggable={false}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (onSelect && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect();
                }
            }}
            className={`group relative shrink-0 rounded-sm overflow-hidden border border-line bg-wheat/20 ${
                onSelect ? "cursor-pointer" : ""
            } ${sizeClasses}`}
        >
            {inView ? (
                <div className="w-full h-full pointer-events-none">
                    <MiniMap
                        destLat={lat}
                        destLon={lon}
                        refLat={REFERENCE_POINT.lat}
                        refLon={REFERENCE_POINT.lon}
                    />
                </div>
            ) : (
                <div className="w-full h-full bg-wheat/20 animate-pulse" />
            )}

            {onSelect && (
                <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-ink/0 group-hover:bg-ink/40 group-focus-visible:bg-ink/40 text-paper text-xs font-medium opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all pointer-events-none">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" />
                        <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    Voir sur la carte
                </div>
            )}
        </div>
    );
}