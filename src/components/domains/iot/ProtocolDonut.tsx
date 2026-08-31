import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { useFilterKey } from "@/components/widgets/shared";
import { INSECURE_SHARE, PROTOCOLS, TOTAL_DEVICES, scaledCount } from "./data";

interface ProtocolDonutProps {
  environment: string;
  height?: number;
}

/** Protocol share of device traffic — insecure protocols tinted toward rose, center = insecure %. */
export function ProtocolDonut({ environment, height = 260 }: ProtocolDonutProps) {
  const [active, setActive] = useState<number | null>(null);
  const filterKey = useFilterKey();
  const total = scaledCount(TOTAL_DEVICES, environment);
  const data = useMemo(
    () =>
      PROTOCOLS.map((p) => ({
        name: p.name,
        value: Math.max(1, Math.round((p.share / 100) * total)),
        color: p.color,
        insecure: p.insecure,
      })),
    [total],
  );
  const center = active != null ? data[active] : null;

  return (
    <div key={filterKey}>
      <div className="relative" style={{ height }} role="img" aria-label="Protocol breakdown donut">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="#0A0E16"
              strokeWidth={2}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {data.map((d, i) => (
                <Cell
                  key={d.name}
                  fill={d.color}
                  opacity={active == null || active === i ? 1 : 0.3}
                  style={{
                    transform: active === i ? "scale(1.04)" : "scale(1)",
                    transformOrigin: "center",
                    transition: "transform 200ms ease-out, opacity 200ms",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          {center ? (
            <>
              <div className="font-mono text-[26px] font-semibold leading-none text-text-primary font-tnum">
                {center.value.toLocaleString("en-US")}
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: center.color }}>
                {center.name}
              </div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                {center.insecure ? "insecure" : "encrypted"} · {Math.round((center.value / total) * 100)}%
              </div>
            </>
          ) : (
            <>
              <div className="font-mono text-[26px] font-semibold leading-none text-sev-high font-tnum">
                {INSECURE_SHARE}%
              </div>
              <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
                insecure traffic
              </div>
            </>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        {data.map((d, i) => (
          <button
            key={d.name}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:text-text-primary"
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: d.color }} />
            {d.name}
            {d.insecure && <span className="text-[9px] uppercase text-sev-high">insecure</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ProtocolDonut;
