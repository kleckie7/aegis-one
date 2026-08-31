import { useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bug,
  CheckCircle2,
  Clock3,
  Flame,
  Radar,
  SearchX,
  ShieldCheck,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { KpiCard } from "@/components/widgets/KpiCard";
import { RiskGauge } from "@/components/widgets/RiskGauge";
import { RiskHeatmap } from "@/components/widgets/RiskHeatmap";
import { SectionCard } from "@/components/widgets/SectionCard";
import { PageHeader } from "@/components/command-center/PageHeader";
import { DomainGrid, type DomainStat } from "@/components/command-center/DomainGrid";
import { GlobalTrend } from "@/components/command-center/GlobalTrend";
import { SeverityMix } from "@/components/command-center/SeverityMix";
import { LiveFeed } from "@/components/command-center/LiveFeed";
import { TopRisksTable } from "@/components/command-center/TopRisksTable";
import { riskValue } from "@/components/command-center/risk";
import { PostureStrip } from "@/components/command-center/PostureStrip";
import {
  ALL_INCIDENTS,
  applyFilters,
  formatMinutes,
  heatmapGrid,
  mttrMinutes,
  openCount,
  periodDelta,
  riskScore,
  trendByMonth,
  worstOpenSeverity,
  type Incident,
} from "@/lib/data";
import { DOMAINS, type Severity } from "@/lib/domains";
import { useFilterStore, useFilters } from "@/stores/filterStore";
import { cn } from "@/lib/utils";

const SLA_MINUTES: Record<Severity, number> = { Critical: 240, High: 1440, Medium: 4320, Low: 20160 };

/** rise-in section wrapper with staggered mount */
function Rise({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function monthlyCounts(records: Incident[], pred: (r: Incident) => boolean): number[] {
  const buckets = new Array(12).fill(0) as number[];
  for (const r of records) {
    if (pred(r)) buckets[new Date(r.detectedAt).getUTCMonth()]++;
  }
  return buckets;
}

export default function CommandCenter() {
  const filters = useFilters();
  const reset = useFilterStore((s) => s.reset);
  const [cell, setCell] = useState<{ l: number; i: number } | null>(null);

  /** all records through the global filters */
  const filtered = useMemo(() => applyFilters(ALL_INCIDENTS, filters), [filters]);
  /** same filters minus month — the pool used for prev-period deltas */
  const pool = useMemo(() => applyFilters(ALL_INCIDENTS, { ...filters, month: "all" }), [filters]);

  const open = useMemo(() => filtered.filter((r) => r.status !== "Resolved"), [filtered]);

  /* ---------------- org risk hero ---------------- */
  const orgScore = useMemo(() => {
    let sum = 0;
    let w = 0;
    for (const d of DOMAINS) {
      sum += riskScore(filtered.filter((r) => r.domain === d.slug)) * d.volume;
      w += d.volume;
    }
    return Math.round(sum / w);
  }, [filtered]);

  const critOpen = open.filter((r) => r.severity === "Critical").length;
  const highOpen = open.filter((r) => r.severity === "High").length;
  const slaBreaches = open.filter((r) => r.responseMinutes > SLA_MINUTES[r.severity]).length;
  const riskDelta = periodDelta(pool, filters, riskScore);

  /* ---------------- KPIs ---------------- */
  const mttr = mttrMinutes(filtered);
  const mttd = Math.max(4, Math.round(mttr * 0.008));
  const activeVulns = useMemo(
    () => filtered.filter((r) => r.domain === "vulnerability-management" && r.status !== "Resolved").length,
    [filtered],
  );
  const compliance = useMemo(() => {
    const grc = filtered.filter((r) => r.domain === "grc");
    if (grc.length === 0) return 87;
    return Math.round((grc.filter((r) => r.auditStatus === "Compliant").length / grc.length) * 100);
  }, [filtered]);
  const endpointCoverage = useMemo(() => {
    const eps = filtered.filter((r) => r.domain === "endpoint-security");
    if (eps.length === 0) return 99.1;
    const bad = eps.filter(
      (r) => r.status !== "Resolved" && (r.severity === "Critical" || r.severity === "High"),
    ).length;
    return Math.round(Math.min(99.9, 100 - (bad / eps.length) * 12) * 10) / 10;
  }, [filtered]);

  const sparkReported = useMemo(() => monthlyCounts(filtered, () => true), [filtered]);
  const sparkOpen = useMemo(() => monthlyCounts(filtered, (r) => r.status !== "Resolved"), [filtered]);
  const sparkResolved = useMemo(() => monthlyCounts(filtered, (r) => r.status === "Resolved"), [filtered]);
  const sparkVulns = useMemo(
    () => monthlyCounts(filtered, (r) => r.domain === "vulnerability-management" && r.status !== "Resolved"),
    [filtered],
  );

  const dTotal = periodDelta(pool, filters, (r) => r.length);
  const dOpen = periodDelta(pool, filters, openCount);
  const dResolved = periodDelta(pool, filters, (r) => r.filter((x) => x.status === "Resolved").length);
  const dMttr = periodDelta(pool, filters, mttrMinutes);

  /* ---------------- domain status grid ---------------- */
  const domainStats: DomainStat[] = useMemo(
    () =>
      DOMAINS.map((def) => {
        const rows = filtered.filter((r) => r.domain === def.slug);
        return {
          def,
          score: riskScore(rows),
          open: rows.filter((r) => r.status !== "Resolved").length,
          total: rows.length,
          worst: worstOpenSeverity(rows),
          spark: monthlyCounts(rows, () => true),
        };
      }),
    [filtered],
  );

  /* ---------------- trend / heatmap / top risks ---------------- */
  const trend = useMemo(() => trendByMonth(filtered), [filtered]);
  const grid = useMemo(() => heatmapGrid(filtered), [filtered]);

  const topRisks = useMemo(() => {
    let rows = filtered.filter(
      (r) => (r.severity === "Critical" || r.severity === "High") && r.status !== "Resolved",
    );
    if (cell) rows = rows.filter((r) => r.likelihood === cell.l && r.impact === cell.i);
    return rows.sort((a, b) => riskValue(b) - riskValue(a)).slice(0, 24);
  }, [filtered, cell]);

  /* ---------------- empty state ---------------- */
  if (filtered.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader />
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-surface-1/50 p-10 text-center">
          <div className="rounded-xl border border-hairline bg-surface-2 p-4 text-text-muted">
            <SearchX className="h-8 w-8" />
          </div>
          <h2 className="mt-5 font-display text-xl font-semibold tracking-tight text-text-primary">
            No records for this filter
          </h2>
          <p className="mt-2 max-w-sm text-sm text-text-secondary">
            The current filter combination matches zero incidents across all domains.
          </p>
          <button
            onClick={reset}
            className="mt-6 rounded-lg border border-accent-cyan/40 bg-accent-cyan/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-accent-cyan transition-colors hover:bg-accent-cyan/20"
          >
            Reset filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader />

      {/* Row 1 — org risk gauge + KPI stack */}
      <div className="grid grid-cols-12 gap-4">
        <Rise delay={0.05} className="col-span-12 lg:col-span-4">
          <SectionCard title="Organizational Risk" subtitle="Weighted mean · 10 domains" className="h-full">
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <RiskGauge score={orgScore} label="Org risk" size={250} />
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full border border-sev-critical/40 bg-sev-critical/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-sev-critical">
                  Critical {critOpen}
                </span>
                <span className="rounded-full border border-sev-high/40 bg-sev-high/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-sev-high">
                  High {highOpen}
                </span>
                <span className="rounded-full border border-sev-medium/40 bg-sev-medium/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-sev-medium">
                  SLA breaches {slaBreaches}
                </span>
                {riskDelta != null && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider",
                      riskDelta < 0
                        ? "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald"
                        : "border-sev-critical/40 bg-sev-critical/10 text-sev-critical",
                    )}
                  >
                    {riskDelta < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                    {riskDelta >= 0 ? "+" : ""}
                    {riskDelta}% vs prev
                  </span>
                )}
              </div>
            </div>
          </SectionCard>
        </Rise>
        <Rise delay={0.1} className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total Incidents" value={filtered.length} delta={dTotal} invertDelta spark={sparkReported} icon={Activity} />
            <KpiCard label="Open" value={open.length} delta={dOpen} invertDelta spark={sparkOpen} icon={Flame} />
            <KpiCard label="Resolved" value={filtered.length - open.length} delta={dResolved} spark={sparkResolved} icon={CheckCircle2} />
            <KpiCard
              label="Avg Response"
              value={mttr}
              format={(v) => formatMinutes(Math.round(v))}
              delta={dMttr}
              invertDelta
              icon={Clock3}
            />
            <KpiCard label="Active Vulnerabilities" value={activeVulns} spark={sparkVulns} icon={Bug} />
            <KpiCard label="Compliance" value={compliance} suffix="%" icon={ShieldCheck} />
            <KpiCard label="MTTD" value={mttd} format={(v) => `${Math.round(v)}m`} icon={Radar} />
            <KpiCard
              label="Endpoints Covered"
              value={endpointCoverage}
              format={(v) => v.toFixed(1)}
              suffix="%"
              icon={Timer}
            />
          </div>
        </Rise>
      </div>

      {/* Row 2 — domain status grid (FLIP reorder on filter/sort change) */}
      <Rise delay={0.15}>
        <DomainGrid stats={domainStats} />
      </Rise>

      {/* Row 3 — global trend + severity mix */}
      <div className="grid grid-cols-12 gap-4">
        <Rise delay={0.2} className="col-span-12 xl:col-span-8">
          <SectionCard title="Global Trend" subtitle="Reported vs resolved · all domains" className="h-full">
            <GlobalTrend data={trend} />
          </SectionCard>
        </Rise>
        <Rise delay={0.25} className="col-span-12 xl:col-span-4">
          <SeverityMix open={open} />
        </Rise>
      </div>

      {/* Row 4 — risk heatmap + live feed */}
      <div className="grid grid-cols-12 gap-4">
        <Rise delay={0.3} className="col-span-12 xl:col-span-5">
          <SectionCard
            title="Risk Heatmap"
            subtitle="Likelihood × impact · click a cell to filter top risks"
            className="h-full"
          >
            <RiskHeatmap
              grid={grid}
              onCellClick={(l, i) =>
                setCell((prev) => (prev && prev.l === l && prev.i === i ? null : { l, i }))
              }
            />
          </SectionCard>
        </Rise>
        <Rise delay={0.35} className="col-span-12 xl:col-span-7">
          <LiveFeed />
        </Rise>
      </div>

      {/* Row 5 — top risks table */}
      <Rise delay={0.4}>
        <SectionCard
          title="Top Risks"
          subtitle="Critical & high · unresolved · ranked by composite risk"
        >
          <TopRisksTable incidents={topRisks} cell={cell} onClearCell={() => setCell(null)} />
        </SectionCard>
      </Rise>

      {/* Row 6 — posture footer strip */}
      <Rise delay={0.45}>
        <PostureStrip records={filtered} />
      </Rise>
    </div>
  );
}
