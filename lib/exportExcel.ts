import * as XLSX from "xlsx";
import { School } from "./types";

export function exportRankingToExcel(rankedSchools: School[]) {
  const rows = rankedSchools.map((s, i) => ({
    Rang: i + 1,
    "Ecole ratt.": s.ecole,
    "Commune ratt.": s.commune,
    "RNE circo": s.rne,
    Circonscription: s.circo,
    Niveau: s.niveau,
    Adresse: s.adresse,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 22 },
    { wch: 12 },
    { wch: 24 },
    { wch: 12 },
    { wch: 38 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Classement");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `classement-ecoles-${date}.xlsx`);
}
