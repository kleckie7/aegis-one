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
import { AXIS_TICK, GlassTooltip, GRID_STROKE, useFilterKey } from "@/components/widgets/shared";
import { scaledTypes } from "./data";

interface FirmwareStackProps {
  environment: string;
  height?: number;
}

/** Stacked vertical bars per device type — Current / Outdated / End-of-Life. */
export function FirmwareStack({ environment, height = 280 }: FirmwareStackProps) {
  const filterKey = useFilterKey();
  const data = useMemo(
    () =>
      scaledTypes(environment).map((t) => ({
        name: t.short,
        full: t.name,
        Current: t.current,
        Outdated: t.outdated,
        "End-of-Life": t.eol,
      })),
    [environment],
  );

  return (
    <div key={filterKey}>
      <div style={{ height }} role="img" aria-label="Firmware status by device type">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }} barCategoryGap="28%">
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="name" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
            <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(148,163,184,.06)" }} />
            <Bar
              dataKey="Current"
              stackId="fw"
              fill="#34D399"
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="Outdated"
              stackId="fw"
              fill="#FACC15"
              isAnimationActive
              animationDuration={600}
              animationBegin={150}
              animationEasing="ease-out"
            />
            <Bar
              dataKey="End-of-Life"
              stackId="fw"
              fill="#F43F5E"
              radius={[3, 3, 0, 0]}
              isAnimationActive
              animationDuration={600}
              animationBegin={300}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-x-4 font-mono text-[11px] text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-accent-emerald" /> Current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-sev-medium" /> Outdated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-sev-critical" /> End-of-Life
        </span>
      </div>
    </div>
  );
}

export default FirmwareStack;
