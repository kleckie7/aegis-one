import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Coins, ShieldAlert, Boxes, AlertTriangle } from "lucide-react";
import { SectionCard } from "@/components/widgets/SectionCard";
import { KpiCard } from "@/components/widgets/KpiCard";
import { formatDate, applyFilters, criticalOpenCount, incidentsByDomain, openCount, periodDelta, riskScore, type Incident } from "@/lib/data";
import { type Severity } from "@/lib/domains";
import { useFilters } from "@/stores/filterStore";
import { SeverityPill, StatusPill } from "@/components/widgets/IncidentTable";
import { DomainTable, SlaBar, Chip, type ColumnDef } from "@/components/domains/table";
import { DomainHeader, GridCell, GaugeKpi, LocalChip, RingKpi, riseContainer, riseItem, hashStr } from "@/components/domains/utils";
import {
  ComplianceBenchmarks,
  MisconfigBars,
  PostureTrend,
  ProviderDonut,
  PROVIDER_COLORS,
  ServiceStack,
  SpendRiskScatter,
  TypedCode,
  remediationFor,
  serviceOf,
  type Provider,
} from "@/components/domains/cloud";

function postureOf(rows: Incident[]): number {
  if (rows.length === 0) return 100;
  const good = rows.filter((r) => r.status === "Resolved").length + rows.filter((r) => r.status === "In Progress").length * 0.5;
  return Math.round((good / rows.length) * 100);
}

const columns: ColumnDef[] = [
  { key: "id", label: "ID", sortValue: (r) => r.id, render: (r) => <span className="font-mono text-xs text-accent-cyan">{r.id}</span>, className: "whitespace-nowrap" },
  { key: "title", label: "Finding", render: (r) => <span className="block max-w-[240px] truncate text-text-secondary">{r.title}</span> },
  { key: "severity", label: "Severity", sortValue: (r) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 })[r.severity as Severity], render: (r) => <SeverityPill severity={r.severity} /> },
  { key: "provider", label: "Provider", render: (r) => <Chip label={r.provider ?? "—"} color={PROVIDER_COLORS[(r.provider ?? "AWS") as Provider]} /> },
  { key: "service", label: "Service", render: (r) => <span className="text-xs text-text-secondary">{serviceOf(r)}</span>, className: "whitespace-nowrap" },
  { key: "misconfig", label: "Misconfig Type", render: (r) => <span className="text-xs text-text-secondary">{r.category}</span>, className: "whitespace-nowrap" },
  { key: "detectedAt", label: "Detected", sortValue: (r) => r.detectedAt, render: (r) => <span className="font-mono text-xs text-text-muted font-tnum">{formatDate(r.detectedAt)}</span>, className: "whitespace-nowrap" },
  { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
  { key: "sla", label: "SLA", render: (r) => <SlaBar incident={r} /> },
];

export default function CloudSecurity() {
  const filters = useFilters();
  const [provider, setProvider] = useState<string | null>(null);

  const all = useMemo(() => incidentsByDomain("cloud-security"), []);
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);
  const trendRecords = useMemo(() => applyFilters(all, { ...filters, month: "all" }), [all, filters]);
  const tableRecords = useMemo(
    () => (provider ? filtered.filter((r) => r.provider === provider) : filtered),
    [filtered, provider],
  );

  const posture = postureOf(filtered);
  const open = openCount(filtered);
  const critical = criticalOpenCount(filtered);
  const resourcesAtRisk = filtered
    .filter((r) => r.status !== "Resolved")
    .reduce((a, r) => a + 1 + (hashStr(r.id) % 4), 0);
  const spendK = Math.round(filtered.reduce((a, r) => a + (r.spend ?? 0), 0) / 12 / 1000);
  const risk = riskScore(filtered);
  const openDelta = periodDelta(all, filters, openCount);

  const toggleProvider = (p: string) => setProvider((prev) => (prev === p ? null : p));

  return (
    <div>
      <DomainHeader
        eyebrow="Module 05 / 10 · CSPM & Posture"
        title="Cloud Security"
        description="Misconfigurations, compliance and spend-risk across AWS, Azure and GCP."
      />

      <motion.div variants={riseContainer} initial="hidden" animate="show" className="grid grid-cols-12 gap-4">
        {/* Section A — KPI row */}
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <RingKpi label="Posture Score" value={posture} sub="CSPM posture" />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Open Misconfigs" value={open} delta={openDelta} invertDelta icon={ShieldAlert} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Critical Exposures" value={critical} icon={AlertTriangle} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Resources at Risk" value={resourcesAtRisk} icon={Boxes} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <KpiCard label="Monthly Spend" value={spendK} suffix="K" icon={Coins} format={(v) => `$${Math.round(v).toLocaleString("en-US")}`} />
        </GridCell>
        <GridCell className="col-span-12 sm:col-span-6 xl:col-span-2">
          <GaugeKpi score={risk} label="Cloud Risk" />
        </GridCell>

        {/* Section B — posture trend + provider split */}
        <GridCell className="col-span-12 lg:col-span-8">
          <SectionCard title="Posture Trend" subtitle="Posture score vs misconfiguration volume · target 90">
            <PostureTrend records={trendRecords} />
          </SectionCard>
        </GridCell>
        <GridCell className="col-span-12 lg:col-span-4">
          <SectionCard title="Provider Split" subtitle="Findings share by cloud · click to filter">
            <ProviderDonut records={filtered} selected={provider} onSelect={toggleProvider} />
          </SectionCard>
        </GridCell>

        {/* Section C — misconfig types + services */}
        <GridCell className="col-span-12 lg:col-span-6">
          <SectionCard title="Misconfiguration Types" subtitle="Top finding categories across providers">
            <MisconfigBars records={filtered} />
          </SectionCard>
        </GridCell>
        <GridCell className="col-span-12 lg:col-span-6">
          <SectionCard title="Findings by Service" subtitle="Stacked by severity">
            <ServiceStack records={filtered} />
          </SectionCard>
        </GridCell>

        {/* Section D — spend vs risk + benchmarks */}
        <GridCell className="col-span-12 lg:col-span-7">
          <SectionCard title="Spend vs Risk" subtitle="Service × provider bubbles · size = resources at risk">
            <SpendRiskScatter records={filtered} onSelect={toggleProvider} />
          </SectionCard>
        </GridCell>
        <GridCell className="col-span-12 lg:col-span-5">
          <SectionCard title="Compliance Benchmarks" subtitle="CIS foundations benchmark attainment">
            <ComplianceBenchmarks records={filtered} />
          </SectionCard>
        </GridCell>

        {/* Section E — findings explorer */}
        <motion.div variants={riseItem} className="col-span-12">
          <SectionCard
            title="Findings Explorer"
            subtitle={`${tableRecords.length.toLocaleString("en-US")} findings in scope`}
            actions={provider ? <LocalChip label={`Provider: ${provider}`} onClear={() => setProvider(null)} /> : undefined}
          >
            <DomainTable
              records={tableRecords}
              columns={columns}
              searchPlaceholder="Search id, finding, misconfig type…"
              renderDrawerExtra={(r) => <TypedCode code={remediationFor(r)} />}
              actionLabel={(r) => (r.status === "Resolved" ? null : "Mark remediated")}
              onAction={(_r, setStatus) => setStatus("Resolved")}
              drawerFields={(r) => [
                ["Service", serviceOf(r)],
                ["Spend at Risk", `$${(r.spend ?? 0).toLocaleString("en-US")}`],
              ]}
            />
          </SectionCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
