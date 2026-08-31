import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEVERITY_COLORS, type Severity } from "@/lib/domains";
import { AXIS_TICK, GRID_STROKE, GlassTooltip, useFilterKey } from "@/components/widgets/shared";
import { useFilterStore } from "@/stores/filterStore";

interface SeverityBarsProps {
  data: { name: Severity; value: number }[];
  height?: number;
}

/** Vertical severity bars in the 4 severity colors; click sets the global severity filter */
export function SeverityBars({ data, height = 240 }: SeverityBarsProps) {
  const filterKey = useFilterKey();
  const severity = useFilterStore((s) => s.severity);
  const setSeverity = useFilterStore((s) => s.setSeverity);

  return (
    <div style={{ height }} key={filterKey} role="img" aria-label="Incidents by severity">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(148,163,184,.06)" }} />
          <Bar
            dataKey="value"
            name="Incidents"
            radius={[4, 4, 0, 0]}
            barSize={30}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
            onClick={(d) => {
              const name = (d as unknown as { name?: Severity }).name;
              if (name) setSeverity(severity === name ? "all" : name);
            }}
            className="cursor-pointer"
          >
            <LabelList
              dataKey="value"
              position="top"
              style={{ fill: "#94A3B8", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
            />
            {data.map((d) => (
              <Cell
                key={d.name}
                fill={SEVERITY_COLORS[d.name]}
                opacity={severity === "all" || severity === d.name ? 1 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SeverityBars;
