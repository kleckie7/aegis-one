import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_TICK, GlassTooltip, GRID_STROKE, useFilterKey } from "./shared";

interface TeamBarProps {
  data: { team: string; reported: number; resolved: number }[];
  height?: number;
}

export function TeamBar({ data, height = 280 }: TeamBarProps) {
  const filterKey = useFilterKey();
  return (
    <div style={{ height }} key={filterKey} role="img" aria-label="Reported vs resolved per team">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis
            dataKey="team"
            tick={{ ...AXIS_TICK, fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={52}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(148,163,184,.06)" }} />
          <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94A3B8" }} />
          <Bar dataKey="reported" name="Reported" fill="#22D3EE" radius={[4, 4, 0, 0]} barSize={12} isAnimationActive animationDuration={700} animationEasing="ease-out" />
          <Bar dataKey="resolved" name="Resolved" fill="#34D399" radius={[4, 4, 0, 0]} barSize={12} isAnimationActive animationDuration={700} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TeamBar;
