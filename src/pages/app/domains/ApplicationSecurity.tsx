import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bug, Gauge, ListChecks, Timer, AppWindow } from "lucide-react";
import { toast, Toaster } from "sonner";
import { SectionCard } from "@/components/widgets/SectionCard";
import { KpiCard } from "@/components/widgets/KpiCard";
import { SeverityDonut } from "@/components/widgets/SeverityDonut";
import {
  applyFilters,
  criticalOpenCount,
  formatDate,
  formatMinutes,
  incidentsByDomain,
  mttrMinutes,
  openCount,
  riskScore,
  severityCounts,
} from "@/lib/data";
import type { Severity } from "@/lib/domains";
import { useFilters } from "@/stores/filterStore";
import { SeverityPill, StatusPill } from "@/components/widgets/IncidentTable";
import { DomainTable, Chip, type ColumnDef } from "@/components/domains/table";
import { DomainHeader, GaugeKpi, GridCell, LocalChip, riseContainer, riseItem, hashStr } from "@/components/domains/utils";
import { AppRiskGrid, FixSlaDial, OwaspBoard, SCANNER_COLORS, ScannerTrend, enrich, type Scanner } from "@/components/domains/appsec";

function codeLocation(r: ReturnType<typeof enrich>, id: string): { file: string; line: number } {
  const h = hashStr(id);
  return { file: `src/${r.app}/${r.owasp.code.toLowerCase()}-handler.ts`, line: 40 + (h % 320) };
}

const columns: ColumnDef[] = [
  { key: "id", label: "ID", sortValue: (r) => r.id, render: (r) => <span className="font-mono text-xs text-accent-cyan">{r.id}</span>, className: "whitespace-nowrap" },
  { key: "title", label: "Finding", render: (r) => <span className="block max-w-[220px] truncate text-text-secondary">{r.title}</span> },
  { key: "severity", label: "Severity", sortValue: (r) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 })[r.severity as Severity], render: (r) => <SeverityPill severity={r.severity} /> },
  { key: "scanner", label: "Scanner", render: (r) => <Chip label={enrich(r).scanner} color={SCANNER_COLORS[enrich(r).scanner as Scanner]} /> },
  { key: "app", label: "App", render: (r) => <span className="whitespace-nowrap font-mono text-xs text-text-secondary">{enrich(r).app}</span> },
  { key: "owasp", label: "OWASP", render: (r) => <Chip label={enrich(r).owasp.code} color="#A78BFA" /> },
  { key: "detectedAt", label: "Detected", sortValue: (r) => r.detectedAt, render: (r) => <span className="font-mono text-xs text-text-muted font-tnum">{formatDate(r.detectedAt)}</span>, className: "whitespace-nowrap" },
  {
    key: "fixsla",
    label: "Fix SLA",
    render: (r) => {
      const e = enrich(r);
      const pct = Math.min(100, (r.responseMinutes / (e.fixSlaDays * 1440)) * 100);
      const breached = pct >= 100;
      return (
        <div className="w-20">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: breached ? "#F43F5E" : pct > 70 ? "#FB923C" : "#34D399" }}
            />
          </div>
          <div className="mt-1 font-mono text-[10px] text-text-muted">{e.fixSlaDays}d SLA</div>
        </div>
      );
    },
  },
  { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
];

