import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, CircleDot, TrendingDown, TrendingUp, X as XIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Incident } from "@/lib/data";
import { AXIS_TICK, GRID_STROKE, useCountUp, useFilterKey } from "@/components/widgets/shared";
import { ColorDonut, bandColorForPct, hashStr } from "@/components/domains/utils";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Enrichment                                                          */
/* ------------------------------------------------------------------ */

export const FRAMEWORKS = ["ISO 27001", "SOC 2", "NIST CSF", "PCI DSS"] as const;
export type Framework = (typeof FRAMEWORKS)[number];

export const FAMILIES = ["Access Control", "Cryptography", "Incident Mgmt", "HR Security", "Asset Mgmt", "Operations"] as const;

export type ControlStatus = "Compliant" | "Partial" | "Gap";

export function controlStatusOf(r: Incident): ControlStatus {
  if (r.auditStatus === "Compliant") return "Compliant";
  if (r.auditStatus === "Partial") return "Partial";
  return "Gap"; // Non-Compliant / Not Tested surface as gaps
}

export const familyOf = (r: Incident): string => FAMILIES[hashStr(r.controlId ?? r.id) % FAMILIES.length];
export const evidenceCountOf = (r: Incident): number => hashStr(r.id) % 9;

export const AUDITS = [
  { name: "ISO 27001 Surveillance", framework: "ISO 27001", date: "12 Mar 2025", status: "Passed" },
  { name: "SOC 2 Type II", framework: "SOC 2", date: "28 Apr 2025", status: "In Progress" },
  { name: "NIST CSF Assessment", framework: "NIST CSF", date: "09 Jun 2025", status: "Scheduled" },
  { name: "PCI DSS QSA Review", framework: "PCI DSS", date: "21 Jul 2025", status: "Scheduled" },
  { name: "ISO 27001 Recertification", framework: "ISO 27001", date: "02 Oct 2025", status: "Scheduled" },
  { name: "SOC 2 Bridge Letter", framework: "SOC 2", date: "14 Nov 2025", status: "Overdue" },
] as const;

export const AUDIT_STATUS_COLORS: Record<string, string> = {
  Passed: "#34D399",
  "In Progress": "#22D3EE",
  Scheduled: "#60A5FA",
  Overdue: "#F43F5E",
};

export const nextAuditFor = (framework: string): string =>
  AUDITS.find((a) => a.framework === framework && a.status !== "Passed")?.date ?? "TBD";

/* ------------------------------------------------------------------ */
/* Section B — framework posture cards with radial rings (signature)    */
/* ------------------------------------------------------------------ */

export function FrameworkRings({
  records,
  selected,
  onSelect,
}: {
  records: Incident[];
  selected: string | null;
  onSelect: (f: string) => void;
}) {
  const cards = FRAMEWORKS.map((fw) => {
    const rows = records.filter((r) => r.framework === fw);
    const comp = rows.filter((r) => controlStatusOf(r) === "Compliant").length;
    const part = rows.filter((r) => controlStatusOf(r) === "Partial").length;
    const gap = rows.filter((r) => controlStatusOf(r) === "Gap").length;
    const pct = rows.length ? Math.round(((comp + part * 0.5) / rows.length) * 100) : 0;
    return { fw, total: rows.length, comp, part, gap, pct };
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c, i) => (
        <FrameworkCard key={c.fw} card={c} index={i} selected={selected === c.fw} onSelect={() => onSelect(c.fw)} />
      ))}
    </div>
  );
}

