import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, FileSpreadsheet, FileText, FileArchive, Paperclip, ShieldCheck, ClipboardList, AlertOctagon } from "lucide-react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "@/components/widgets/SectionCard";
import { KpiCard } from "@/components/widgets/KpiCard";
import { RiskHeatmap } from "@/components/widgets/RiskHeatmap";
import {
  applyFilters,
  formatDate,
  heatmapGrid,
  incidentsByDomain,
  openCount,
  riskScore,
  type Incident,
} from "@/lib/data";
import type { Severity } from "@/lib/domains";
import { useFilters } from "@/stores/filterStore";
import { SeverityPill } from "@/components/widgets/IncidentTable";
import { DomainTable, Chip, type ColumnDef } from "@/components/domains/table";
import { DomainHeader, GaugeKpi, GridCell, LocalChip, RingKpi, riseContainer, riseItem, hashStr } from "@/components/domains/utils";
import {
  AuditDonut,
  AUDITS,
  ControlStatusBars,
  FrameworkRings,
  TopRisksList,
  controlStatusOf,
  evidenceCountOf,
  familyOf,
  type ControlStatus,
} from "@/components/domains/grc";
import { cn } from "@/lib/utils";

const CONTROL_STATUS_COLORS: Record<ControlStatus, string> = { Compliant: "#34D399", Partial: "#FBBF24", Gap: "#F43F5E" };

