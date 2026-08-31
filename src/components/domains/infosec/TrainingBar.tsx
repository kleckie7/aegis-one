import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, GlassTooltip, GRID_STROKE, useFilterKey } from "@/components/widgets/shared";
import { DEPARTMENTS, TRAINING_TARGET } from "./data";

/** Awareness-training completion by department, with a dashed 95% target marker. */
export function TrainingBar({ height = 300 }: { height?: number }) {
  const filterKey = useFilterKey();
  const data = DEPARTMENTS.map((d) => ({ name: d.name, completion: d.completion }));

  return (
    <div key={filterKey}>
      <div style={{ height }} role="img" aria-label="Security awareness training completion by department">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" horizontal={false} />
            <XAxis
              type="number"
              domain={[88, 100]}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={112}
              tick={{ ...AXIS_TICK, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<GlassTooltip />}
              cursor={{ fill: "rgba(148,163,184,.06)" }}
              formatter={(value: number) => [`${value}%`, "Completion"]}
            />
            <ReferenceLine
              x={TRAINING_TARGET}
              stroke="#FACC15"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: `TARGET ${TRAINING_TARGET}%`,
                position: "top",
                fill: "#FACC15",
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            />
            <Bar
              dataKey="completion"
              name="Completion"
              radius={[0, 4, 4, 0]}
              barSize={15}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            >
              {data.map((d) => (
                <Cell
                  key={d.name}
                  fill={d.completion < TRAINING_TARGET ? "#FACC15" : "#22D3EE"}
                  fillOpacity={0.92}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-x-4 font-mono text-[11px] text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-accent-cyan" /> At / above target
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-sev-medium" /> Below target
        </span>
      </div>
    </div>
  );
}

export default TrainingBar;
