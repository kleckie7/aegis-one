import { motion } from "framer-motion";
import { SectionCard } from "@/components/widgets/SectionCard";
import { SeverityDonut } from "@/components/widgets/SeverityDonut";
import { severityCounts } from "@/lib/data";
import { SEVERITY_COLORS } from "@/lib/domains";
import type { Incident } from "@/lib/data";

/** Row 3 (right) — severity mix of all open items org-wide */
export function SeverityMix({ open }: { open: Incident[] }) {
  const data = severityCounts(open);
  const total = data.reduce((a, d) => a + d.value, 0);
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <SectionCard title="Severity Mix" subtitle="Open items · all domains" className="h-full">
      <SeverityDonut data={data} height={210} centerLabel="OPEN" />
      <div className="mt-4 space-y-2.5">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-3">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: SEVERITY_COLORS[d.name] }}
            />
            <span className="w-16 shrink-0 font-mono text-[11px] uppercase tracking-wider text-text-secondary">
              {d.name}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full rounded-full"
                style={{ background: SEVERITY_COLORS[d.name] }}
                initial={{ width: 0 }}
                animate={{ width: `${(d.value / max) * 100}%` }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="w-12 shrink-0 text-right font-mono text-xs text-text-primary font-tnum">
              {d.value.toLocaleString("en-US")}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-hairline pt-3 text-right font-mono text-[11px] text-text-muted">
        <span className="text-text-primary font-tnum">{total.toLocaleString("en-US")}</span> open org-wide
      </div>
    </SectionCard>
  );
}

export default SeverityMix;
