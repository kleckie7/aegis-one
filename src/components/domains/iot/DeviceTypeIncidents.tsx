import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Incident } from "@/lib/data";
import { AXIS_TICK, GlassTooltip, GRID_STROKE, useFilterKey } from "@/components/widgets/shared";
import { DEVICE_TYPES, deviceTypeForIncident } from "./data";

interface DeviceTypeIncidentsProps {
  incidents: Incident[];
  height?: number;
}

/** Incidents per device class — resolved (emerald) vs unresolved (cyan) stacked encoding. */
export function DeviceTypeIncidents({ incidents, height = 260 }: DeviceTypeIncidentsProps) {
  const filterKey = useFilterKey();
  const data = useMemo(() => {
    const map = new Map<string, { name: string; resolved: number; open: number }>(
      DEVICE_TYPES.map((t) => [t.name, { name: t.name, resolved: 0, open: 0 }]),
    );
    for (const r of incidents) {
      const t = deviceTypeForIncident(r.id);
      const row = map.get(t.name);
      if (!row) continue;
      if (r.status === "Resolved") row.resolved++;
      else row.open++;
    }
    return [...map.values()].sort((a, b) => b.resolved + b.open - (a.resolved + a.open));
  }, [incidents]);

  return (
    <div style={{ height }} key={filterKey} role="img" aria-label="Incidents by device type">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={118}
            tick={{ ...AXIS_TICK, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(148,163,184,.06)" }} />
          <Bar
            dataKey="resolved"
            name="Resolved"
            stackId="dt"
            fill="#34D399"
            barSize={14}
            isAnimationActive
            animationDuration={700}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="open"
            name="Open / In Progress"
            stackId="dt"
            fill="#22D3EE"
            radius={[0, 4, 4, 0]}
            barSize={14}
            isAnimationActive
            animationDuration={700}
            animationBegin={150}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DeviceTypeIncidents;
