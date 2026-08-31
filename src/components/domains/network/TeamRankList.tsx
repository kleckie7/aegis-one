import { motion } from "framer-motion";
import { useFilterKey } from "@/components/widgets/shared";

interface TeamRankListProps {
  data: { team: string; reported: number; resolved: number }[];
}

/** Ranked team list — mono count, proportional bar, resolution-rate %, BEST chip on top */
export function TeamRankList({ data }: TeamRankListProps) {
  const filterKey = useFilterKey();
  const ranked = [...data].sort((a, b) => {
    const ra = a.reported ? a.resolved / a.reported : 0;
    const rb = b.reported ? b.resolved / b.reported : 0;
    return rb - ra || b.reported - a.reported;
  });
  const max = Math.max(1, ...ranked.map((d) => d.reported));

  return (
    <div className="space-y-2.5" key={filterKey}>
      {ranked.map((d, i) => {
        const rate = d.reported ? Math.round((d.resolved / d.reported) * 100) : 0;
        return (
          <motion.div
            key={d.team}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3"
          >
            <span className="w-4 shrink-0 text-right font-mono text-[10px] text-text-muted font-tnum">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs text-text-secondary">
                  {d.team}
                  {i === 0 && (
                    <span className="ml-2 rounded-full border border-accent-emerald/40 bg-accent-emerald/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-accent-emerald">
                      Best
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-text-primary font-tnum">
                  {d.reported} <span className="text-text-muted">· {rate}%</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className="h-full rounded-full bg-accent-cyan/80"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: d.reported / max }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: "left" }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default TeamRankList;
