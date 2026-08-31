import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { STATUS_COLORS, type Status } from "@/lib/domains";
import { useFilterKey } from "./shared";

interface StatusDonutProps {
  data: { name: Status; value: number }[];
  height?: number;
}

export function StatusDonut({ data, height = 240 }: StatusDonutProps) {
  const [active, setActive] = useState<number | null>(null);
  const filterKey = useFilterKey();
  const total = data.reduce((a, d) => a + d.value, 0);
  const center = active != null ? data[active] : null;

  return (
    <div className="relative" style={{ height }} key={filterKey} role="img" aria-label="Status share donut">
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
          >
            {data.map((d, i) => (
              <Cell
                key={d.name}
                fill={STATUS_COLORS[d.name]}
                opacity={active == null || active === i ? 1 : 0.35}
                style={{
                  transform: active === i ? "scale(1.04)" : "scale(1)",
                  transformOrigin: "center",
                  transition: "transform 200ms ease-out, opacity 200ms",
                  cursor: "pointer",
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-mono text-[28px] font-semibold leading-none text-text-primary font-tnum">
          {(center ? center.value : total).toLocaleString("en-US")}
        </div>
        <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
          {center ? center.name : "TOTAL"}
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[d.name] }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default StatusDonut;
