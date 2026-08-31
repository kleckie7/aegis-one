import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SEVERITY_COLORS, type Severity } from "@/lib/domains";
import { AXIS_TICK, GlassTooltip, GRID_STROKE, useFilterKey } from "@/components/widgets/shared";

interface SeverityBarsProps {
  data: { name: Severity; value: number }[];
  height?: number;
}

/** Standard 4-bar vertical severity chart (Critical → Low, severity colors). */
export function SeverityBars({ data, height = 260 }: SeverityBarsProps) {
  const filterKey = useFilterKey();
  return (
    <div style={{ height }} key={filterKey} role="img" aria-label="Incidents by severity">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barCategoryGap="32%">
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(148,163,184,.06)" }} />
          <Bar
            dataKey="value"
            name="Incidents"
            radius={[4, 4, 0, 0]}
            barSize={38}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={SEVERITY_COLORS[d.name]} fillOpacity={0.92} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SeverityBars;
