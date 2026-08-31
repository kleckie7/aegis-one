import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { X } from "lucide-react";
import { Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { FilterMorph, useCountUp, useFilterKey } from "@/components/widgets/shared";
import { RiskGauge } from "@/components/widgets/RiskGauge";
import { cn } from "@/lib/utils";
import { useState } from "react";

/* ------------------------------------------------------------------ */
/* Deterministic hash for page-local enrichment of synthetic records   */
/* ------------------------------------------------------------------ */

export function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/* ------------------------------------------------------------------ */
/* Rise-in motion presets                                              */
/* ------------------------------------------------------------------ */

export const riseContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export const riseItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

/** Grid cell: rise-in on mount, filter-morph cross-fade on global filter change */
export function GridCell({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div variants={riseItem} className={className}>
      <FilterMorph className="h-full">{children}</FilterMorph>
    </motion.div>
  );
}

/** Domain page header: eyebrow + title + descriptor */
export function DomainHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <motion.header variants={riseContainer} initial="hidden" animate="show" className="mb-4">
      <motion.p variants={riseItem} className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent-cyan">
        {eyebrow}
      </motion.p>
      <motion.h2 variants={riseItem} className="mt-1.5 font-display text-[28px] font-semibold leading-tight tracking-tight text-text-primary">
        {title}
      </motion.h2>
      <motion.p variants={riseItem} className="mt-1 max-w-2xl text-sm text-text-secondary">
        {description}
      </motion.p>
    </motion.header>
  );
}

/* ------------------------------------------------------------------ */
/* Local chip filter pill                                              */
/* ------------------------------------------------------------------ */

export function LocalChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-3 py-1 font-mono text-[11px] text-accent-cyan">
      {label}
      <button aria-label={`Clear ${label} filter`} onClick={onClear} className="rounded-full p-0.5 hover:bg-accent-cyan/20">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* KPI card with a mini radial ring (posture / compliance style)       */
/* ------------------------------------------------------------------ */

export function bandColorForPct(pct: number): string {
  if (pct >= 85) return "#34D399";
  if (pct >= 75) return "#22D3EE";
  if (pct >= 60) return "#FACC15";
  if (pct >= 45) return "#FB923C";
  return "#F43F5E";
}

