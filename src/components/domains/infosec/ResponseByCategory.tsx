import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Incident } from "@/lib/data";
import { domainBySlug } from "@/lib/domains";
import { AXIS_TICK, GlassTooltip, GRID_STROKE, useFilterKey } from "@/components/widgets/shared";

interface ResponseByCategoryProps {
  incidents: Incident[];
  height?: number;
}

/** Per category — bars = incident count (cyan), line = avg response hours (amber). */
export function ResponseByCategory({ incidents, height = 280 }: ResponseByCategoryProps) {
  const filterKey = useFilterKey();
  const categories = domainBySlug("information-security")?.categories ?? [];

  const data = useMemo(
    () =>
      categories.map((cat) => {
        const rows = incidents.filter((r) => r.category === cat);
        const avgResp = rows.length
          ? Math.round((rows.reduce((a, r) => a + r.responseMinutes, 0) / rows.length / 60) * 10) / 10
          : 0;
        return { name: cat, count: rows.length, avgResp };
      }),
    [incidents, categories],
  );

  return (
    <div key={filterKey}>
      <div style={{ height }} role="img" aria-label="Incident count and average response by category">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 0, bottom: 0, left: -18 }}>
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ ...AXIS_TICK, fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: GRID_STROKE }}
              interval={0}
              angle={-18}
              textAnchor="end"
              height={52}
            />
            <YAxis yAxisId="left" tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) => `${v}h`}
            />
            <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(148,163,184,.06)" }} />
            <Bar
              yAxisId="left"
              dataKey="count"
              name="Incidents"
              fill="#22D3EE"
              fillOpacity={0.9}
              radius={[4, 4, 0, 0]}
              barSize={26}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="avgResp"
              name="Avg Response (h)"
              stroke="#FACC15"
              strokeWidth={2}
              dot={{ r: 3, fill: "#FACC15", stroke: "#0A0E16" }}
              isAnimationActive
              animationDuration={700}
              animationBegin={400}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-x-4 font-mono text-[11px] text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-accent-cyan" /> Incidents
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-sev-medium" /> Avg response (h)
        </span>
      </div>
    </div>
  );
}

export default ResponseByCategory;
