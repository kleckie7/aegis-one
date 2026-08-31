import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { SectionCard } from "@/components/widgets/SectionCard";
import { bandFor } from "@/components/widgets/RiskGauge";
import { useCountUp, useFilterKey } from "@/components/widgets/shared";
import { SEVERITY_COLORS, type DomainDef, type Severity } from "@/lib/domains";
import { cn } from "@/lib/utils";

export interface DomainStat {
  def: DomainDef;
  score: number;
  open: number;
  total: number;
  worst: Severity | null;
  /** 12-point monthly reported series */
  spark: number[];
}

type SortMode = "risk" | "name" | "open";

const SORTS: { key: SortMode; label: string }[] = [
  { key: "risk", label: "Risk" },
  { key: "name", label: "Name" },
  { key: "open", label: "Open" },
];

function DomainTile({ stat, index }: { stat: DomainStat; index: number }) {
  const navigate = useNavigate();
  const counted = useCountUp(stat.score);
  const band = bandFor(stat.score);
  const Icon = stat.def.icon;
  const filterKey = useFilterKey();
  const sparkData = stat.spark.map((v, i) => ({ i, v }));

  return (
    <motion.button
      layout
      onClick={() => navigate(`/app/${stat.def.slug}`)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{
        layout: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
        opacity: { duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] },
        y: { duration: 0.5, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] },
      }}
      aria-label={`Open ${stat.def.name} dashboard — risk score ${stat.score}`}
      className="group flex flex-col rounded-xl border border-hairline bg-surface-2/40 p-4 text-left transition-shadow duration-300 hover:shadow-glow"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-1"
          style={{ color: stat.def.color }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text-primary">
          {stat.def.name}
        </span>
        {stat.worst && (
          <span
            title={`Worst open severity: ${stat.worst}`}
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: SEVERITY_COLORS[stat.worst] }}
          />
        )}
        <span
          className="shrink-0 font-mono text-[22px] font-semibold leading-none font-tnum"
          style={{ color: band.color }}
        >
          {Math.round(counted)}
        </span>
      </div>
      <div className="mt-2 font-mono text-[11px] text-text-muted font-tnum">
        <span className="text-text-secondary">{stat.open.toLocaleString("en-US")}</span> open
        <span className="mx-1.5 text-text-muted/50">/</span>
        {stat.total.toLocaleString("en-US")} total
      </div>
      <div className="mt-2 h-8 w-full opacity-70 transition-opacity duration-200 group-hover:opacity-100" key={filterKey}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
            <defs>
              <linearGradient id={`tile-spark-${stat.def.slug}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stat.def.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={stat.def.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={stat.def.color}
              strokeWidth={1.5}
              fill={`url(#tile-spark-${stat.def.slug})`}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.button>
  );
}

/** Row 2 — DOMAIN OPERATIONS: 10 domain tiles, FLIP-reordered on sort/filter change */
export function DomainGrid({ stats }: { stats: DomainStat[] }) {
  const [sort, setSort] = useState<SortMode>("risk");

  const sorted = useMemo(() => {
    const arr = [...stats];
    switch (sort) {
      case "risk":
        arr.sort((a, b) => b.score - a.score);
        break;
      case "open":
        arr.sort((a, b) => b.open - a.open);
        break;
      case "name":
        arr.sort((a, b) => a.def.name.localeCompare(b.def.name));
        break;
    }
    return arr;
  }, [stats, sort]);

  return (
    <SectionCard
      title="Domain Operations"
      subtitle="All 10 domains · sorted by live posture"
      menu={false}
      actions={
        <div className="flex items-center gap-1 rounded-lg border border-hairline bg-surface-2/60 p-0.5">
          <span className="px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              aria-pressed={sort === s.key}
              className={cn(
                "rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
                sort === s.key
                  ? "bg-accent-cyan/15 text-accent-cyan"
                  : "text-text-muted hover:text-text-primary",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {sorted.map((stat, i) => (
          <DomainTile key={stat.def.slug} stat={stat} index={i} />
        ))}
      </div>
    </SectionCard>
  );
}

export default DomainGrid;
