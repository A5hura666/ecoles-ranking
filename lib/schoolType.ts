// lib/schoolType.ts

/** Décode le type d'établissement à partir du préfixe conventionnel du nom
 *  (ex: "E.E.PU MARCEL PAGNOL" -> "Élémentaire"). Nomenclature classique
 *  de l'Éducation nationale :
 *    E.M. = École Maternelle
 *    E.E. = École Élémentaire
 *    E.P. = École Primaire (maternelle + élémentaire réunies)
 *    E.A. = École d'Application (accueille des stagiaires enseignants)
 *  suivi de PU (publique) ou PR (privée).
 */

const TYPE_LABELS: Record<string, string> = {
    EM: "Maternelle",
    EE: "Élémentaire",
    EP: "Primaire",
    EA: "Application",
};

export interface SchoolTypeInfo {
    label: string;
    isPublic: boolean | null;
}

export function decodeSchoolType(ecole: string): SchoolTypeInfo | null {
    const match = ecole.trim().match(/^E\.([MEPA])\.(PU|PR)/i);
    if (!match) return null;

    const [, code, sector] = match;
    const label = TYPE_LABELS[code.toUpperCase()];
    if (!label) return null;

    return { label, isPublic: sector.toUpperCase() === "PU" };
}