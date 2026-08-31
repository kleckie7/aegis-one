import { motion } from "framer-motion";
import { useFilterKey } from "@/components/widgets/shared";
import { cn } from "@/lib/utils";
import { DROPOFF_REASONS, STAGES, type Stage } from "./analysts";

interface TriageFunnelProps {
  /** cumulative counts per stage index (stage k = records with stage >= k+1) */
  counts: number[];
  activeStage: Stage | null;
  onStageClick: (stage: Stage | null) => void;
}

/** Signature SOC funnel — trapezoid bars shrinking left→right, cyan→emerald */
export function TriageFunnel({ counts, activeStage, onStageClick }: TriageFunnelProps) {
  const filterKey = useFilterKey();
  const max = Math.max(1, counts[0] ?? 1);

  return (
    <div className="space-y-2" key={filterKey}>
      {STAGES.map((stage, i) => {
        const count = counts[i] ?? 0;
        const pct = (count / max) * 100;
        const prev = i > 0 ? counts[i - 1] ?? 0 : 0;
        const conv = i > 0 && prev > 0 ? Math.round((count / prev) * 100) : 100;
        const active = activeStage === stage;
        return (
          <motion.button
            key={stage}
            type="button"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onStageClick(active ? null : stage)}
            title={`Drop-off: ${DROPOFF_REASONS[stage].join(" · ")}`}
            className={cn(
              "group block w-full rounded-lg border p-2 text-left transition-all",
              active
                ? "border-accent-cyan/60 bg-accent-cyan/10 shadow-glow"
                : "border-hairline/60 hover:border-accent-cyan/30",
            )}
          >
            <div className="flex items-baseline justify-between gap-3 px-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary group-hover:text-text-primary">
                {i + 1}. {stage}
              </span>
              <span className="font-mono text-sm font-semibold text-text-primary font-tnum">
                {count.toLocaleString("en-US")}
                {i > 0 && (
                  <span className="ml-2 text-[10px] font-normal text-text-muted">→ {conv}%</span>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-7 overflow-hidden rounded-md bg-surface-2/70">
              <motion.div
                className="flex h-full items-center rounded-md"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: Math.max(0.02, pct / 100) }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  transformOrigin: "left",
                  background: `linear-gradient(90deg, #22D3EE ${100 - i * 22}%, #34D399)`,
                  opacity: 0.85,
                }}
              >
                <span className="px-2 font-mono text-[10px] font-semibold text-abyss font-tnum">
                  {Math.round((count / max) * 100)}%
                </span>
              </motion.div>
            </div>
            <div className="mt-1 hidden px-1 font-mono text-[9px] text-text-muted/70 group-hover:block">
              Drop-off: {DROPOFF_REASONS[stage].slice(0, 3).join(" · ")}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

export default TriageFunnel;
