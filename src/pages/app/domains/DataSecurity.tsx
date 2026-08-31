import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { DatabaseZap, FileWarning, Timer, Vault, ShieldCheck } from "lucide-react";
import { SectionCard } from "@/components/widgets/SectionCard";
import { KpiCard } from "@/components/widgets/KpiCard";
import {
  applyFilters,
  categoryCounts,
  formatDate,
  formatMinutes,
  incidentsByDomain,
  openCount,
  riskScore,
  rootCauseCounts,
} from "@/lib/data";
import type { Severity } from "@/lib/domains";
import { useFilters } from "@/stores/filterStore";
import { SeverityPill, StatusPill } from "@/components/widgets/IncidentTable";
import { DomainTable, SlaBar, Chip, type ColumnDef } from "@/components/domains/table";
import { DomainHeader, GaugeKpi, GridCell, LocalChip, RankedBars, riseContainer, riseItem } from "@/components/domains/utils";
import {
  BusinessUnitList,
  CLASSIFICATION_COLORS,
  ClassificationDonut,
  DetectionTrend,
  SystemsBar,
  enrich,
  type Classification,
} from "@/components/domains/data";

const fmtK = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${Math.round(v)}`);

const columns: ColumnDef[] = [
  { key: "id", label: "ID", sortValue: (r) => r.id, render: (r) => <span className="font-mono text-xs text-accent-cyan">{r.id}</span>, className: "whitespace-nowrap" },
  { key: "title", label: "Incident", render: (r) => <span className="block max-w-[220px] truncate text-text-secondary">{r.title}</span> },
  { key: "severity", label: "Severity", sortValue: (r) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 })[r.severity as Severity], render: (r) => <SeverityPill severity={r.severity} /> },
  { key: "system", label: "System", render: (r) => <span className="whitespace-nowrap text-xs text-text-secondary">{enrich(r).system}</span> },
  {
    key: "classification",
    label: "Class",
    render: (r) => <Chip label={enrich(r).classification} color={CLASSIFICATION_COLORS[enrich(r).classification as Classification]} />,
  },
  {
    key: "records",
    label: "Records",
    sortValue: (r) => enrich(r).recordsAffected,
    thClassName: "text-right",
    className: "text-right font-mono text-xs text-text-primary font-tnum",
    render: (r) => enrich(r).recordsAffected.toLocaleString("en-US"),
  },
  { key: "detectedAt", label: "Detected", sortValue: (r) => r.detectedAt, render: (r) => <span className="font-mono text-xs text-text-muted font-tnum">{formatDate(r.detectedAt)}</span>, className: "whitespace-nowrap" },
  { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
  { key: "sla", label: "SLA", render: (r) => <SlaBar incident={r} /> },
];

export default function DataSecurity() {
  const filters = useFilters();
  const [classification, setClassification] = useState<string | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  const [rootCause, setRootCause] = useState<string | null>(null);

  const all = useMemo(() => incidentsByDomain("data-security"), []);
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);
  const trendRecords = useMemo(() => applyFilters(all, { ...filters, month: "all" }), [all, filters]);

  const tableRecords = useMemo(
    () =>
      filtered.filter(
        (r) =>
          (!classification || enrich(r).classification === classification) &&
          (!unit || enrich(r).unit === unit) &&
          (!rootCause || r.rootCause === rootCause),
      ),
    [filtered, classification, unit, rootCause],
  );

  const avgDetMin = filtered.length ? Math.round(filtered.reduce((a, r) => a + r.responseMinutes, 0) / filtered.length) : 0;
  const recordsExposed = filtered.reduce((a, r) => a + enrich(r).recordsAffected, 0);
  const dlpEvents = filtered.filter((r) => r.category === "DLP Block").length;
  const resolved = filtered.filter((r) => r.status === "Resolved").length;
  const risk = riskScore(filtered);

  const rootCauses = rootCauseCounts(filtered, 5).map((c, i) => ({
    name: c.name,
    value: c.value,
    highlight: i === 0,
    hint: `${c.value} incidents · ${filtered.length ? Math.round((c.value / filtered.length) * 100) : 0}% of total`,
  }));

  const types = categoryCounts(filtered, 5).map((c) => ({
    name: c.name,
    value: c.value,
    resolved: filtered.filter((r) => r.category === c.name && r.status === "Resolved").length,
  }));

  return (
    <div>
      <DomainHeader
        eyebrow="Module 08 / 10 · DLP & Classification"
        title="Data Security"
        description="Protect sensitive data across systems, business units and classifications."
      />

      <motion.div variants={riseContainer} initial="hidden" animate="show" className="grid grid-cols-12 gap-4">
        {/* Section A — KPIs */}
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Total Incidents" value={filtered.length} icon={DatabaseZap} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Avg Detection Time" value={avgDetMin} format={(v) => formatMinutes(v)} invertDelta icon={Timer} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Records Exposed" value={recordsExposed} format={fmtK} icon={FileWarning} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="DLP Events" value={dlpEvents} icon={Vault} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Resolved" value={resolved} icon={ShieldCheck} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <GaugeKpi score={risk} label="Data Risk" />
        </GridCell>

        {/* Section B — trend + classification */}
        <GridCell className="col-span-12 lg:col-span-8">
          <SectionCard title="Incident Trendline" subtitle="Reported vs resolved · dashed violet = avg detection time">
            <DetectionTrend records={trendRecords} />
          </SectionCard>
        </GridCell>
        <GridCell className="col-span-12 lg:col-span-4">
          <SectionCard title="Classification Mix" subtitle="Click a segment to filter the explorer">
            <ClassificationDonut
              records={filtered}
              selected={classification}
              onSelect={(c) => setClassification((p) => (p === c ? null : c))}
            />
          </SectionCard>
        </GridCell>

        {/* Section C — root causes + incident types */}
        <GridCell className="col-span-12 lg:col-span-6">
          <SectionCard title="Top 5 Root Causes" subtitle="Click a bar to filter the explorer">
            <RankedBars items={rootCauses} selected={rootCause} onSelect={(n) => setRootCause((p) => (p === n ? null : n))} />
          </SectionCard>
        </GridCell>
        <GridCell className="col-span-12 lg:col-span-6">
          <SectionCard title="Top 5 Incident Types" subtitle="Resolved share overlaid in emerald">
            <RankedBars items={types} />
          </SectionCard>
        </GridCell>

        {/* Section D — systems + business units */}
        <GridCell className="col-span-12 lg:col-span-7">
          <SectionCard title="Incidents by System" subtitle="Bar color = dominant open severity">
            <SystemsBar records={filtered} />
          </SectionCard>
        </GridCell>
        <GridCell className="col-span-12 lg:col-span-5">
          <SectionCard title="Incidents by Business Unit" subtitle="Click a unit to filter the explorer">
            <BusinessUnitList records={filtered} selected={unit} onSelect={(u) => setUnit((p) => (p === u ? null : u))} />
          </SectionCard>
        </GridCell>

        {/* Section E — incident explorer */}
        <motion.div variants={riseItem} className="col-span-12">
          <SectionCard
            title="Incident Explorer"
            subtitle={`${tableRecords.length.toLocaleString("en-US")} incidents in scope`}
            actions={
              <div className="flex flex-wrap gap-2">
                {classification && <LocalChip label={`Class: ${classification}`} onClear={() => setClassification(null)} />}
                {unit && <LocalChip label={`Unit: ${unit}`} onClear={() => setUnit(null)} />}
                {rootCause && <LocalChip label={`Cause: ${rootCause}`} onClear={() => setRootCause(null)} />}
              </div>
            }
          >
            <DomainTable
              records={tableRecords}
              columns={columns}
              searchPlaceholder="Search id, incident, root cause…"
              drawerFields={(r) => [
                ["System", enrich(r).system],
                ["Business Unit", enrich(r).unit],
                ["Records Affected", enrich(r).recordsAffected.toLocaleString("en-US")],
              ]}
              renderDrawerExtra={(r) => (
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Classification</div>
                    <Chip label={enrich(r).classification} color={CLASSIFICATION_COLORS[enrich(r).classification as Classification]} />
                  </div>
                  <div>
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Root cause detail</div>
                    <p className="rounded-lg border border-hairline bg-surface-2/60 p-3 text-xs leading-relaxed text-text-secondary">
                      {r.rootCause} led to {r.category.toLowerCase()} on a {enrich(r).classification.toLowerCase()}-classified
                      system ({enrich(r).system}). {openCount(filtered) > 0 ? "Containment and notification workflows apply." : ""}{" "}
                      Owner: {r.team}.
                    </p>
                  </div>
                </div>
              )}
            />
          </SectionCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
