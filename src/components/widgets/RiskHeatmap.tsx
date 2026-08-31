import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useFilterKey } from "./shared";
import { cn } from "@/lib/utils";

interface RiskHeatmapProps {
  /** rows: impact 5..1 top→bottom, cols: likelihood 1..5 */
  grid: number[][];
  onCellClick?: (likelihood: number, impact: number) => void;
}

function cellColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "#151D2C";
  const t = Math.sqrt(count / max); // sqrt scale
  // interpolate surface-2 (#151D2C) -> rose (#F43F5E)
  const c0 = [21, 29, 44];
  const c1 = [244, 63, 94];
  const c = c0.map((v, i) => Math.round(v + (c1[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function RiskHeatmap({ grid, onCellClick }: RiskHeatmapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const filterKey = useFilterKey();
  const max = useMemo(() => Math.max(1, ...grid.flat()), [grid]);

  const handleClick = (l: number, i: number) => {
    const key = `${l}-${i}`;
    const next = selected === key ? null : key;
    setSelected(next);
    onCellClick?.(l, i);
  };

  return (
    <div key={filterKey}>
      {selected && (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-3 py-1 font-mono text-[11px] text-accent-cyan">
          Cell filter: L{selected.split("-")[0]} × I{selected.split("-")[1]}
          <button
            aria-label="Clear cell filter"
            onClick={() => setSelected(null)}
            className="rounded-full p-0.5 hover:bg-accent-cyan/20"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-1 pr-1 text-right font-mono text-[10px] uppercase text-text-muted">
          {[5, 4, 3, 2, 1].map((i) => (
            <span key={i} className="flex h-full items-center">I{i}</span>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-5 gap-1.5">
          {grid.map((row, ri) =>
            row.map((count, ci) => {
              const likelihood = ci + 1;
              const impact = 5 - ri;
              const key = `${likelihood}-${impact}`;
              const isSel = selected === key;
              return (
                <button
                  key={key}
                  title={`${count} incidents · L${likelihood} × I${impact}`}
                  aria-label={`${count} incidents, likelihood ${likelihood}, impact ${impact}`}
                  onClick={() => handleClick(likelihood, impact)}
                  className={cn(
                    "flex aspect-[2/1] items-center justify-center rounded-md border font-mono text-xs font-tnum transition-all duration-200 hover:scale-[1.04] hover:border-accent-cyan/50",
                    isSel ? "border-accent-cyan shadow-glow" : "border-hairline/60",
                    count === 0 ? "text-text-muted/50" : "text-text-primary",
                  )}
                  style={{ background: cellColor(count, max) }}
                >
                  {count > 0 ? count : ""}
                </button>
              );
            }),
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between pl-7 font-mono text-[10px] uppercase text-text-muted">
        {[1, 2, 3, 4, 5].map((l) => (
          <span key={l}>L{l}</span>
        ))}
      </div>
      <div className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted/60">
        Likelihood × Impact
      </div>
    </div>
  );
}

export default RiskHeatmap;