function FrameworkCard({
  card,
  index,
  selected,
  onSelect,
}: {
  card: { fw: Framework; total: number; comp: number; part: number; gap: number; pct: number };
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const counted = useCountUp(card.pct, 900);
  const filterKey = useFilterKey();
  const color = bandColorForPct(card.pct);
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onClick={onSelect}
      className={cn(
        "group rounded-xl border bg-surface-1 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow",
        selected ? "border-accent-cyan shadow-glow" : "border-hairline",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-[18px] font-semibold tracking-tight text-text-primary">{card.fw}</div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {card.total} controls
          </div>
        </div>
        <div className="relative h-20 w-20 shrink-0 transition-transform duration-300 group-hover:scale-105" key={filterKey}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="68%" outerRadius="100%" data={[{ v: card.pct }]} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: "#151D2C" }}
                dataKey="v"
                cornerRadius={8}
                fill={color}
                angleAxisId={0}
                isAnimationActive
                animationDuration={900}
                animationBegin={index * 120}
                animationEasing="ease-out"
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold text-text-primary font-tnum">
            {Math.round(counted)}%
          </div>
        </div>
      </div>
      <div className="mt-4 font-mono text-[34px] font-semibold leading-none font-tnum" style={{ color }}>
        {Math.round(counted)}
        <span className="text-lg text-text-secondary">%</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full border border-accent-emerald/40 bg-accent-emerald/10 px-2 py-0.5 font-mono text-[10px] text-accent-emerald">
          <Check className="h-3 w-3" /> {card.comp}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-sev-medium/40 bg-sev-medium/10 px-2 py-0.5 font-mono text-[10px] text-sev-medium">
          <CircleDot className="h-3 w-3" /> {card.part}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-sev-critical/40 bg-sev-critical/10 px-2 py-0.5 font-mono text-[10px] text-sev-critical">
          <XIcon className="h-3 w-3" /> {card.gap}
        </span>
      </div>
      <div className="mt-4 border-t border-hairline pt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        Next audit: {nextAuditFor(card.fw)}
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Section C — control status by family + audit donut                   */
/* ------------------------------------------------------------------ */

export function ControlStatusBars({ records }: { records: Incident[] }) {
  const filterKey = useFilterKey();
  const data = useMemo(
    () =>
      FAMILIES.map((family) => {
        const rows = records.filter((r) => familyOf(r) === family);
        return {
          family,
          Compliant: rows.filter((r) => controlStatusOf(r) === "Compliant").length,
          Partial: rows.filter((r) => controlStatusOf(r) === "Partial").length,
          Gap: rows.filter((r) => controlStatusOf(r) === "Gap").length,
        };
      }),
    [records],
  );
  return (
    <div style={{ height: 300 }} key={filterKey} role="img" aria-label="Control status by family, stacked">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 8 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="family" width={110} tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,.06)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-hairline bg-surface-2/95 px-3 py-2 shadow-xl backdrop-blur-md">
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">{label}</div>
                  {payload.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 font-mono text-xs">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: String(p.color) }} />
                      <span className="text-text-secondary">{p.name}</span>
                      <span className="ml-auto pl-3 font-semibold text-text-primary font-tnum">{String(p.value)}</span>
                    </div>
                  ))}
                </div>
              ) : null
            }
          />
          <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94A3B8" }} />
          <Bar dataKey="Compliant" stackId="s" fill="#34D399" barSize={16} isAnimationActive animationDuration={700} animationEasing="ease-out" />
          <Bar dataKey="Partial" stackId="s" fill="#FBBF24" isAnimationActive animationDuration={700} animationBegin={80} animationEasing="ease-out" />
          <Bar dataKey="Gap" stackId="s" fill="#F43F5E" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={700} animationBegin={160} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AuditDonut({ onSelect, selected }: { onSelect?: (s: string) => void; selected?: string | null }) {
  const data = (["Passed", "In Progress", "Scheduled", "Overdue"] as const).map((s) => ({
    name: s as string,
    value: AUDITS.filter((a) => a.status === s).length,
  })).filter((d) => d.value > 0);
  return (
    <div>
      <ColorDonut
        data={data}
        colors={AUDIT_STATUS_COLORS}
        centerValue="23d"
        centerLabel="NEXT AUDIT"
        centerSub="ISO 27001 · 12 Mar"
        height={210}
        onSelect={onSelect}
        selected={selected}
      />
      <div className="mt-3 space-y-1.5 border-t border-hairline pt-3">
        {AUDITS.map((a) => (
          <div key={a.name} className="flex items-center gap-2 font-mono text-[10px]">
            <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: AUDIT_STATUS_COLORS[a.status] }} />
            <span className="min-w-0 flex-1 truncate text-text-secondary">{a.name}</span>
            <span className="shrink-0 text-text-muted">{a.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section D — top risks list                                           */
/* ------------------------------------------------------------------ */

export function TopRisksList({ records }: { records: Incident[] }) {
  const risks = useMemo(
    () =>
      records
        .filter((r) => r.status !== "Resolved")
        .map((r) => ({ r, score: r.likelihood * r.impact, up: hashStr(r.id) % 3 !== 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    [records],
  );
  return (
    <div className="space-y-2.5">
      {risks.map(({ r, score, up }, i) => (
        <motion.div
          key={r.id}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-3",
            i === 0 ? "border-sev-critical/40 bg-sev-critical/5" : "border-hairline/70 bg-surface-2/40",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-text-primary">{r.title}</div>
            <div className="mt-0.5 font-mono text-[10px] text-text-muted">{r.owner ?? r.team}</div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-semibold",
              score >= 16
                ? "border-sev-critical/50 bg-sev-critical/10 text-sev-critical"
                : score >= 9
                  ? "border-sev-high/50 bg-sev-high/10 text-sev-high"
                  : "border-hairline bg-surface-2 text-text-secondary",
            )}
          >
            L{r.likelihood}×I{r.impact}
          </span>
          {up ? (
            <TrendingUp className="h-3.5 w-3.5 shrink-0 text-sev-critical" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 shrink-0 text-accent-emerald" />
          )}
        </motion.div>
      ))}
      {risks.length === 0 && (
        <div className="py-8 text-center font-mono text-xs text-text-muted">No open risks for the current filters.</div>
      )}
    </div>
  );
}
