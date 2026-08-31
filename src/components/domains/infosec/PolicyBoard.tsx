import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useFilterKey } from "@/components/widgets/shared";
import { cn } from "@/lib/utils";
import { POLICIES, POLICIES_ON_TRACK } from "./data";

/**
 * ⭐ Signature widget — 12-policy attestation board. Bars emerald, amber under
 * 85%, overdue policies get a rose chip. Rows stagger 40ms, bars scaleX 600ms.
 */
export function PolicyBoard() {
  const filterKey = useFilterKey();

  return (
    <div key={filterKey}>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-secondary">
          <span className="font-semibold text-accent-emerald font-tnum">{POLICIES_ON_TRACK}</span>
          <span className="text-text-muted">/{POLICIES.length} policies on track</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          bar = attestation %
        </span>
      </div>
      <ul className="space-y-2.5">
        {POLICIES.map((p, i) => {
          const overdue = p.dueDays < 0;
          const weak = p.attestation < 85;
          const barColor = overdue ? "#F43F5E" : weak ? "#FACC15" : "#34D399";
          return (
            <motion.li
              key={p.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
              className="group flex items-center gap-3"
            >
              <div className="flex w-36 shrink-0 items-center gap-1.5 truncate text-[13px] text-text-secondary">
                {overdue ? (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-sev-critical" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent-emerald/70" />
                )}
                <span className="truncate group-hover:text-text-primary">{p.name}</span>
              </div>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: barColor, transformOrigin: "left" }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: p.attestation / 100 }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span
                className="w-9 shrink-0 text-right font-mono text-xs font-semibold font-tnum"
                style={{ color: barColor }}
              >
                {p.attestation}%
              </span>
              <span
                className={cn(
                  "w-[86px] shrink-0 rounded-full border px-2 py-0.5 text-center font-mono text-[10px] uppercase tracking-wider",
                  overdue
                    ? "border-sev-critical/50 bg-sev-critical/10 text-sev-critical"
                    : p.dueDays <= 10
                      ? "border-sev-medium/40 bg-sev-medium/10 text-sev-medium"
                      : "border-hairline text-text-muted",
                )}
              >
                {overdue ? `overdue ${Math.abs(p.dueDays)}d` : `due in ${p.dueDays}d`}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

export default PolicyBoard;