function ControlStatusPill({ status }: { status: ControlStatus }) {
  const c = CONTROL_STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
      style={{ color: c, borderColor: `${c}55`, background: `${c}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {status}
    </span>
  );
}

const EVIDENCE_FILES = [
  { icon: FileText, suffix: "policy.pdf" },
  { icon: FileSpreadsheet, suffix: "evidence.xlsx" },
  { icon: FileArchive, suffix: "screenshots.zip" },
  { icon: FileText, suffix: "review-notes.md" },
];

function evidenceFiles(r: Incident) {
  const n = evidenceCountOf(r);
  const base = (r.controlId ?? r.id).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return Array.from({ length: Math.max(1, Math.min(4, n)) }, (_, i) => {
    const f = EVIDENCE_FILES[(hashStr(r.id) + i) % EVIDENCE_FILES.length];
    return { icon: f.icon, name: `${base}-${f.suffix}` };
  });
}

const columns: ColumnDef[] = [
  { key: "controlId", label: "Control ID", sortValue: (r) => r.controlId ?? r.id, render: (r) => <span className="font-mono text-xs text-accent-cyan">{r.controlId ?? r.id}</span>, className: "whitespace-nowrap" },
  { key: "title", label: "Name", render: (r) => <span className="block max-w-[220px] truncate text-text-secondary">{r.title}</span> },
  { key: "framework", label: "Framework", render: (r) => <Chip label={r.framework ?? "—"} color="#34D399" /> },
  { key: "severity", label: "Criticality", sortValue: (r) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 })[r.severity as Severity], render: (r) => <SeverityPill severity={r.severity} /> },
  { key: "status", label: "Status", sortValue: (r) => controlStatusOf(r), render: (r) => <ControlStatusPill status={controlStatusOf(r)} /> },
  { key: "owner", label: "Owner", render: (r) => <span className="whitespace-nowrap text-xs text-text-secondary">{r.owner}</span> },
  { key: "detectedAt", label: "Last Audit", sortValue: (r) => r.detectedAt, render: (r) => <span className="font-mono text-xs text-text-muted font-tnum">{formatDate(r.detectedAt)}</span>, className: "whitespace-nowrap" },
  {
    key: "evidence",
    label: "Evidence",
    sortValue: (r) => evidenceCountOf(r),
    render: (r) => (
      <span className="inline-flex items-center gap-1 font-mono text-xs text-text-secondary font-tnum">
        <Paperclip className="h-3 w-3 text-text-muted" />
        {evidenceCountOf(r)}
      </span>
    ),
  },
];

export default function Grc() {
  const filters = useFilters();
  const [framework, setFramework] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState<string | null>(null);
  const [cell, setCell] = useState<{ l: number; i: number } | null>(null);

  const all = useMemo(() => incidentsByDomain("grc"), []);
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);

  // map audit-donut segments onto control statuses
  const statusFilter: ControlStatus | null =
    auditFilter === "Passed" ? "Compliant" : auditFilter === "In Progress" ? "Partial" : auditFilter === "Overdue" ? "Gap" : null;

  const tableRecords = useMemo(
    () =>
      filtered.filter(
        (r) =>
          (!framework || r.framework === framework) &&
          (!statusFilter || controlStatusOf(r) === statusFilter) &&
          (!cell || (r.likelihood === cell.l && r.impact === cell.i)),
      ),
    [filtered, framework, statusFilter, cell],
  );

  const comp = filtered.filter((r) => controlStatusOf(r) === "Compliant").length;
  const part = filtered.filter((r) => controlStatusOf(r) === "Partial").length;
  const gaps = filtered.filter((r) => controlStatusOf(r) === "Gap").length;
  const compliance = filtered.length ? Math.round(((comp + part * 0.5) / filtered.length) * 100) : 100;

  return (
    <div>
      <Toaster theme="dark" position="bottom-right" />
      <DomainHeader
        eyebrow="Module 04 / 10 · Frameworks & Assurance"
        title="Governance, Risk & Compliance"
        description="Compliance posture, control health and the enterprise risk register in one view."
      />

      <motion.div variants={riseContainer} initial="hidden" animate="show" className="grid grid-cols-12 gap-4">
        {/* Section A — KPIs */}
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <RingKpi label="Overall Compliance" value={compliance} sub="Weighted attainment" />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Controls" value={filtered.length} icon={ClipboardList} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Control Gaps" value={gaps} invertDelta icon={AlertOctagon} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Audits Scheduled" value={AUDITS.filter((a) => a.status === "Scheduled").length + AUDITS.filter((a) => a.status === "In Progress").length} icon={CalendarClock} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Open Risks" value={openCount(filtered)} invertDelta icon={ShieldCheck} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <GaugeKpi score={riskScore(filtered)} label="GRC Risk" />
        </GridCell>

        {/* Section B — framework posture */}
        <GridCell className="col-span-12">
          <SectionCard title="Framework Posture" subtitle="Click a framework to filter the controls explorer">
            <FrameworkRings records={filtered} selected={framework} onSelect={(f) => setFramework((p) => (p === f ? null : f))} />
          </SectionCard>
        </GridCell>

        {/* Section C — control health + audits */}
        <GridCell className="col-span-12 lg:col-span-7">
          <SectionCard title="Control Status by Family" subtitle="Compliant / partial / gap per control family">
            <ControlStatusBars records={filtered} />
          </SectionCard>
        </GridCell>
        <GridCell className="col-span-12 lg:col-span-5">
          <SectionCard title="Audit Status" subtitle="Audit calendar · click a segment to map onto control status">
            <AuditDonut selected={auditFilter} onSelect={(s) => setAuditFilter((p) => (p === s ? null : s))} />
          </SectionCard>
        </GridCell>

        {/* Section D — risk register */}
        <GridCell className="col-span-12 lg:col-span-8">
          <SectionCard title="Risk Register Matrix" subtitle="Likelihood × impact · click a cell to filter">
            <RiskHeatmap
              grid={heatmapGrid(filtered)}
              onCellClick={(l, i) => setCell((prev) => (prev && prev.l === l && prev.i === i ? null : { l, i }))}
            />
          </SectionCard>
        </GridCell>
        <GridCell className="col-span-12 lg:col-span-4">
          <SectionCard title="Top Risks" subtitle="Highest L×I open register entries">
            <TopRisksList records={filtered} />
          </SectionCard>
        </GridCell>

        {/* Section E — controls explorer */}
        <motion.div variants={riseItem} className="col-span-12">
          <SectionCard
            title="Controls Explorer"
            subtitle={`${tableRecords.length.toLocaleString("en-US")} controls in scope`}
            actions={
              <div className="flex flex-wrap gap-2">
                {framework && <LocalChip label={`Framework: ${framework}`} onClear={() => setFramework(null)} />}
                {statusFilter && <LocalChip label={`Status: ${statusFilter}`} onClear={() => setAuditFilter(null)} />}
                {cell && <LocalChip label={`L${cell.l} × I${cell.i}`} onClear={() => setCell(null)} />}
              </div>
            }
          >
            <DomainTable
              records={tableRecords}
              columns={columns}
              searchPlaceholder="Search control id, name, owner, framework…"
              drawerFields={(r) => [
                ["Control Family", familyOf(r)],
                ["Likelihood × Impact", `L${r.likelihood} × I${r.impact}`],
              ]}
              renderDrawerExtra={(r) => {
                const files = evidenceFiles(r);
                const d = new Date(r.detectedAt);
                const hist = [0, 6, 12].map((back, i) => {
                  const dt = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - back, d.getUTCDate()));
                  return {
                    date: formatDate(dt.toISOString()),
                    status: i === 0 ? controlStatusOf(r) : (["Compliant", "Partial", "Compliant"] as const)[i],
                    label: i === 0 ? "Latest assessment" : i === 1 ? "Interim review" : "Annual audit",
                  };
                });
                return (
                  <div className="space-y-5">
                    <div>
                      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Description</div>
                      <p className="rounded-lg border border-hairline bg-surface-2/60 p-3 text-xs leading-relaxed text-text-secondary">
                        {r.title}. Assessed under {r.framework} ({familyOf(r)}). Current status: {controlStatusOf(r)}.
                        Owner {r.owner} is responsible for maintaining evidence and remediation of any gap.
                      </p>
                    </div>
                    <div>
                      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                        Evidence ({evidenceCountOf(r)})
                      </div>
                      <div className="space-y-1.5">
                        {files.map((f, i) => (
                          <motion.div
                            key={f.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-2/40 px-3 py-2"
                          >
                            <f.icon className="h-3.5 w-3.5 shrink-0 text-accent-cyan" />
                            <span className="truncate font-mono text-[11px] text-text-secondary">{f.name}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Audit history</div>
                      <div className="space-y-0">
                        {hist.map((h, i) => (
                          <div key={h.label} className="relative flex gap-3 pb-4 pl-4 last:pb-0">
                            {i < hist.length - 1 && <span className="absolute left-[3px] top-3 h-full w-px bg-hairline" />}
                            <span
                              className="absolute left-0 top-1.5 h-[7px] w-[7px] rounded-full"
                              style={{ background: CONTROL_STATUS_COLORS[h.status] }}
                            />
                            <div className="min-w-0">
                              <div className="text-xs text-text-primary">{h.label}</div>
                              <div className={cn("font-mono text-[10px] text-text-muted")}>
                                {h.date} · {h.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }}
              actionLabel={() => "Request evidence"}
              onAction={(r) =>
                toast.success(`Evidence request sent to ${r.owner ?? "control owner"}`, {
                  description: `${r.controlId ?? r.id} · ${r.framework}`,
                })
              }
            />
          </SectionCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
