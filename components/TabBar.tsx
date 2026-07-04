"use client";

export type TabKey = "list" | "ranking" | "map";

const TABS: { key: TabKey; label: string }[] = [
  { key: "list", label: "Toutes les écoles" },
  { key: "ranking", label: "Mon classement" },
  { key: "map", label: "Carte" },
];

export default function TabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 no-print">
      <nav className="flex gap-6 border-b border-line">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`relative py-3 text-sm font-medium transition-colors ${
              active === tab.key ? "text-moss" : "text-ink/50 hover:text-ink/80"
            }`}
          >
            {tab.label}
            {active === tab.key && (
              <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-moss rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
