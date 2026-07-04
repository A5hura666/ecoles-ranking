"use client";

import dynamic from "next/dynamic";
import { School } from "@/lib/types";

const MapPanel = dynamic(() => import("./MapPanel"), {
  ssr: false,
  loading: () => (
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-16 text-center text-sm text-ink/50">
        Chargement de la carte...
      </div>
  ),
});

export default function MapPanelLoader({
                                         schools,
                                         ranking,
                                         onRankChange,
                                         focusId,
                                       }: {
  schools: School[];
  ranking: string[];
  onRankChange: (id: string, rank: number | null) => void;
  focusId?: string;
}) {
  return <MapPanel schools={schools} ranking={ranking} onRankChange={onRankChange} focusId={focusId} />;
}