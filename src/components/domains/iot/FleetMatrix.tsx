import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useFilterKey } from "@/components/widgets/shared";
import { cn } from "@/lib/utils";
import {
  CELL_STATES,
  buildFleetCells,
  scaledTypes,
  type CellState,
} from "./data";

interface FleetMatrixProps {
  environment: string;
  /** legend click → cross-filter the incident table (null clears) */
  onSelectState?: (state: CellState | null) => void;
  activeState?: CellState | null;
}

/**
 * ⭐ Signature widget — 1,284-device fleet rendered as a dense dot matrix
 * (virtualized to ~321 cells, one per ~4 devices). Color = worst state in the
 * bucket. Rogue dots pulse. Left→right sweep fade-in (~4ms per column).
 */
export function FleetMatrix({ environment, onSelectState, activeState }: FleetMatrixProps) {
  const filterKey = useFilterKey();
  const [hover, setHover] = useState<number | null>(null);
  const { cells, cols } = useMemo(() => buildFleetCells(environment), [environment]);
  const types = useMemo(() => scaledTypes(environment), [environment]);

  const totals = useMemo(() => {
    const t = { healthy: 0, outdated: 0, eol: 0, rogue: 0 };
    for (const ty of types) {
      t.rogue += ty.rogue;
      t.eol += ty.eol;
      t.outdated += ty.outdated;
      t.healthy += Math.max(0, ty.count - ty.rogue - ty.eol - ty.outdated);
    }
    return t;
  }, [types]);

  const hoverInfo = hover != null ? types[cells[hover]?.typeIdx] : null;

  return (
    <div key={filterKey}>
      {/* hover readout */}
      <div className="mb-3 flex h-5 items-center justify-between font-mono text-[11px]">
        {hoverInfo ? (
          <span className="text-text-secondary">
            <span className="text-accent-cyan">{hoverInfo.name}</span>
            <span className="text-text-muted"> · </span>
            {hoverInfo.count.toLocaleString("en-US")} devices
            <span className="text-text-muted"> · </span>
            <span className="text-accent-emerald">
              {Math.round((hoverInfo.current / hoverInfo.count) * 100)}% current
            </span>
            <span className="text-text-muted"> · fw {hoverInfo.firmware}</span>
          </span>
        ) : (
          <span className="uppercase tracking-[0.14em] text-text-muted">
            1 cell ≈ 4 devices · hover to inspect
          </span>
        )}
      </div>

      {/* dot matrix */}
      <div
        role="img"
        aria-label="Device fleet matrix — one dot per ~4 devices, colored by device state"
        className="grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: 5 }}
        onMouseLeave={() => setHover(null)}
      >
        {cells.map((cell, i) => {
          const col = i % cols;
          const color = CELL_STATES.find((s) => s.key === cell.state)?.color ?? "#34D399";
          const isRogue = cell.state === "rogue";
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: cell.state === "healthy" ? 0.55 : 1 }}
              transition={{ delay: 0.15 + (col / cols) * 0.8, duration: 0.3 }}
              onMouseEnter={() => setHover(i)}
              className="aspect-square w-full rounded-[2px] transition-[filter] duration-150"
              style={{
                background: color,
                filter: hover === i ? "brightness(1.9)" : undefined,
                boxShadow:
                  hover === i
                    ? `0 0 10px ${color}`
                    : cell.state === "healthy"
                      ? "none"
                      : `0 0 6px ${color}66`,
                animation: isRogue ? "fleet-rogue-pulse 2s ease-in-out infinite" : undefined,
              }}
            />
          );
        })}
      </div>
      <style>{`@keyframes fleet-rogue-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.25 } }`}</style>

      {/* legend — click a state to cross-filter the table */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {CELL_STATES.map((s) => {
          const active = activeState === s.key;
          return (
            <button
              key={s.key}
              onClick={() => onSelectState?.(active ? null : s.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors",
                active
                  ? "border-accent-cyan/60 bg-accent-cyan/10 text-text-primary"
                  : "border-transparent text-text-secondary hover:border-hairline hover:text-text-primary",
              )}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background: s.color,
                  animation: s.key === "rogue" ? "fleet-rogue-pulse 2s ease-in-out infinite" : undefined,
                }}
              />
              {s.label}
              <span className="font-semibold text-text-primary font-tnum">
                {totals[s.key].toLocaleString("en-US")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FleetMatrix;
