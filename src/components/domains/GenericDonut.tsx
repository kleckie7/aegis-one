import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useCountUp, useFilterKey } from "@/components/widgets/shared";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface GenericDonutProps {
  data: DonutSlice[];
  height?: number;
  /** center content when nothing is hovered */
  centerValue?: string;
  centerLabel?: string;
  /** format hovered slice value inside the center (default: locale number) */
  formatValue?: (v: number) => string;
  onSegmentClick?: (name: string) => void;
  /** names currently selected (rendered full opacity, others dimmed) */
  selectedName?: string | null;
  ariaLabel?: string;
}

/** Configurable donut (environment split, patch status, shifts, OS, response actions) */
export function GenericDonut({
  data,
  height = 240,
  centerValue,
  centerLabel = "TOTAL",
  formatValue,
  onSegmentClick,
  selectedName = null,
  ariaLabel = "Distribution donut",
}: GenericDonutProps) {
  const [active, setActive] = useState<number | null>(null);
  const filterKey = useFilterKey();
  const total = data.reduce((a, d) => a + d.value, 0);
  const center = active != null ? data[active] : null;
  const fmt = formatValue ?? ((v: number) => v.toLocaleString("en-US"));

  return (
    <div className="relative" style={{ height }} key={filterKey} role="img" aria-label={ariaLabel}>
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
            onClick={(_, i) => onSegmentClick?.(data[i].name)}
          >
            {data.map((d, i) => (
              <Cell
                key={d.name}
                fill={d.color}
                opacity={
                  (active == null || active === i) && (selectedName == null || selectedName === d.name)
                    ? 1
                    : 0.35
                }
                style={{
                  transform: active === i ? "scale(1.04)" : "scale(1)",
                  transformOrigin: "center",
                  transition: "transform 200ms ease-out, opacity 200ms",
                  cursor: onSegmentClick ? "pointer" : "default",
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style={{ bottom: 28 }}>
        <div className="font-mono text-[26px] font-semibold leading-none text-text-primary font-tnum">
          {center ? fmt(center.value) : (centerValue ?? fmt(total))}
        </div>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
          {center ? center.name : centerLabel}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <button
            key={d.name}
            onClick={() => onSegmentClick?.(d.name)}
            className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:text-accent-cyan"
            style={{ cursor: onSegmentClick ? "pointer" : "default" }}
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color }} />
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GenericDonut;

/** Donut center value that tweens (e.g. percentages) */
export function DonutCenterCount({ value, format }: { value: number; format: (v: number) => string }) {
  const counted = useCountUp(value, 800);
  return <>{format(counted)}</>;
}
