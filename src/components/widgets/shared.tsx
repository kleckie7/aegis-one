import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFilterKey } from "@/stores/filterStore";

/** Glass tooltip for Recharts — mono text, surface-2, hairline border */
export function GlassTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number | string; color?: string; payload?: Record<string, unknown> }>;
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/95 px-3 py-2 shadow-xl backdrop-blur-md">
      {label !== undefined && (
        <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">{label}</div>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 font-mono text-xs">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color ?? "#22D3EE" }} />
          <span className="text-text-secondary">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold text-text-primary font-tnum">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Count-up tween for KPI numbers (mono tabular numerals), re-runs when value changes */
export function useCountUp(target: number, duration = 800): number {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4); // out-quart
      const val = from + (target - from) * eased;
      setDisplay(val);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

/**
 * filter-morph wrapper: cross-fades content (opacity .4 -> 1, 250ms)
 * whenever the global filter store changes.
 */
export function FilterMorph({ children, className }: { children: ReactNode; className?: string }) {
  const key = useFilterKey();
  return (
    <div key={key} className={className} style={{ animation: "filter-morph 250ms ease-out both" }}>
      {children}
    </div>
  );
}

/** Recharts-safe key that remounts charts on filter change so chart-draw replays */
export { useFilterKey };

export const AXIS_TICK = { fill: "#5B6B80", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" } as const;
export const GRID_STROKE = "rgba(148,163,184,0.08)";
