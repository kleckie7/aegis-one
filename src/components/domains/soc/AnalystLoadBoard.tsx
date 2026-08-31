import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Incident } from "@/lib/data";
import { useFilterKey } from "@/components/widgets/shared";
import { cn } from "@/lib/utils";
import { ANALYSTS, SHIFT_COLORS, analystFor, hashId, type Shift } from "./analysts";

interface AnalystLoadBoardProps {
  incidents: Incident[];
  onAnalystClick?: (analystId: number | null) => void;
  activeAnalyst?: number | null;
}

interface AnalystLoad {
  id: number;
  name: string;
  shift: Shift;
  open: number;
  closedToday: number;
  avgHandle: number;
  escalations: number;
}

function loadColor(open: number): string {
  if (open <= 3) return "#34D399";
  if (open <= 7) return "#FBBF24";
  return "#F43F5E";
}

/** 18-analyst load board — 6×3 chips, group by shift / load, FLIP reorder */
export function AnalystLoadBoard({ incidents, onAnalystClick, activeAnalyst }: AnalystLoadBoardProps) {
  const [groupBy, setGroupBy] = useState<"shift" | "load">("shift");
  const [hovered, setHovered] = useState<number | null>(null);
  const filterKey = useFilterKey();

  const loads = useMemo<AnalystLoad[]>(() => {
    const open = new Map<number, number>();
    for (const r of incidents) {
      if (r.status !== "Resolved") {
        const a = analystFor(r);
        open.set(a.id, (open.get(a.id) ?? 0) + 1);
      }
    }
    return ANALYSTS.map((a) => {
      const h = hashId(`analyst-${a.id}`);
      return {
        id: a.id,
        name: a.name,
        shift: a.shift,
        open: open.get(a.id) ?? 0,
        closedToday: 2 + Math.floor(h * 12),
        avgHandle: 12 + Math.floor(h * 28),
        escalations: Math.floor(h * 4),
      };
    });
  }, [incidents]);

  const ordered = useMemo(() => {
    const arr = [...loads];
    if (groupBy === "load") arr.sort((a, b) => b.open - a.open);
    else arr.sort((a, b) => a.shift.localeCompare(b.shift) || b.open - a.open);
    return arr;
  }, [loads, groupBy]);

  const maxOpen = Math.max(1, ...loads.map((l) => l.open));

  return (
    <div key={filterKey}>
      <div className="mb-4 flex items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Group by:</span>
        {(["shift", "load"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGroupBy(g)}
            className={cn(
              "rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
              groupBy === g
                ? "border-accent-cyan/60 bg-accent-cyan/10 text-accent-cyan"
                : "border-hairline text-text-secondary hover:text-text-primary",
            )}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {ordered.map((a, i) => (
          <motion.div
            key={a.id}
            layout
            layoutId={`analyst-${a.id}`}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.35, layout: { duration: 0.3 } }}
            className="relative"
          >
            <button
              type="button"
              onClick={() => onAnalystClick?.(activeAnalyst === a.id ? null : a.id)}
              onMouseEnter={() => setHovered(a.id)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "w-full rounded-lg border bg-surface-2/50 p-3 text-left transition-colors",
                activeAnalyst === a.id ? "border-accent-cyan/60 shadow-glow" : "border-hairline/60 hover:border-accent-cyan/30",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-1 font-mono text-[10px] font-semibold text-accent-cyan">
                  {a.name.split(". ").map((p) => p[0]).join("")}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-xs text-text-primary">{a.name}</div>
                  <div className="flex items-center gap-1 font-mono text-[9px] uppercase text-text-muted">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: SHIFT_COLORS[a.shift] }} />
                    {a.shift}
                  </div>
                </div>
                <span className="ml-auto font-mono text-sm font-semibold text-text-primary font-tnum">{a.open}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-1">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: a.open / maxOpen }}
                  transition={{ duration: 0.5, delay: 0.1 + Math.min(i * 0.03, 0.4) }}
                  style={{ transformOrigin: "left", background: loadColor(a.open) }}
                />
              </div>
            </button>
            {hovered === a.id && (
              <div className="pointer-events-none absolute -top-12 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-hairline bg-surface-2/95 px-3 py-1.5 font-mono text-[10px] text-text-secondary shadow-xl backdrop-blur-md">
                Closed today {a.closedToday} · Avg handle {a.avgHandle}m · Escalations {a.escalations}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default AnalystLoadBoard;
