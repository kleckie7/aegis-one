import { Fragment } from "react";
import { motion } from "framer-motion";
import { MONTH_LABELS } from "@/lib/data";
import { MONTHS } from "@/lib/domains";
import { useFilterKey } from "@/components/widgets/shared";
import { useFilterStore } from "@/stores/filterStore";
import { cn } from "@/lib/utils";

export const POLICY_CHECKS = ["Disk Encryption", "OS Patch ≤14d", "EDR Agent Healthy", "Screen Lock"] as const;

/** deterministic failure rate 0..8 (%) for a (month, check) cell */
export function failureRate(monthIdx: number, checkIdx: number): number {
  const h = Math.sin((monthIdx + 1) * 127.1 + (checkIdx + 1) * 311.7) * 43758.5453;
  const r = h - Math.floor(h);
  return Math.round(r * r * 80) / 10; // skew toward low rates
}

function cellColor(rate: number): string {
  // emerald (0) → amber (~2.5) → rose (8)
  const t = Math.min(1, rate / 8);
  const mid = [
    [52, 211, 153], // emerald
    [251, 191, 36], // amber
    [244, 63, 94], // rose
  ];
  const seg = t < 0.5 ? 0 : 1;
  const local = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const c0 = mid[seg];
  const c1 = mid[seg + 1];
  const c = c0.map((v, i) => Math.round(v + (c1[i] - v) * local));
  return `rgba(${c[0]},${c[1]},${c[2]},${0.25 + t * 0.65})`;
}

/** Signature widget: 12 months × 4 policy checks compliance heat strip */
export function ComplianceHeatStrip() {
  const filterKey = useFilterKey();
  const month = useFilterStore((s) => s.month);
  const setMonth = useFilterStore((s) => s.setMonth);

  return (
    <div key={filterKey}>
      <div className="grid" style={{ gridTemplateColumns: "minmax(90px,auto) repeat(12,1fr)" }}>
        <div />
        {MONTH_LABELS.map((m, i) => {
          const key = MONTHS[i].key;
          const active = month === key;
          return (
            <button
              key={m}
              onClick={() => setMonth(active ? "all" : key)}
              className={cn(
                "pb-1.5 text-center font-mono text-[9px] uppercase tracking-wider transition-colors",
                active ? "text-accent-cyan" : "text-text-muted hover:text-text-secondary",
              )}
            >
              {m}
            </button>
          );
        })}
        {POLICY_CHECKS.map((check, ci) => (
          <Fragment key={check}>
            <div className="flex items-center pr-2 font-mono text-[9px] uppercase tracking-wider text-text-muted">
              {check}
            </div>
            {MONTH_LABELS.map((m, mi) => {
              const rate = failureRate(mi, ci);
              const key = MONTHS[mi].key;
              const active = month === key;
              return (
                <motion.button
                  key={`${check}-${m}`}
                  title={`${m} · ${check} · ${rate.toFixed(1)}% failing`}
                  aria-label={`${m} ${check}: ${rate.toFixed(1)} percent failing`}
                  onClick={() => setMonth(active ? "all" : key)}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: mi * 0.03 + ci * 0.02, duration: 0.3 }}
                  className={cn(
                    "m-px h-6 rounded-[4px] border transition-transform hover:scale-110",
                    active ? "border-accent-cyan" : "border-transparent",
                  )}
                  style={{ background: cellColor(rate) }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 font-mono text-[9px] uppercase tracking-wider text-text-muted">
        <span>0%</span>
        <span className="h-2 w-16 rounded-full" style={{ background: "linear-gradient(90deg,#34D399,#FBBF24,#F43F5E)" }} />
        <span>8% failing</span>
      </div>
    </div>
  );
}

export default ComplianceHeatStrip;