export default function ApplicationSecurity() {
  const filters = useFilters();
  const [owaspSel, setOwaspSel] = useState<string | null>(null);
  const [appSel, setAppSel] = useState<string | null>(null);

  const all = useMemo(() => incidentsByDomain("application-security"), []);
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);
  const trendRecords = useMemo(() => applyFilters(all, { ...filters, month: "all" }), [all, filters]);
  const openFindings = useMemo(() => filtered.filter((r) => r.status !== "Resolved"), [filtered]);

  const tableRecords = useMemo(
    () =>
      filtered.filter(
        (r) => (!owaspSel || enrich(r).owasp.code === owaspSel) && (!appSel || enrich(r).app === appSel),
      ),
    [filtered, owaspSel, appSel],
  );

  const resolvedRows = filtered.filter((r) => r.resolvedAt);
  const slaPct = resolvedRows.length
    ? Math.round((resolvedRows.filter((r) => enrich(r).withinSla).length / resolvedRows.length) * 100)
    : 100;

  return (
    <div>
      <Toaster theme="dark" position="bottom-right" />
      <DomainHeader
        eyebrow="Module 03 / 10 · Code → Deploy → Defend"
        title="Application Security"
        description="Application findings, scanner coverage and remediation velocity across 46 apps."
      />

      <motion.div variants={riseContainer} initial="hidden" animate="show" className="grid grid-cols-12 gap-4">
        {/* Section A — KPIs */}
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Open Findings" value={openCount(filtered)} icon={Bug} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Critical" value={criticalOpenCount(filtered)} icon={Gauge} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Fix SLA" value={slaPct} suffix="%" icon={ListChecks} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="MTTR" value={mttrMinutes(filtered) / 1440} format={(v) => `${Math.round(v)}d`} invertDelta icon={Timer} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Apps Covered" value={46} suffix="/46" icon={AppWindow} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <GaugeKpi score={riskScore(openFindings)} label="AppSec Risk" />
        </GridCell>

        {/* Section B — OWASP board + severity donut */}
        <GridCell className="col-span-12 lg:col-span-7">
          <SectionCard title="OWASP Top 10 Board" subtitle="Critical counts overlaid in rose · click to filter">
            <OwaspBoard records={openFindings} selected={owaspSel} onSelect={(c) => setOwaspSel((p) => (p === c ? null : c))} />
          </SectionCard>
        </GridCell>
        <GridCell className="col-span-12 lg:col-span-5">
          <SectionCard title="Open Findings by Severity" subtitle="Distribution of unresolved findings">
            <SeverityDonut data={severityCounts(openFindings)} centerLabel="OPEN" />
          </SectionCard>
        </GridCell>

        {/* Section C — scanner trend + SLA dial */}
        <GridCell className="col-span-12 lg:col-span-8">
          <SectionCard title="Findings by Scanner" subtitle="Monthly SAST / DAST / SCA / Pentest volume">
            <ScannerTrend records={trendRecords} />
          </SectionCard>
        </GridCell>
        <GridCell className="col-span-12 lg:col-span-4">
          <SectionCard title="Fix SLA" subtitle="Share of findings fixed inside SLA window">
            <div className="flex justify-center py-2">
              <FixSlaDial pct={slaPct} />
            </div>
          </SectionCard>
        </GridCell>

        {/* Section D — riskiest applications */}
        <GridCell className="col-span-12">
          <SectionCard title="Riskiest Applications" subtitle="46 apps · tile tint = open-risk score · click to filter">
            <AppRiskGrid records={filtered} selected={appSel} onSelect={(a) => setAppSel((p) => (p === a ? null : a))} />
          </SectionCard>
        </GridCell>

        {/* Section E — findings explorer */}
        <motion.div variants={riseItem} className="col-span-12">
          <SectionCard
            title="Findings Explorer"
            subtitle={`${tableRecords.length.toLocaleString("en-US")} findings in scope`}
            actions={
              <div className="flex flex-wrap gap-2">
                {owaspSel && <LocalChip label={`OWASP: ${owaspSel}`} onClear={() => setOwaspSel(null)} />}
                {appSel && <LocalChip label={`App: ${appSel}`} onClear={() => setAppSel(null)} />}
              </div>
            }
          >
            <DomainTable
              records={tableRecords}
              columns={columns}
              searchPlaceholder="Search id, finding, app…"
              drawerFields={(r) => [
                ["App", enrich(r).app],
                ["Scanner", enrich(r).scanner],
                ["Fix SLA", `${enrich(r).fixSlaDays} days`],
                ["Response", formatMinutes(r.responseMinutes)],
              ]}
              renderDrawerExtra={(r) => {
                const loc = codeLocation(enrich(r), r.id);
                return (
                  <div>
                    <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Code location</div>
                    <div className="overflow-hidden rounded-lg border border-hairline bg-abyss/70 font-mono text-[11px]">
                      <div className="border-b border-hairline px-3 py-1.5 text-text-muted">
                        {loc.file}:{loc.line}
                      </div>
                      {[loc.line - 1, loc.line, loc.line + 1].map((ln) => (
                        <div
                          key={ln}
                          className={
                            ln === loc.line
                              ? "border-l-2 border-accent-cyan bg-accent-cyan/10 px-3 py-1 text-text-primary"
                              : "border-l-2 border-transparent px-3 py-1 text-text-muted"
                          }
                        >
                          <span className="mr-3 text-text-muted/50">{ln}</span>
                          {ln === loc.line ? `// ${r.category} — tainted flow reaches sink` : "// …"}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
              actionLabel={() => "Create Jira ticket"}
              onAction={(r) =>
                toast.success(`Jira ticket created for ${r.id}`, {
                  description: `Assigned to AppSec Engineering · ${enrich(r).owasp.code} ${enrich(r).owasp.name}`,
                })
              }
            />
          </SectionCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
