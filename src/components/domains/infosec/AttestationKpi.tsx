import { useEffect, useState } from "react";
import { FileLock2 } from "lucide-react";
import { useCountUp, useFilterKey } from "@/components/widgets/shared";
import { POLICY_AVG } from "./data";

/**
 * Policy-attestation KPI — same card shell as KpiCard, with a thin progress
 * ring that fills to the attestation %.
 */
export function AttestationKpi() {
  const filterKey = useFilterKey();
  const counted = useCountUp(POLICY_AVG);
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    setFilled(false);
    const t = window.setTimeout(() => setFilled(true), 60);
    return () => window.clearTimeout(t);
  }, [filterKey]);

  const r = 22;
  const c = 2 * Math.PI * r;

  return (
    <div className="group rounded-xl border border-hairline bg-surface-1 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Policy Attestation
          </div>
          <div className="mt-2 font-mono text-[30px] font-semibold leading-none text-text-primary font-tnum">
            {Math.round(counted)}
            <span className="ml-1 text-base text-text-secondary">%</span>
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            12 policies tracked
          </div>
        </div>
        <div className="relative shrink-0">
          <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
            <circle cx="28" cy="28" r={r} fill="none" stroke="#151D2C" strokeWidth="5" />
            <circle
              cx="28"
              cy="28"
              r={r}
              fill="none"
              stroke="#34D399"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={filled ? c * (1 - POLICY_AVG / 100) : c}
              style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-accent-emerald">
            <FileLock2 className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttestationKpi;
