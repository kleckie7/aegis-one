import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MONTHS } from "@/lib/domains";
import type { FilterState } from "@/lib/data";
import { useFilters } from "@/stores/filterStore";

const QUARTER_LABELS: Record<string, string> = {
  Q1: "Q1 2025",
  Q2: "Q2 2025",
  Q3: "Q3 2025",
  Q4: "Q4 2025",
};

function filterSummary(f: FilterState): string {
  const month =
    f.month === "all"
      ? "All months"
      : (QUARTER_LABELS[f.month] ?? MONTHS.find((m) => m.key === f.month)?.label ?? f.month);
  const env = f.environment === "all" ? "All environments" : f.environment;
  const team = f.team === "all" ? "All teams" : f.team;
  const parts = [month, env, team];
  if (f.severity !== "all") parts.push(`${f.severity} only`);
  return parts.join(" · ");
}

/** Row 0 — page title, live filter summary, ticking clock + sync status */
export function PageHeader() {
  const filters = useFilters();
  const summary = filterSummary(filters);

  const [now, setNow] = useState(() => new Date());
  const [syncAgo, setSyncAgo] = useState(12);
  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date());
      setSyncAgo((s) => (s >= 59 ? 0 : s + 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-end justify-between gap-4"
    >
      <div className="min-w-0">
        <h2 className="font-display text-[28px] font-bold leading-tight tracking-[-0.03em] text-text-primary">
          Command <span className="text-gradient">Center</span>
        </h2>
        <motion.p
          key={summary}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted"
        >
          Unified posture · All 10 domains · {summary}
        </motion.p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-mono text-lg font-semibold leading-none text-text-primary font-tnum">
            {now.toISOString().slice(11, 19)}
            <span className="ml-1 text-[11px] font-normal text-text-muted">UTC</span>
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            Last sync: {syncAgo}s ago
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-accent-cyan animate-glow-pulse" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-cyan">
            Live
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default PageHeader;
