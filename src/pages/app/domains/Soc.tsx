import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Crosshair, Radar, SearchCheck, Timer, Users, Zap } from "lucide-react";
import {
  MONTH_LABELS,
  applyFilters,
  incidentsByDomain,
  mttrMinutes,
  openCount,
  periodDelta,
  riskScore,
  type Incident,
} from "@/lib/data";
import { useFilters } from "@/stores/filterStore";
import { FilterMorph } from "@/components/widgets/shared";
import SectionCard from "@/components/widgets/SectionCard";
import KpiCard from "@/components/widgets/KpiCard";
import PageHeader from "@/components/domains/PageHeader";
import GaugeKpiCard from "@/components/domains/GaugeKpiCard";
import GenericDonut from "@/components/domains/GenericDonut";
import ActionButton from "@/components/domains/ActionButton";
import DomainExplorer, { TimelineStepper } from "@/components/domains/DomainExplorer";
import TriageFunnel from "@/components/domains/soc/TriageFunnel";
import AnalystLoadBoard from "@/components/domains/soc/AnalystLoadBoard";
import { AlertRadar, MttdMttrTrend } from "@/components/domains/soc/charts";
import {
  ANALYSTS,
  SHIFT_COLORS,
  STAGES,
  STAGE_COLORS,
  analystFor,
  avgMttd,
  mttdOf,
  shiftOf,
  stageOf,
  type Stage,
} from "@/components/domains/soc/analysts";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const rise = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

