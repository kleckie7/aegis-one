import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, CheckCircle2, Clock3, Loader, ShieldAlert } from "lucide-react";
import {
  applyFilters,
  categoryCounts,
  filterKey,
  formatMinutes,
  incidentsByDomain,
  mttrMinutes,
  periodDelta,
  riskScore,
  severityCounts,
  statusCounts,
  teamCounts,
  trendByMonth,
  type Incident,
} from "@/lib/data";
import { useFilters, useFilterStore } from "@/stores/filterStore";
import { FilterMorph } from "@/components/widgets/shared";
import SectionCard from "@/components/widgets/SectionCard";
import KpiCard from "@/components/widgets/KpiCard";
import TrendChart from "@/components/widgets/TrendChart";
import TeamBar from "@/components/widgets/TeamBar";
import PageHeader from "@/components/domains/PageHeader";
import GaugeKpiCard from "@/components/domains/GaugeKpiCard";
import GenericDonut from "@/components/domains/GenericDonut";
import HBarList from "@/components/domains/HBarList";
import DomainExplorer, { TimelineStepper } from "@/components/domains/DomainExplorer";
import SeverityBars from "@/components/domains/network/SeverityBars";
import TeamRankList from "@/components/domains/network/TeamRankList";

const ENV_COLORS: Record<string, string> = {
  Corporate: "#22D3EE",
  Production: "#60A5FA",
  Staging: "#A78BFA",
};

const rise = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export default function NetworkSecurity() {
  const filters = useFilters();
  const setEnvironment = useFilterStore((s) => s.setEnvironment);
  const all = useMemo(() => incidentsByDomain("network-security"), []);
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);

  const stats = useMemo(() => {
    const status = statusCounts(filtered);
    const open = status.find((s) => s.name === "Open")?.value ?? 0;
    const inProg = status.find((s) => s.name === "In Progress")?.value ?? 0;
    const resolved = status.find((s) => s.name === "Resolved")?.value ?? 0;
    const total = filtered.length;
    return {
      total,
      open,
      inProg,
      resolved,
      resolvedPct: total ? Math.round((resolved / total) * 100) : 0,
      avgResp: mttrMinutes(filtered),
      risk: riskScore(filtered),
      trend: trendByMonth(filtered),
      severity: severityCounts(filtered),
      teams: [...teamCounts(filtered)].sort((a, b) => b.reported - a.reported),
      types: categoryCounts(filtered, 6).map((c) => ({
        name: c.name,
        value: c.value,
        resolved: filtered.filter((r) => r.category === c.name && r.status === "Resolved").length,
      })),
      envs: (["Corporate", "Production", "Staging"] as const).map((e) => ({
        name: e as string,
        value: filtered.filter((r) => r.environment === e).length,
        color: ENV_COLORS[e],
      })),
    };
  }, [filtered]);

  const envTotal = Math.max(1, stats.envs.reduce((a, e) => a + e.value, 0));
  const topEnv = [...stats.envs].sort((a, b) => b.value - a.value)[0];
  const deltaTotal = periodDelta(all, filters, (r) => r.length);
  const deltaResp = periodDelta(all, filters, (r) => mttrMinutes(r));

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Module 09 / 10 · Perimeter & Traffic"
        title="Network Security"
        descriptor="Monitor, detect and respond to network-level threats across all environments."
      />

      {/* Section A — KPI row (the original 6, now live) */}
      <FilterMorph>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <motion.div {...rise(0)}>
            <KpiCard label="Total Incidents" value={stats.total} delta={deltaTotal} icon={Activity} />
          </motion.div>
          <motion.div {...rise(1)}>
            <KpiCard label="Open" value={stats.open} icon={ShieldAlert} />
          </motion.div>
          <motion.div {...rise(2)}>
            <KpiCard label="In Progress" value={stats.inProg} icon={Loader} />
          </motion.div>
          <motion.div {...rise(3)}>
            <KpiCard label="Resolved" value={stats.resolved} icon={CheckCircle2} />
          </motion.div>
          <motion.div {...rise(4)}>
            <KpiCard
              label="Avg Response Time"
              value={stats.avgResp}
              format={(v) => formatMinutes(Math.round(v))}
              delta={deltaResp}
              invertDelta
              icon={Clock3}
            />
          </motion.div>
          <motion.div {...rise(5)}>
            <GaugeKpiCard score={stats.risk} />
          </motion.div>
        </div>
      </FilterMorph>

      {/* Section B — Reported vs Resolved + Status donut */}
      <div className="grid grid-cols-12 gap-4">
        <SectionCard title="Reported vs Resolved by Month" subtitle="All network incidents · 2025" className="col-span-12 lg:col-span-8">
          <TrendChart data={stats.trend} height={300} />
        </SectionCard>
        <SectionCard title="Status %" subtitle="Resolution share" className="col-span-12 lg:col-span-4">
          <FilterMorph>
            <GenericDonut
              data={statusCounts(filtered).map((s) => ({
                name: s.name as string,
                value: s.value,
                color: s.name === "Open" ? "#F43F5E" : s.name === "In Progress" ? "#FBBF24" : "#34D399",
              }))}
              centerValue={`${stats.resolvedPct}%`}
              centerLabel="Resolved"
              height={300}
              ariaLabel="Incident status share"
            />
          </FilterMorph>
        </SectionCard>
      </div>

      {/* Section C — Type / Severity / Environment */}
      <div className="grid grid-cols-12 gap-4">
        <SectionCard title="Incidents by Type" subtitle="Resolved portion in emerald" className="col-span-12 md:col-span-6 xl:col-span-4">
          <HBarList items={stats.types} />
        </SectionCard>
        <SectionCard title="Severity" subtitle="Click a bar to filter" className="col-span-12 md:col-span-6 xl:col-span-4">
          <SeverityBars data={stats.severity} height={252} />
        </SectionCard>
        <SectionCard title="Environment" subtitle="Click a segment to filter" className="col-span-12 xl:col-span-4">
          <FilterMorph>
            <GenericDonut
              data={stats.envs}
              centerValue={topEnv ? `${Math.round((topEnv.value / envTotal) * 100)}%` : "0%"}
              centerLabel={topEnv?.name ?? "—"}
              onSegmentClick={(name) =>
                setEnvironment(filters.environment === name ? "all" : name)
              }
              selectedName={filters.environment === "all" ? null : filters.environment}
              height={252}
              ariaLabel="Incidents by environment"
            />
          </FilterMorph>
        </SectionCard>
      </div>

      {/* Section D — Team performance */}
      <div className="grid grid-cols-12 gap-4">
        <SectionCard title="Team Status" subtitle="Reported vs solved per team" className="col-span-12 lg:col-span-7">
          <TeamBar data={stats.teams} height={280} />
        </SectionCard>
        <SectionCard title="Incidents by Team" subtitle="Ranked by resolution rate" className="col-span-12 lg:col-span-5">
          <TeamRankList data={stats.teams} />
        </SectionCard>
      </div>

      {/* Section E — Incident explorer */}
      <SectionCard
        title="Incident Explorer"
        subtitle={`NET- records · ${filterKey(filters)}`}
        className="col-span-12"
      >
        <DomainExplorer
          incidents={filtered}
          drawerBody={(r: Incident) => <TimelineStepper incident={r} />}
        />
      </SectionCard>
    </div>
  );
}
