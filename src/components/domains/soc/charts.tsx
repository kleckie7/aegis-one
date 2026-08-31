import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, GRID_STROKE, GlassTooltip, useFilterKey } from "@/components/widgets/shared";

/* ------------------------------------------------------------------ */
/* Alert Volume Radar — this month vs last month per alert type        */
/* ------------------------------------------------------------------ */

export interface RadarPoint {
  type: string;
  current: number;
  previous: number;
}

export function AlertRadar({ data, height = 300 }: { data: RadarPoint[]; height?: number }) {
  const filterKey = useFilterKey();
  return (
    <div style={{ height }} key={filterKey} role="img" aria-label="Alert volume radar by type">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke={GRID_STROKE} />
          <PolarAngleAxis dataKey="type" tick={{ ...AXIS_TICK, fontSize: 10 }} />
          <PolarRadiusAxis tick={false} axisLine={false} domain={[0, "dataMax"]} />
          <Tooltip content={<GlassTooltip />} />
          <Radar
            name="Last month"
            dataKey="previous"
            stroke="#64748B"
            strokeDasharray="4 4"
            fill="#64748B"
            fillOpacity={0.1}
            isAnimationActive
            animationDuration={800}
          />
          <Radar
            name="This month"
            dataKey="current"
            stroke="#22D3EE"
            strokeWidth={2}
            fill="#22D3EE"
            fillOpacity={0.25}
            isAnimationActive
            animationDuration={800}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 font-mono text-[11px] text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-accent-cyan" /> This month
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#64748B]" /> Last month
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MTTD / MTTR trend — volume bars + MTTD/MTTR lines + target lines    */
/* ------------------------------------------------------------------ */

export interface ResponsePoint {
  month: string;
  volume: number;
  mttd: number; // minutes
  mttr: number; // minutes
}

export function MttdMttrTrend({ data, height = 280 }: { data: ResponsePoint[]; height?: number }) {
  const filterKey = useFilterKey();
  return (
    <div style={{ height }} key={filterKey} role="img" aria-label="MTTD and MTTR trend vs alert volume">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
          <YAxis yAxisId="vol" tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
          <YAxis
            yAxisId="time"
            orientation="right"
            tick={{ ...AXIS_TICK, fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => (v >= 60 ? `${Math.round(v / 60)}h` : `${v}m`)}
          />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(148,163,184,.06)" }} />
          <ReferenceLine
            yAxisId="time"
            y={15}
            stroke="#34D399"
            strokeDasharray="5 4"
            label={{ value: "MTTD target 15m", fill: "#34D399", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", position: "insideTopLeft" }}
          />
          <ReferenceLine
            yAxisId="time"
            y={240}
            stroke="#FBBF24"
            strokeDasharray="5 4"
            label={{ value: "MTTR target 4h", fill: "#FBBF24", fontSize: 9, fontFamily: "'JetBrains Mono', monospace", position: "insideTopRight" }}
          />
          <Bar
            yAxisId="vol"
            dataKey="volume"
            name="Alert volume"
            fill="#22D3EE"
            fillOpacity={0.55}
            radius={[3, 3, 0, 0]}
            barSize={14}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          />
          <Line
            yAxisId="time"
            type="monotone"
            dataKey="mttd"
            name="MTTD (min)"
            stroke="#34D399"
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={700}
            animationBegin={300}
            animationEasing="ease-out"
          />
          <Line
            yAxisId="time"
            type="monotone"
            dataKey="mttr"
            name="MTTR (min)"
            stroke="#FBBF24"
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={700}
            animationBegin={300}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
