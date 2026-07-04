"use client";

interface HeaderProps {
  total: number;
  ranked: number;
  onExport: () => void;
  onReset: () => void;
}

export default function Header({ total, ranked, onExport, onReset }: HeaderProps) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="max-w-5xl mx-auto px-5 md:px-8 pt-8 pb-6">
        <div className="flex items-baseline justify-between gap-4 flex-wrap">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-moss/70 mb-1">
              Voeux d&apos;affectation &middot; {ranked}/{total} classées
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-medium text-ink leading-tight">
              Mon classement d&apos;écoles
            </h1>
          </div>
          <div className="flex gap-2 no-print">
            <button
              onClick={onReset}
              className="font-sans text-sm px-3 py-2 rounded-sm border border-line text-ink/70 hover:text-clay hover:border-clay/60 transition-colors"
            >
              Réinitialiser
            </button>
            <button
              onClick={onExport}
              className="font-sans text-sm px-4 py-2 rounded-sm bg-moss text-paper hover:bg-mossdark transition-colors"
            >
              Exporter en Excel
            </button>
          </div>
        </div>
        <p className="text-ink/60 text-sm mt-3 max-w-2xl">
          Parcourez la liste, ajoutez vos écoles à votre classement dans l&apos;ordre
          de préférence, puis visualisez-les sur la carte. Tout est enregistré
          automatiquement sur cet appareil.
        </p>
      </div>
    </header>
  );
}