/** Mock-liveliness badge: "+3 new" pops in every ~10s and fades */
const LiveBadge = memo(function LiveBadge() {
  const [visible, setVisible] = useState(false);
  const [n, setN] = useState(3);
  useEffect(() => {
    const cycle = setInterval(() => {
      setN(1 + Math.floor(Math.random() * 5));
      setVisible(true);
      setTimeout(() => setVisible(false), 2600);
    }, 10000);
    const first = setTimeout(() => {
      setVisible(true);
      setTimeout(() => setVisible(false), 2600);
    }, 2000);
    return () => {
      clearInterval(cycle);
      clearTimeout(first);
    };
  }, []);
  return (
    <span
      className={cn(
        "ml-2 inline-flex items-center rounded-full border border-accent-emerald/40 bg-accent-emerald/10 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-accent-emerald transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      +{n} new
    </span>
  );
});

function StagePill({ stage }: { stage: number }) {
  const color = STAGE_COLORS[stage - 1];
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
      style={{ color, borderColor: `${color}55`, background: `${color}14` }}
    >
      {STAGES[stage - 1]}
    </span>
  );
}

export default function Soc() {
  const filters = useFilters();
  const all = useMemo(() => incidentsByDomain("soc"), []);
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);
  const [stageFilter, setStageFilter] = useState<Stage | null>(null);
  const [analystFilter, setAnalystFilter] = useState<number | null>(null);

  const stats = useMemo(() => {
    const funnel = STAGES.map((_, i) => filtered.filter((r) => stageOf(r) >= i + 1).length);
    const tp = filtered.length
      ? Math.round((filtered.filter((r) => r.rootCause !== "Noise Rule" && r.rootCause !== "Misconfig Alert").length / filtered.length) * 100)
      : 0;
    // radar: current month vs previous (per category)
    const curM = filters.month.match(/^2025-(\d{2})$/) ? parseInt(filters.month.slice(5), 10) - 1 : 11;
    const prevM = Math.max(0, curM - 1);
    const cats = [...new Set(all.map((r) => r.category))];
    const radar = cats.map((c) => ({
      type: c,
      current: filtered.filter((r) => r.category === c && new Date(r.detectedAt).getUTCMonth() === curM).length,
      previous: all.filter((r) => r.category === c && new Date(r.detectedAt).getUTCMonth() === prevM).length,
    }));
    // response trend per month
    const trend = MONTH_LABELS.map((m, i) => {
      const rows = filtered.filter((r) => new Date(r.detectedAt).getUTCMonth() === i);
      return {
        month: m,
        volume: rows.length,
        mttd: rows.length ? Math.round(rows.reduce((a, r) => a + mttdOf(r), 0) / rows.length) : 0,
        mttr: rows.length ? Math.round(rows.reduce((a, r) => a + r.responseMinutes, 0) / rows.length) : 0,
      };
    });
    const shifts = (Object.keys(SHIFT_COLORS) as (keyof typeof SHIFT_COLORS)[]).map((s) => ({
      name: s as string,
      value: filtered.filter((r) => shiftOf(r.detectedAt) === s).length,
      color: SHIFT_COLORS[s],
    }));
    return {
      funnel,
      tp,
      radar,
      trend,
      shifts,
      mttd: avgMttd(filtered),
      mttr: mttrMinutes(filtered),
      open: openCount(filtered),
      load: Math.min(96, Math.round(30 + (openCount(filtered) / Math.max(1, filtered.length)) * 70)),
      risk: riskScore(filtered),
    };
  }, [filtered, all, filters.month]);

  const busiest = [...stats.shifts].sort((a, b) => b.value - a.value)[0];
  const deltaAlerts = periodDelta(all, filters, (r) => r.length);

  const explorerRows = useMemo(() => {
    let rows = filtered;
    if (stageFilter) {
      const idx = STAGES.indexOf(stageFilter) + 1;
      rows = rows.filter((r) => stageOf(r) === idx);
    }
    if (analystFilter != null) rows = rows.filter((r) => analystFor(r).id === analystFilter);
    return rows;
  }, [filtered, stageFilter, analystFilter]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Module 07 / 10 · Detect → Triage → Respond"
        title="Security Operations Center"
        descriptor="Real-time alert triage and response performance across all shifts."
      />

      {/* Section A — KPI row */}
      <FilterMorph>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <motion.div {...rise(0)} className="relative">
            <KpiCard label="Alerts (30d)" value={filtered.length} delta={deltaAlerts} icon={Radar} />
            <div className="absolute left-5 top-[52px]">
              <LiveBadge />
            </div>
          </motion.div>
          <motion.div {...rise(1)}>
            <KpiCard label="True Positives" value={stats.tp} suffix="%" icon={Crosshair} />
          </motion.div>
          <motion.div {...rise(2)}>
            <KpiCard label="MTTD" value={stats.mttd} format={(v) => `${Math.round(v)}m`} invertDelta delta={-8} icon={Timer} />
          </motion.div>
          <motion.div {...rise(3)}>
            <KpiCard
              label="MTTR"
              value={stats.mttr}
              format={(v) => (v >= 60 ? `${(v / 60).toFixed(1)}h` : `${Math.round(v)}m`)}
              invertDelta
              delta={-12}
              icon={Zap}
            />
          </motion.div>
          <motion.div {...rise(4)}>
            <KpiCard label="Open Investigations" value={stats.open} icon={SearchCheck} />
          </motion.div>
          <motion.div {...rise(5)}>
            <GaugeKpiCard score={stats.load} label="SOC LOAD" />
          </motion.div>
        </div>
      </FilterMorph>

      {/* Section B — Funnel + Radar */}
      <div className="grid grid-cols-12 gap-4">
        <SectionCard
          title="Alert Triage Funnel"
          subtitle="Click a stage to filter the explorer"
          className="col-span-12 lg:col-span-7"
        >
          <TriageFunnel
            counts={stats.funnel}
            activeStage={stageFilter}
            onStageClick={(s) => setStageFilter(s)}
          />
        </SectionCard>
        <SectionCard title="Alert Volume Radar" subtitle="This month vs last month" className="col-span-12 lg:col-span-5">
          <AlertRadar data={stats.radar} height={320} />
        </SectionCard>
      </div>

      {/* Section C — Response performance + shift coverage */}
      <div className="grid grid-cols-12 gap-4">
        <SectionCard title="MTTD / MTTR Trend" subtitle="Volume bars · response lines · targets" className="col-span-12 lg:col-span-8">
          <MttdMttrTrend data={stats.trend} height={280} />
        </SectionCard>
        <SectionCard title="Shift Coverage" subtitle="Alerts handled per shift" className="col-span-12 lg:col-span-4">
          <FilterMorph>
            <GenericDonut
              data={stats.shifts}
              centerValue={busiest?.name ?? "—"}
              centerLabel="Busiest shift"
              height={280}
              ariaLabel="Alerts per shift"
            />
          </FilterMorph>
        </SectionCard>
      </div>

      {/* Section D — Analyst load board */}
      <SectionCard
        title="Analyst Load Board"
        subtitle={`${ANALYSTS.length} analysts · 3 shifts · click to filter explorer`}
        className="col-span-12"
        actions={
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            <Users className="h-3.5 w-3.5" /> Live
          </span>
        }
      >
        <AnalystLoadBoard incidents={filtered} activeAnalyst={analystFilter} onAnalystClick={setAnalystFilter} />
      </SectionCard>

      {/* Section E — Alert explorer */}
      <SectionCard
        title="Alert Explorer"
        subtitle="SOC- records with triage stage"
        className="col-span-12"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {stageFilter && (
            <button
              onClick={() => setStageFilter(null)}
              className="flex items-center gap-1.5 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-cyan"
            >
              Stage: {stageFilter} <X className="h-3 w-3" />
            </button>
          )}
          {analystFilter != null && (
            <button
              onClick={() => setAnalystFilter(null)}
              className="flex items-center gap-1.5 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-cyan"
            >
              Analyst: {ANALYSTS[analystFilter].name} <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <DomainExplorer
          incidents={explorerRows}
          searchPlaceholder="Search id, type, analyst, team…"
          extraColumns={[
            { header: "Alert Type", cell: (r: Incident) => r.category, sortValue: (r) => r.category },
            { header: "Stage", cell: (r) => <StagePill stage={stageOf(r)} />, sortValue: (r) => stageOf(r) },
            { header: "Analyst", cell: (r) => analystFor(r).name, sortValue: (r) => analystFor(r).name },
          ]}
          drawerBody={(r) => <TimelineStepper incident={r} />}
          drawerActions={(r) => (
            <div className="flex gap-2">
              <ActionButton label="Escalate" successMessage={`${r.id} escalated to Tier 2`} variant="danger" />
              <ActionButton label="Close as false positive" successMessage={`${r.id} closed as false positive`} variant="ghost" />
            </div>
          )}
        />
      </SectionCard>
    </div>
  );
}
