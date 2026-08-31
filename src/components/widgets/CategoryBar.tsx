import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK, GlassTooltip, GRID_STROKE, useFilterKey } from "./shared";

interface CategoryBarProps {
  data: { name: string; value: number; resolved?: number }[];
  height?: number;
  color?: string;
}

export function CategoryBar({ data, height = 260, color = "#22D3EE" }: CategoryBarProps) {
  const filterKey = useFilterKey();
  return (
    <div style={{ height }} key={filterKey} role="img" aria-label="Top categories bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ ...AXIS_TICK, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(148,163,184,.06)" }} />
          <Bar
            dataKey="value"
            name="Count"
            radius={[0, 4, 4, 0]}
            barSize={14}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={color} fillOpacity={0.9} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CategoryBar;
