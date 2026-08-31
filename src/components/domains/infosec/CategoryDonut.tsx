import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { CHART_SERIES } from "@/lib/domains";
import type { Incident } from "@/lib/data";
import { categoryCounts } from "@/lib/data";
import { useFilterKey } from "@/components/widgets/shared";

interface CategoryDonutProps {
  incidents: Incident[];
  height?: number;
  /** segment click → cross-filter the incident table */
  onSelectCategory?: (category: string | null) => void;
  activeCategory?: string | null;
}

/** 6 incident categories; center readout = top category, swaps on segment hover (150ms cross-fade). */
export function CategoryDonut({ incidents, height = 260, onSelectCategory, activeCategory }: CategoryDonutProps) {
  const [hover, setHover] = useState<number | null>(null);
  const filterKey = useFilterKey();
  const data = useMemo(() => categoryCounts(incidents, 6), [incidents]);
  const total = data.reduce((a, d) => a + d.value, 0);
  const top = data[0];
  const shown = hover != null ? data[hover] : top;
  const shownPct = total > 0 && shown ? Math.round((shown.value / total) * 100) : 0;

  return (
    <div key={filterKey}>
      <div className="relative" style={{ height }} role="img" aria-label="Incidents by category donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="#0A0E16"
              strokeWidth={2}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              onMouseEnter={(_, i) => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={(_, i) => onSelectCategory?.(activeCategory === data[i].name ? null : data[i].name)}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={CHART_SERIES[i % CHART_SERIES.length]}
                  opacity={hover == null || hover === i ? 1 : 0.3}
                  style={{
                    transform: hover === i ? "scale(1.04)" : "scale(1)",
                    transformOrigin: "center",
                    transition: "transform 200ms ease-out, opacity 200ms",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          {shown && (
            <div key={shown.name} style={{ animation: "filter-morph 150ms ease-out both" }}>
              <div className="font-mono text-[26px] font-semibold leading-none text-text-primary font-tnum">
                {shownPct}%
              </div>
              <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] leading-relaxed text-text-muted">
                {shown.name}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {data.map((d, i) => (
          <button
            key={d.name}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelectCategory?.(activeCategory === d.name ? null : d.name)}
            className={
              activeCategory === d.name
                ? "flex items-center gap-1.5 rounded-full border border-accent-cyan/60 bg-accent-cyan/10 px-2 py-0.5 font-mono text-[11px] text-text-primary"
                : "flex items-center gap-1.5 rounded-full border border-transparent px-2 py-0.5 font-mono text-[11px] text-text-secondary transition-colors hover:text-text-primary"
            }
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: CHART_SERIES[i % CHART_SERIES.length] }}
            />
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default CategoryDonut;
