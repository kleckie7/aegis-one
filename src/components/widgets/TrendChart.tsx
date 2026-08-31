import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/data";
import { AXIS_TICK, GlassTooltip, GRID_STROKE, useFilterKey } from "./shared";

interface TrendChartProps {
  data: TrendPoint[];
  height?: number;
}

export function TrendChart({ data, height = 280 }: TrendChartProps) {
  const filterKey = useFilterKey();
  return (
    <div style={{ height }} key={filterKey} role="img" aria-label="Reported vs resolved trend by month">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id="trendReported" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<GlassTooltip />} cursor={{ stroke: "rgba(148,163,184,.25)" }} />
          <Area
            type="monotone"
            dataKey="reported"
            name="Reported"
            stroke="#22D3EE"
            strokeWidth={2}
            fill="url(#trendReported)"
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="resolved"
            name="Resolved"
            stroke="#34D399"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#34D399", stroke: "#0A0E16" }}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendChart;
