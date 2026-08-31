import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useCountUp, useFilterKey } from "./shared";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: number;
  /** format the counted value; default rounds to int */
  format?: (v: number) => string;
  /** % delta vs previous period — positive = up */
  delta?: number | null;
  /** invert delta semantics (e.g. for MTTR, down is good) */
  invertDelta?: boolean;
  suffix?: string;
  spark?: number[];
  icon?: LucideIcon;
}

export function KpiCard({
  label,
  value,
  format,
  delta,
  invertDelta = false,
  suffix,
  spark,
  icon: Icon,
}: KpiCardProps) {
  const counted = useCountUp(value);
  const filterKey = useFilterKey();
  const shown = format ? format(counted) : Math.round(counted).toLocaleString("en-US");
  const good = delta != null && (invertDelta ? delta < 0 : delta > 0);
  const sparkData = (spark ?? []).map((v, i) => ({ i, v }));

  return (
    <div className="group rounded-xl border border-hairline bg-surface-1 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            {label}
          </div>
          <div className="mt-2 font-mono text-[30px] font-semibold leading-none text-text-primary font-tnum">
            {shown}
            {suffix && <span className="ml-1 text-base text-text-secondary">{suffix}</span>}
          </div>
          {delta != null && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 font-mono text-xs",
                good ? "text-accent-emerald" : "text-sev-critical",
              )}
            >
              {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
              <span className="ml-1 text-[10px] text-text-muted">vs prev</span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {Icon && (
            <div className="rounded-lg border border-hairline bg-surface-2 p-2 text-accent-cyan shadow-[0_0_16px_rgba(34,211,238,.12)]">
              <Icon className="h-4 w-4" />
            </div>
          )}
          {sparkData.length > 1 && (
            <div className="h-7 w-16" key={filterKey}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                  <defs>
                    <linearGradient id={`spark-${label.replace(/\W/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="#22D3EE"
                    strokeWidth={1.5}
                    fill={`url(#spark-${label.replace(/\W/g, "")})`}
                    isAnimationActive
                    animationDuration={700}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KpiCard;
