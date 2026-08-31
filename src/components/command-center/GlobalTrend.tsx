import { useEffect, useRef, useState } from "react";
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/data";
import { AXIS_TICK, GlassTooltip, GRID_STROKE } from "@/components/widgets/shared";
import { useFilterStore } from "@/stores/filterStore";
import { cn } from "@/lib/utils";

/** map the global month filter to a brush [startIndex, endIndex] over 12 months */
function idxFromMonth(month: string): [number, number] {
  if (month === "all") return [0, 11];
  if (/^Q[1-4]$/.test(month)) {
    const q = Number(month[1]) - 1;
    return [q * 3, q * 3 + 2];
  }
  const m = new Date(`${month}-15T00:00:00Z`).getUTCMonth();
  return [m, m];
}

/** snap a brushed range to the nearest expressible month filter */
function monthFromRange(start: number, end: number): string {
  if (start <= 0 && end >= 11) return "all";
  if (start === end) return `2025-${String(start + 1).padStart(2, "0")}`;
  if (end - start === 2 && start % 3 === 0) return `Q${start / 3 + 1}`;
  const mid = Math.round((start + end) / 2);
  return `2025-${String(mid + 1).padStart(2, "0")}`;
}

interface GlobalTrendProps {
  data: TrendPoint[];
  height?: number;
}

/**
 * Row 3 (left) — org-wide reported vs resolved trend.
 * The brush under the axis doubles as the global Month filter: dragging it
 * (debounced) commits a month / quarter / all selection to the filter store.
 */
export function GlobalTrend({ data, height = 300 }: GlobalTrendProps) {
  const month = useFilterStore((s) => s.month);
  const setMonth = useFilterStore((s) => s.setMonth);
  const [range, setRange] = useState<[number, number]>(() => idxFromMonth(month));
  const [showReported, setShowReported] = useState(true);
  const [showResolved, setShowResolved] = useState(true);
  const commitRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // sync the brush when the month filter changes from elsewhere (topbar, ⌘K)
  useEffect(() => {
    setRange(idxFromMonth(month));
  }, [month]);

  useEffect(() => () => clearTimeout(commitRef.current), []);

  const onBrush = (b: { startIndex?: number; endIndex?: number }) => {
    if (b.startIndex == null || b.endIndex == null) return;
    setRange([b.startIndex, b.endIndex]);
    clearTimeout(commitRef.current);
    commitRef.current = setTimeout(() => {
      setMonth(monthFromRange(b.startIndex as number, b.endIndex as number));
    }, 320);
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button
          onClick={() => setShowReported((v) => !v)}
          aria-pressed={showReported}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-all duration-200",
            showReported
              ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan"
              : "border-hairline text-text-muted opacity-50 hover:opacity-80",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-accent-cyan" />
          Reported
        </button>
        <button
          onClick={() => setShowResolved((v) => !v)}
          aria-pressed={showResolved}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-all duration-200",
            showResolved
              ? "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald"
              : "border-hairline text-text-muted opacity-50 hover:opacity-80",
          )}
        >
          <span className="h-2 w-2 rounded-full bg-accent-emerald" />
          Resolved
        </button>
        <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted/70 sm:inline">
          Drag brush to filter months
        </span>
      </div>
      <div style={{ height }} role="img" aria-label="Organization-wide reported vs resolved incidents by month, with month range brush">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
            <defs>
              <linearGradient id="ccTrendReported" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
            <Tooltip content={<GlassTooltip />} cursor={{ stroke: "rgba(148,163,184,.25)" }} />
            {showReported && (
              <Area
                type="monotone"
                dataKey="reported"
                name="Reported"
                stroke="#22D3EE"
                strokeWidth={2}
                fill="url(#ccTrendReported)"
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
            )}
            {showResolved && (
              <Line
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#34D399"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#34D399", stroke: "#0A0E16" }}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
            )}
            <Brush
              dataKey="month"
              height={26}
              stroke="#1E2A3A"
              fill="rgba(16,22,35,0.7)"
              travellerWidth={8}
              startIndex={range[0]}
              endIndex={range[1]}
              onChange={onBrush}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default GlobalTrend;
