import { motion } from "framer-motion";
import { useFilterKey } from "@/components/widgets/shared";
import { cn } from "@/lib/utils";

export interface HBarItem {
  name: string;
  value: number;
  /** resolved/done portion rendered as emerald overlay inside the bar */
  resolved?: number;
  color?: string;
  /** animated shimmer sweep (attention demand, e.g. weaponized / ransomware) */
  shimmer?: boolean;
}

interface HBarListProps {
  items: HBarItem[];
  /** format the value label (default: int) */
  format?: (v: number) => string;
  onItemClick?: (name: string) => void;
  maxRows?: number;
}

/**
 * Div-based horizontal bar list — per-item colors, optional emerald "resolved"
 * overlay (the original Excel resolved-vs-total encoding) and shimmer highlight.
 */
export function HBarList({ items, format, onItemClick }: HBarListProps) {
  const filterKey = useFilterKey();
  const max = Math.max(1, ...items.map((i) => i.value));
  const fmt = format ?? ((v: number) => v.toLocaleString("en-US"));

  return (
    <div className="space-y-3" key={filterKey}>
      {items.map((item, idx) => {
        const pct = (item.value / max) * 100;
        const resPct = item.resolved != null ? Math.min(100, (item.resolved / Math.max(1, item.value)) * 100) : null;
        const color = item.color ?? "#22D3EE";
        return (
          <motion.button
            key={item.name}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onItemClick?.(item.name)}
            className={cn(
              "group block w-full text-left",
              onItemClick ? "cursor-pointer" : "cursor-default",
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate font-mono text-[11px] uppercase tracking-wider text-text-secondary transition-colors group-hover:text-text-primary">
                {item.name}
              </span>
              <span className="shrink-0 font-mono text-xs font-semibold text-text-primary font-tnum">
                {fmt(item.value)}
                {item.resolved != null && (
                  <span className="ml-1.5 text-[10px] font-normal text-accent-emerald">
                    {fmt(item.resolved)} done
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="relative h-full rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pct / 100 }}
                transition={{ delay: 0.1 + idx * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  transformOrigin: "left",
                  background: resPct != null ? `${color}55` : color,
                }}
              >
                {resPct != null && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-accent-emerald"
                    style={{ width: `${resPct}%` }}
                  />
                )}
                {item.shimmer && (
                  <div
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      background:
                        "linear-gradient(100deg, transparent 20%, rgba(232,238,246,.35) 50%, transparent 80%)",
                      backgroundSize: "200% 100%",
                      animation: "hbar-shimmer 3s linear infinite",
                    }}
                  />
                )}
              </motion.div>
            </div>
          </motion.button>
        );
      })}
      <style>{`@keyframes hbar-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -100% 0; } }`}</style>
    </div>
  );
}

export default HBarList;
