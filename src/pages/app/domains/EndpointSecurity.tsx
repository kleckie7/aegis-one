import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Laptop, Lock, MonitorSmartphone, ShieldCheck, Zap } from "lucide-react";
import {
  applyFilters,
  categoryCounts,
  incidentsByDomain,
  openCount,
  periodDelta,
  riskScore,
  trendByMonth,
  type Incident,
} from "@/lib/data";
import { useFilters } from "@/stores/filterStore";
import { FilterMorph } from "@/components/widgets/shared";
import SectionCard from "@/components/widgets/SectionCard";
import KpiCard from "@/components/widgets/KpiCard";
import PageHeader from "@/components/domains/PageHeader";
import GaugeKpiCard from "@/components/domains/GaugeKpiCard";
import GenericDonut from "@/components/domains/GenericDonut";
import HBarList from "@/components/domains/HBarList";
import ActionButton from "@/components/domains/ActionButton";
import DomainExplorer from "@/components/domains/DomainExplorer";
import DetectionTrend from "@/components/domains/endpoint/DetectionTrend";
import ComplianceHeatStrip from "@/components/domains/endpoint/ComplianceHeatStrip";
import NonCompliantTable from "@/components/domains/endpoint/NonCompliantTable";

const rise = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h / 4294967296;
}

function deviceOf(r: Incident): { hostname: string; os: string } {
  const h = hash(r.id);
  const kind = h < 0.74 ? "ws" : h < 0.94 ? "lt" : "srv";
  const hostname = `${kind}-${r.team.split(" ")[0].toLowerCase().slice(0, 4)}-${String(100 + (Math.floor(h * 9000) % 900))}`;
  const os = h < 0.71 ? "Windows 11" : h < 0.89 ? "macOS 15" : "Ubuntu 24.04";
  return { hostname, os };
}

function DeviceContext({ incident }: { incident: Incident }) {
  const d = deviceOf(incident);
  const h = hash(incident.id);
  return (
    <div className="rounded-lg border border-hairline bg-surface-2/50 p-4">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Device context</div>
      <div className="font-mono text-sm text-accent-cyan">{d.hostname}</div>
      <div className="mt-1 text-xs text-text-secondary">{d.os}</div>
      <div className="mt-3 flex items-center gap-4 font-mono text-[10px] uppercase tracking-wider">
        <span className="flex items-center gap-1.5 text-accent-emerald">
          <Lock className="h-3.5 w-3.5" /> {h > 0.03 ? "Encrypted" : "Unencrypted"}
        </span>
        <span className="flex items-center gap-1.5 text-accent-emerald">
          <ShieldCheck className="h-3.5 w-3.5" /> Agent {h > 0.06 ? "healthy" : "degraded"}
        </span>
        <span className="flex items-center gap-1.5 text-text-muted">
          <Laptop className="h-3.5 w-3.5" /> {incident.environment}
        </span>
      </div>
    </div>
  );
}

