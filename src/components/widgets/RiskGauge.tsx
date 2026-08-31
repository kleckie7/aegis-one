import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { useCountUp, useFilterKey } from "./shared";

interface RiskGaugeProps {
  score: number; // 0–100
  label?: string;
  size?: number;
}

const BANDS = [
  { max: 30, color: "#34D399", label: "LOW" },
  { max: 55, color: "#FACC15", label: "GUARDED" },
  { max: 75, color: "#FB923C", label: "ELEVATED" },
  { max: 100, color: "#F43F5E", label: "SEVERE" },
];

export function bandFor(score: number) {
  return BANDS.find((b) => score <= b.max) ?? BANDS[BANDS.length - 1];
}

export function RiskGauge({ score, label = "RISK SCORE", size = 220 }: RiskGaugeProps) {
  const counted = useCountUp(score, 900);
  const band = bandFor(score);
  const filterKey = useFilterKey();
  const data = [{ name: "risk", value: score, fill: band.color }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.62 }} key={filterKey}>
        <ResponsiveContainer width="100%" height={size} >
          <RadialBarChart
            cx="50%"
            cy="72%"
            innerRadius="72%"
            outerRadius="100%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "#151D2C" }}
              dataKey="value"
              cornerRadius={10}
              angleAxisId={0}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
          <div
            className="font-mono font-semibold leading-none text-text-primary font-tnum"
            style={{ fontSize: size >= 200 ? 32 : 24 }}
          >
            {Math.round(counted)}
          </div>
          <div
            className="mt-1 font-mono uppercase tracking-[0.18em]"
            style={{ color: band.color, fontSize: size >= 200 ? 11 : 9 }}
          >
            {band.label}
          </div>
        </div>
      </div>
      <div
        className="mt-3 flex items-center gap-3 font-mono uppercase tracking-wider text-text-muted"
        style={{ fontSize: size >= 200 ? 11 : 9 }}
      >
        {BANDS.map((b) => (
          <span key={b.label} className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: b.color }} />
            {b.label.split("")[0]}
          </span>
        ))}
        <span className="text-text-muted/60">{label}</span>
      </div>
    </div>
  );
}

export default RiskGauge;
