export default function RankBadge({ n }: { n: number }) {
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-moss text-moss font-display font-semibold text-sm shrink-0 select-none"
      style={{ transform: "rotate(-2deg)" }}
    >
      {n}
    </span>
  );
}
