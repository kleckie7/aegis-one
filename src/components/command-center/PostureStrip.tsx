import { useMemo } from "react";
import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { SectionCard } from "@/components/widgets/SectionCard";
import { useFilterKey } from "@/components/widgets/shared";
import type { Incident } from "@/lib/data";
import type { Severity } from "@/lib/domains";

const FRAMEWORKS = ["ISO 27001", "SOC 2", "NIST CSF", "PCI DSS"] as const;
const FALLBACK_COMPLIANCE: Record<(typeof FRAMEWORKS)[number], number> = {
  "ISO 27001": 87,
  "SOC 2": 91,
  "NIST CSF": 82,
  "PCI DSS": 78,
};

const SLA_MINUTES: Record<Severity, number> = { Critical: 240, High: 1440, Medium: 4320, Low: 20160 };

function ComplianceRing({ pct, index }: { pct: number; index: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" role="img" aria-label={`${pct}% compliant`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#151D2C" strokeWidth="6" />
      <motion.circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#22D3EE"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - pct / 100) }}
        transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

/** Row 6 — posture footer strip: framework compliance, response SLA, coverage */
export function PostureStrip({ records }: { records: Incident[] }) {
  const filterKey = useFilterKey();

  const frameworks = useMemo(
    () =>
      FRAMEWORKS.map((fw, i) => {
        const rows = records.filter((r) => r.framework === fw);
        const pct =
          rows.length === 0
            ? FALLBACK_COMPLIANCE[fw]
            : Math.round(
                (rows.filter((r) => r.auditStatus === "Compliant").length / rows.length) * 100,
              );
        return { fw, pct, index: i };
      }),
    [records],
  );

  const sla = useMemo(() => {
    let within = 0;
    let atRisk = 0;
    let breached = 0;
    for (const r of records) {
      const ratio = r.responseMinutes / SLA_MINUTES[r.severity];
      if (ratio >= 1) breached++;
      else if (ratio >= 0.7) atRisk++;
      else within++;
    }
    const total = Math.max(1, within + atRisk + breached);
    return {
      within,
      atRisk,
      breached,
      pw: (within / total) * 100,
      pa: (atRisk / total) * 100,
      pb: (breached / total) * 100,
    };
  }, [records]);

  const coverage = useMemo(() => {
    const open = records.filter((r) => r.status !== "Resolved");
    const exposed = open.filter((r) => r.severity === "Critical" || r.severity === "High").length;
    const pct = Math.round(Math.min(98.5, Math.max(80, 97 - (exposed / Math.max(1, open.length)) * 30)) * 10) / 10;
    return pct;
  }, [records]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <SectionCard title="Framework Compliance" subtitle="GRC audit status" menu={false}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-4" key={filterKey}>
          {frameworks.map((f) => (
            <div key={f.fw} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <ComplianceRing pct={f.pct} index={f.index} />
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-semibold text-text-primary font-tnum">
                  {f.pct}
                </span>
              </div>
              <span className="text-center font-mono text-[9px] uppercase tracking-wider text-text-muted">
                {f.fw}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Response SLA" subtitle="All records vs severity SLA" menu={false}>
        <div className="flex h-full flex-col justify-center gap-4">
          <div
            className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2"
            role="img"
            aria-label={`SLA: ${sla.within} within, ${sla.atRisk} at risk, ${sla.breached} breached`}
          >
            <motion.div
              className="h-full bg-accent-emerald"
              initial={{ width: 0 }}
              animate={{ width: `${sla.pw}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="h-full bg-[#FBBF24]"
              initial={{ width: 0 }}
              animate={{ width: `${sla.pa}%` }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="h-full bg-sev-critical"
              initial={{ width: 0 }}
              animate={{ width: `${sla.pb}%` }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Within SLA", value: sla.within, color: "#34D399" },
              { label: "At risk", value: sla.atRisk, color: "#FBBF24" },
              { label: "Breached", value: sla.breached, color: "#F43F5E" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-hairline bg-surface-2/40 px-3 py-2">
                <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-text-muted">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </div>
                <div className="mt-1 font-mono text-lg font-semibold text-text-primary font-tnum">
                  {s.value.toLocaleString("en-US")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Coverage" subtitle="Assets monitored" menu={false}>
        <div className="flex items-center justify-center gap-5">
          <div className="relative h-32 w-32" key={filterKey} role="img" aria-label={`${coverage}% of assets monitored`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Monitored", value: coverage },
                    { name: "Gap", value: 100 - coverage },
                  ]}
                  dataKey="value"
                  innerRadius="68%"
                  outerRadius="92%"
                  startAngle={90}
                  endAngle={-270}
                  stroke="#0A0E16"
                  strokeWidth={2}
                  isAnimationActive
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  <Cell fill="#22D3EE" />
                  <Cell fill="#1E2A3A" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-xl font-semibold text-text-primary font-tnum">
                {coverage}%
              </span>
            </div>
          </div>
          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-accent-cyan" /> Monitored
            </div>
            <div className="flex items-center gap-2 text-text-muted">
              <span className="h-2 w-2 rounded-full bg-hairline" /> Coverage gap
            </div>
            <div className="pt-1 text-[10px] uppercase tracking-[0.14em] text-text-muted/70">
              Endpoint + cloud + network sensors
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default PostureStrip;
