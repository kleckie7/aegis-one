import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, ShieldCheck, X } from "lucide-react";
import {
  applyFilters,
  incidentsByDomain,
  openCount,
  periodDelta,
  mttrMinutes,
  riskScore,
  severityCounts,
  sparkline,
  trendByMonth,
} from "@/lib/data";
import { useFilters } from "@/stores/filterStore";
import SectionCard from "@/components/widgets/SectionCard";
import KpiCard from "@/components/widgets/KpiCard";
import RiskGauge from "@/components/widgets/RiskGauge";
import TrendChart from "@/components/widgets/TrendChart";
import IncidentTable from "@/components/widgets/IncidentTable";
import { FilterMorph } from "@/components/widgets/shared";
import AttestationKpi from "@/components/domains/infosec/AttestationKpi";
import PolicyBoard from "@/components/domains/infosec/PolicyBoard";
import TrainingBar from "@/components/domains/infosec/TrainingBar";
import CategoryDonut from "@/components/domains/infosec/CategoryDonut";
import ResponseByCategory from "@/components/domains/infosec/ResponseByCategory";
import SeverityBars from "@/components/domains/infosec/SeverityBars";
import { TRAINING_AVG, TRAINING_TARGET } from "@/components/domains/infosec/data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export default function InformationSecurity() {
  const filters = useFilters();
  const records = useMemo(() => incidentsByDomain("information-security"), []);
  const filtered = useMemo(() => applyFilters(records, filters), [records, filters]);

  const [category, setCategory] = useState<string | null>(null);
  const tableRows = useMemo(
    () => (category ? filtered.filter((r) => r.category === category) : filtered),
    [filtered, category],
  );

  const trend = useMemo(() => trendByMonth(filtered), [filtered]);
  const sev = useMemo(() => severityCounts(filtered), [filtered]);
  const open = openCount(filtered);
  const mttrH = mttrMinutes(filtered) / 60;
  const risk = riskScore(filtered);
  const openDelta = periodDelta(records, filters, openCount);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* Section A — Header */}
      <motion.header variants={item}>
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent-cyan">
          Module 02 / 10 · Policy &amp; People
        </div>
        <h2 className="mt-1.5 font-display text-[28px] font-bold tracking-tight text-text-primary">
          Information Security
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Policies, incidents and security awareness across the whole organization.
        </p>
      </motion.header>

      {/* Section A — KPI row */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Incidents" value={filtered.length} spark={sparkline(filtered)} icon={ShieldCheck} />
        <KpiCard label="Open" value={open} delta={openDelta} invertDelta />
        <AttestationKpi />
        <KpiCard
          label="Training Completion"
          value={TRAINING_AVG}
          format={(v) => `${v.toFixed(1)}%`}
          icon={GraduationCap}
        />
        <KpiCard label="Avg Response" value={mttrH} format={(v) => `${v.toFixed(1)}h`} />
        <div className="col-span-2 flex items-center justify-center rounded-xl border border-hairline bg-surface-1 py-2 transition-all duration-300 hover:shadow-glow md:col-span-1">
          <RiskGauge score={risk} label="DOMAIN RISK" size={150} />
        </div>
      </motion.div>

      <FilterMorph className="contents">
        {/* Section B — Trend + category donut */}
        <motion.div variants={item} className="grid grid-cols-12 gap-4">
          <SectionCard
            title="Reported vs Resolved"
            subtitle="12-month incident trend"
            className="col-span-12 xl:col-span-8"
          >
            <TrendChart data={trend} height={280} />
          </SectionCard>
          <SectionCard
            title="Incidents by Category"
            subtitle="Click a segment to filter the explorer"
            className="col-span-12 xl:col-span-4"
          >
            <CategoryDonut incidents={filtered} activeCategory={category} onSelectCategory={setCategory} />
          </SectionCard>
        </motion.div>

        {/* Section C — Policy board + training */}
        <motion.div variants={item} className="grid grid-cols-12 gap-4">
          <SectionCard
            title="Policy Attestation Board"
            subtitle="12 tracked policies"
            className="col-span-12 xl:col-span-6"
          >
            <PolicyBoard />
          </SectionCard>
          <SectionCard
            title="Awareness Training by Department"
            subtitle={`Target ${TRAINING_TARGET}% completion`}
            className="col-span-12 xl:col-span-6"
          >
            <TrainingBar />
          </SectionCard>
        </motion.div>

        {/* Section D — Severity + response by category */}
        <motion.div variants={item} className="grid grid-cols-12 gap-4">
          <SectionCard
            title="Severity Distribution"
            subtitle="Deliberately quiet — healthiest domain"
            className="col-span-12 xl:col-span-4"
          >
            <SeverityBars data={sev} />
          </SectionCard>
          <SectionCard
            title="Response by Category"
            subtitle="Incident count vs avg response hours"
            className="col-span-12 xl:col-span-8"
          >
            <ResponseByCategory incidents={filtered} />
          </SectionCard>
        </motion.div>

        {/* Section E — Incident explorer */}
        <motion.div variants={item}>
          <SectionCard
            title="Incident Explorer"
            subtitle={`${tableRows.length} records`}
            className="col-span-12"
            padded={false}
            actions={
              category ? (
                <button
                  onClick={() => setCategory(null)}
                  className="flex items-center gap-1.5 rounded-full border border-accent-cyan/50 bg-accent-cyan/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-cyan transition-colors hover:bg-accent-cyan/20"
                >
                  {category}
                  <X className="h-3 w-3" />
                </button>
              ) : undefined
            }
          >
            <div className="p-5 pt-4">
              <IncidentTable incidents={tableRows} />
            </div>
          </SectionCard>
        </motion.div>
      </FilterMorph>
    </motion.div>
  );
}