export default function EndpointSecurity() {
  const filters = useFilters();
  const all = useMemo(() => incidentsByDomain("endpoint-security"), []);
  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);

  const stats = useMemo(() => {
    const envScale =
      filters.environment === "Production" ? 0.45 : filters.environment === "Corporate" ? 0.4 : filters.environment === "Staging" ? 0.15 : 1;
    const fleet = Math.round(3940 * envScale);
    const jitter = hash(`${filters.month}|${filters.environment}|${filters.team}|${filters.severity}`);
    const compliant = Math.min(99.8, 98.2 + jitter * 1.4);
    const encrypted = Math.min(99.6, 96.4 + jitter * 1.5);
    const quarantined = filtered.filter((r) => r.category === "Quarantine").length;

    const osData = [
      { name: "Windows", value: Math.round(fleet * 0.71), color: "#60A5FA" },
      { name: "macOS", value: Math.round(fleet * 0.18), color: "#64748B" },
      { name: "Linux", value: Math.round(fleet * 0.11), color: "#FBBF24" },
    ];

    const types = categoryCounts(filtered, 6).map((c) => ({
      name: c.name,
      value: c.value,
      color: c.name === "Ransomware Block" ? "#F43F5E" : "#22D3EE",
      shimmer: c.name === "Ransomware Block",
    }));

    const resolved = filtered.filter((r) => r.status === "Resolved").length;
    const quar = filtered.filter((r) => r.status !== "Resolved" && r.category === "Quarantine").length;
    const manual = filtered.filter((r) => r.status === "In Progress" && r.category !== "Quarantine").length;
    const escalated = Math.max(0, filtered.length - resolved - quar - manual);
    const total = Math.max(1, filtered.length);
    const actions = [
      { name: "Auto-remediated", value: resolved, color: "#34D399" },
      { name: "Quarantined", value: quar, color: "#FBBF24" },
      { name: "Manual response", value: manual, color: "#22D3EE" },
      { name: "Escalated", value: escalated, color: "#F43F5E" },
    ];

    return {
      fleet,
      compliant,
      encrypted,
      detections: filtered.length,
      quarantined,
      risk: riskScore(filtered),
      trend: trendByMonth(filtered),
      osData,
      types,
      actions,
      automation: Math.round((resolved / total) * 100),
      open: openCount(filtered),
    };
  }, [filtered, filters]);

  const deltaDet = periodDelta(all, filters, (r) => r.length);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Module 10 / 10 · Fleet & EDR"
        title="Endpoint Security"
        descriptor="Compliance, encryption and detection response across 3,940 endpoints."
      />

      {/* Section A — KPI row */}
      <FilterMorph>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <motion.div {...rise(0)}>
            <KpiCard label="Endpoints" value={stats.fleet} icon={MonitorSmartphone} />
          </motion.div>
          <motion.div {...rise(1)}>
            <KpiCard label="Compliant" value={stats.compliant} format={(v) => `${v.toFixed(1)}%`} icon={CheckCircle2} />
          </motion.div>
          <motion.div {...rise(2)}>
            <KpiCard label="Encrypted" value={stats.encrypted} format={(v) => `${v.toFixed(1)}%`} icon={Lock} />
          </motion.div>
          <motion.div {...rise(3)}>
            <KpiCard label="EDR Detections" value={stats.detections} delta={deltaDet} invertDelta icon={Zap} />
          </motion.div>
          <motion.div {...rise(4)}>
            <KpiCard label="Quarantined" value={stats.quarantined} icon={ShieldCheck} />
          </motion.div>
          <motion.div {...rise(5)}>
            <GaugeKpiCard score={stats.risk} />
          </motion.div>
        </div>
      </FilterMorph>

      {/* Section B — Detection trend + OS */}
      <div className="grid grid-cols-12 gap-4">
        <SectionCard title="Detection Trend" subtitle="EDR detections vs remediations · Sep outbreak" className="col-span-12 lg:col-span-8">
          <DetectionTrend data={stats.trend} height={280} />
        </SectionCard>
        <SectionCard title="OS Distribution" subtitle="Fleet composition" className="col-span-12 lg:col-span-4">
          <FilterMorph>
            <GenericDonut
              data={stats.osData}
              centerValue={stats.fleet.toLocaleString("en-US")}
              centerLabel="Devices"
              height={280}
              ariaLabel="OS distribution"
            />
          </FilterMorph>
        </SectionCard>
      </div>

      {/* Section C — Detection breakdown + response actions */}
      <div className="grid grid-cols-12 gap-4">
        <SectionCard title="Detection Types" subtitle="EDR detection categories" className="col-span-12 lg:col-span-6">
          <HBarList items={stats.types} />
        </SectionCard>
        <SectionCard title="Response Actions" subtitle="How detections were handled" className="col-span-12 lg:col-span-6">
          <FilterMorph>
            <GenericDonut
              data={stats.actions}
              centerValue={`${stats.automation}%`}
              centerLabel="Automated"
              height={260}
              ariaLabel="Response action distribution"
            />
          </FilterMorph>
        </SectionCard>
      </div>

      {/* Section D — Compliance heat strip + non-compliant devices */}
      <div className="grid grid-cols-12 gap-4">
        <SectionCard title="Compliance Heat Strip" subtitle="12 months × 4 policy checks · click a column to filter" className="col-span-12 xl:col-span-5">
          <ComplianceHeatStrip />
        </SectionCard>
        <SectionCard
          title="Non-Compliant Devices"
          subtitle="Endpoints failing policy checks"
          className="col-span-12 xl:col-span-7"
          actions={
            <span className="rounded-full border border-sev-high/40 bg-sev-high/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-sev-high">
              36 devices need attention
            </span>
          }
        >
          <NonCompliantTable />
        </SectionCard>
      </div>

      {/* Section E — Incident explorer */}
      <SectionCard title="Incident Explorer" subtitle="END- records with device context" className="col-span-12">
        <DomainExplorer
          incidents={filtered}
          searchPlaceholder="Search id, detection, device, team…"
          extraColumns={[
            { header: "Device", cell: (r: Incident) => <span className="font-mono text-xs text-text-secondary">{deviceOf(r).hostname}</span>, sortValue: (r) => deviceOf(r).hostname },
            { header: "Detection", cell: (r) => r.category, sortValue: (r) => r.category },
          ]}
          drawerBody={(r) => <DeviceContext incident={r} />}
          drawerActions={(r) => (
            <div className="flex gap-2">
              <ActionButton label="Run full scan" successMessage={`Full scan started on ${deviceOf(r).hostname}`} />
              <ActionButton label="Isolate" successMessage={`${deviceOf(r).hostname} isolated from network`} variant="danger" />
            </div>
          )}
        />
      </SectionCard>
    </div>
  );
}
