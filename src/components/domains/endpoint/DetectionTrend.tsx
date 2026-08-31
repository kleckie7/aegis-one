import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/data";
import { AXIS_TICK, GRID_STROKE, GlassTooltip, useFilterKey } from "@/components/widgets/shared";

/** EDR detections vs remediations, with the Sep outbreak marker */
export function DetectionTrend({ data, height = 280 }: { data: TrendPoint[]; height?: number }) {
  const filterKey = useFilterKey();
  const sep = data.find((d) => d.month === "Sep");
  return (
    <div style={{ height }} key={filterKey} role="img" aria-label="EDR detections vs remediations by month">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id="endDetections" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<GlassTooltip />} cursor={{ stroke: "rgba(148,163,184,.25)" }} />
          {sep && sep.reported > 0 && (
            <ReferenceLine
              x="Sep"
              stroke="#F43F5E"
              strokeDasharray="5 4"
              label={{
                value: `WannaMine campaign — ${sep.reported} detections`,
                fill: "#F43F5E",
                fontSize: 9,
                fontFamily: "'JetBrains Mono', monospace",
                position: "top",
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="reported"
            name="Detections"
            stroke="#22D3EE"
            strokeWidth={2}
            fill="url(#endDetections)"
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          />
          <Line
            type="monotone"
            dataKey="resolved"
            name="Remediations"
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

export default DetectionTrend;
