"use client";

import { useMemo, useState } from "react";
import schoolsData from "@/data/schools.json";
import { School } from "@/lib/types";
import { useRankingStorage } from "@/lib/storage";
import { exportRankingToExcel } from "@/lib/exportExcel";
import Header from "@/components/Header";
import TabBar, { TabKey } from "@/components/TabBar";
import AllSchoolsPanel from "@/components/AllSchoolsPanel";
import RankingPanel from "@/components/RankingPanel";
import MapPanelLoader from "@/components/MapPanelLoader";
import ConfirmDialog from "@/components/ConfirmDialog";

const schools = schoolsData as School[];

export default function Home() {
  const [tab, setTab] = useState<TabKey>("list");
  const { ranking, setRanking, hydrated } = useRankingStorage();
  const [focusSchoolId, setFocusSchoolId] = useState<string | undefined>();
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const schoolById = useMemo(() => {
    const map = new Map<string, School>();
    schools.forEach((s) => map.set(s.id, s));
    return map;
  }, []);

  const rankedSchools = useMemo(
      () => ranking.map((id) => schoolById.get(id)).filter(Boolean) as School[],
      [ranking, schoolById]
  );

  function toggle(id: string) {
    setRanking((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function remove(id: string) {
    setRanking((prev) => prev.filter((x) => x !== id));
  }

  function move(index: number, dir: -1 | 1) {
    setRanking((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function reorder(fromIndex: number, toIndex: number) {
    setRanking((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  // Set a school's rank directly to a chosen number (1-based). Anything
  // already occupying that slot (and everything after it) shifts down by
  // one, the same way inserting a card into a stack would.
  function setRankAt(id: string, rank: number | null) {
    setRanking((prev) => {
      const withoutId = prev.filter((x) => x !== id);
      if (rank === null) return withoutId;
      const index = Math.min(Math.max(rank - 1, 0), withoutId.length);
      const next = [...withoutId];
      next.splice(index, 0, id);
      return next;
    });
  }

  function selectAll() {
    setRanking((prev) => {
      const next = [...prev];
      schools.forEach((s) => {
        if (!next.includes(s.id)) next.push(s.id);
      });
      return next;
    });
  }

  function selectSchoolOnMap(id: string) {
    setFocusSchoolId(id);
    setTab("map");
  }

  // Les deux actions ("Tout désélectionner" et "Réinitialiser") mènent à la
  // même conséquence destructrice : on les fait passer par la même popup de
  // confirmation plutôt que par window.confirm.
  function requestClear() {
    setConfirmClearOpen(true);
  }

  function confirmClear() {
    setRanking([]);
    setConfirmClearOpen(false);
  }

  if (!hydrated) {
    return (
        <div className="min-h-screen flex items-center justify-center text-ink/40 text-sm">
          Chargement…
        </div>
    );
  }

  return (
      <div className="min-h-screen">
        <Header
            total={schools.length}
            ranked={ranking.length}
            onExport={() => exportRankingToExcel(rankedSchools)}
            onReset={requestClear}
        />
        <TabBar active={tab} onChange={setTab} />

        {tab === "list" && (
            <AllSchoolsPanel
                schools={schools}
                ranking={ranking}
                onToggle={toggle}
                onSelectAll={selectAll}
                onDeselectAll={requestClear}
                onSelectSchool={selectSchoolOnMap}
            />
        )}
        {tab === "ranking" && (
            <RankingPanel
                rankedSchools={rankedSchools}
                onReorder={reorder}
                onRemove={remove}
                onMove={move}
                onSelectSchool={selectSchoolOnMap}
            />
        )}
        {tab === "map" && (
            <MapPanelLoader
                schools={schools}
                ranking={ranking}
                onRankChange={setRankAt}
                focusId={focusSchoolId}
            />
        )}

        <footer className="max-w-5xl mx-auto px-5 md:px-8 py-10 text-xs text-ink/40 no-print">
          Données enregistrées uniquement dans ce navigateur (localStorage). Aucune
          information n&apos;est envoyée à un serveur, hormis les requêtes de
          géolocalisation des adresses (OpenStreetMap) pour la carte.
        </footer>

        <ConfirmDialog
            open={confirmClearOpen}
            title="Vider le classement ?"
            description="Toutes les écoles actuellement classées seront retirées. Cette action est irréversible."
            confirmLabel="Vider le classement"
            destructive
            onConfirm={confirmClear}
            onCancel={() => setConfirmClearOpen(false)}
        />
      </div>
  );
}