export function RingKpi({
  label,
  value,
  suffix = "%",
  sub,
  color,
}: {
  label: string;
  value: number; // 0–100
  suffix?: string;
  sub?: string;
  color?: string;
}) {
  const counted = useCountUp(value, 800);
  const filterKey = useFilterKey();
  const ringColor = color ?? bandColorForPct(value);
  return (
    <div className="flex h-full items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-1 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
      <div className="min-w-0">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">{label}</div>
        <div className="mt-2 font-mono text-[30px] font-semibold leading-none text-text-primary font-tnum">
          {Math.round(counted)}
          {suffix && <span className="ml-0.5 text-base text-text-secondary">{suffix}</span>}
        </div>
        {sub && <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">{sub}</div>}
      </div>
      <div className="relative h-16 w-16 shrink-0" key={filterKey}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" data={[{ v: value }]} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "#151D2C" }}
              dataKey="v"
              cornerRadius={8}
              fill={ringColor}
              angleAxisId={0}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[11px] font-semibold text-text-primary font-tnum">
          {Math.round(counted)}%
        </div>
      </div>
    </div>
  );
}

/** KPI card wrapping the shared RiskGauge */
export function GaugeKpi({ score, label = "Risk Score" }: { score: number; label?: string }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-hairline bg-surface-1 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
      <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">{label}</div>
      <div className="mt-1 flex flex-1 items-center justify-center">
        <RiskGauge score={score} size={128} label={label} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ColorDonut — generic donut with custom colors + segment click        */
/* ------------------------------------------------------------------ */

export interface DonutDatum {
  name: string;
  value: number;
}

export function ColorDonut({
  data,
  colors,
  height = 240,
  centerLabel = "TOTAL",
  centerValue,
  centerSub,
  onSelect,
  selected,
}: {
  data: DonutDatum[];
  colors: Record<string, string>;
  height?: number;
  centerLabel?: string;
  centerValue?: string | number;
  centerSub?: string;
  onSelect?: (name: string) => void;
  selected?: string | null;
}) {
  const [active, setActive] = useState<number | null>(null);
  const filterKey = useFilterKey();
  const total = data.reduce((a, d) => a + d.value, 0);
  const hover = active != null ? data[active] : null;

  return (
    <div key={filterKey} role="img" aria-label={`${centerLabel} donut chart`}>
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              stroke="#0A0E16"
              strokeWidth={2}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={(_, i) => onSelect?.(data[i].name)}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={colors[d.name] ?? "#64748B"}
                  opacity={
                    selected && selected !== d.name ? 0.3 : active == null || active === i ? 1 : 0.35
                  }
                  style={{
                    transform: active === i ? "scale(1.04)" : "scale(1)",
                    transformOrigin: "center",
                    transition: "transform 200ms ease-out, opacity 200ms",
                    cursor: onSelect ? "pointer" : "default",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-[28px] font-semibold leading-none text-text-primary font-tnum">
            {hover ? hover.value.toLocaleString("en-US") : centerValue ?? total.toLocaleString("en-US")}
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
            {hover ? hover.name : centerLabel}
          </div>
          {!hover && centerSub && (
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-text-muted/60">{centerSub}</div>
          )}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <button
            key={d.name}
            onClick={() => onSelect?.(d.name)}
            className={cn(
              "flex items-center gap-1.5 font-mono text-[11px] text-text-secondary",
              onSelect && "cursor-pointer hover:text-accent-cyan",
            )}
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: colors[d.name] ?? "#64748B" }} />
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RankedBars — div-based horizontal bars (clickable, optional stack)   */
/* ------------------------------------------------------------------ */

export interface RankedBarItem {
  name: string;
  value: number;
  /** resolved sub-count rendered as emerald overlay */
  resolved?: number;
  /** rose highlight for top-risk row */
  highlight?: boolean;
  /** mono sub-label rendered under the name */
  sub?: string;
  /** tooltip line */
  hint?: string;
}

export function RankedBars({
  items,
  onSelect,
  selected,
  color = "#22D3EE",
}: {
  items: RankedBarItem[];
  onSelect?: (name: string) => void;
  selected?: string | null;
  color?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const barColor = item.highlight ? "#F43F5E" : color;
        const isSel = selected === item.name;
        return (
          <button
            key={item.name}
            title={item.hint}
            onClick={() => onSelect?.(item.name)}
            className={cn(
              "group block w-full rounded-lg border border-transparent px-2 py-1.5 text-left transition-colors",
              onSelect && "hover:border-hairline hover:bg-surface-2/60",
              isSel && "border-accent-cyan/40 bg-accent-cyan/5",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className={cn("truncate text-xs", isSel ? "text-accent-cyan" : "text-text-secondary")}>{item.name}</span>
                {item.highlight && (
                  <span className="shrink-0 rounded-full border border-sev-critical/50 bg-sev-critical/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-sev-critical">
                    Top risk
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono text-xs text-text-primary font-tnum">
                {item.value.toLocaleString("en-US")}
                {item.resolved != null && (
                  <span className="ml-1.5 text-[10px] text-accent-emerald">{item.resolved} res</span>
                )}
              </span>
            </div>
            {item.sub && <div className="mt-0.5 font-mono text-[10px] text-text-muted">{item.sub}</div>}
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="relative h-full rounded-full"
                style={{ background: barColor, opacity: 0.85, transformOrigin: "left" }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: item.value / max }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                {item.resolved != null && item.value > 0 && (
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-accent-emerald"
                    style={{ width: `${Math.min(100, (item.resolved / item.value) * 100)}%` }}
                  />
                )}
              </motion.div>
            </div>
          </button>
        );
      })}
      {items.length === 0 && (
        <div className="py-8 text-center font-mono text-xs text-text-muted">No data for the current filters.</div>
      )}
    </div>
  );
}
