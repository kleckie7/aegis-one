import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, ShieldAlert, X } from "lucide-react";
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
import { FilterMorph, useCountUp } from "@/components/widgets/shared";
import FleetMatrix from "@/components/domains/iot/FleetMatrix";
import ProtocolDonut from "@/components/domains/iot/ProtocolDonut";
import FirmwareStack from "@/components/domains/iot/FirmwareStack";
import DeviceTypeIncidents from "@/components/domains/iot/DeviceTypeIncidents";
import SeverityBars from "@/components/domains/iot/SeverityBars";
import {
  TOTAL_DEVICES,
  TOTAL_ROGUE,
  scaledCount,
  scaledTypes,
  type CellState,
} from "@/components/domains/iot/data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/** Rogue-devices KPI with a pulsing rose anomaly dot. */
function RogueKpi({ value }: { value: number }) {
  const counted = useCountUp(value);
  return (
    <div className="group rounded-xl border border-hairline bg-surface-1 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            Rogue Devices
            <span
              className="h-1.5 w-1.5 rounded-full bg-sev-critical"
              style={{ animation: "iot-rogue-pulse 2s ease-in-out infinite" }}
            />
          </div>
          <div className="mt-2 font-mono text-[30px] font-semibold leading-none text-sev-critical font-tnum">
            {Math.round(counted)}
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            unmanaged on network
          </div>
        </div>
        <div className="shrink-0 rounded-lg border border-hairline bg-surface-2 p-2 text-sev-critical shadow-[0_0_16px_rgba(244,63,94,.12)]">
          <ShieldAlert className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export default function IotSecurity() {
  const filters = useFilters();
  const records = useMemo(() => incidentsByDomain("iot-security"), []);
  const filtered = useMemo(() => applyFilters(records, filters), [records, filters]);

  const [cellState, setCellState] = useState<CellState | null>(null);
  const tableCategory =
    cellState === "rogue" ? "Rogue Device" : cellState === "outdated" || cellState === "eol" ? "Firmware Exploit" : null;
  const tableRows = useMemo(
    () => (tableCategory ? filtered.filter((r) => r.category === tableCategory) : filtered),
    [filtered, tableCategory],
  );

  const trend = useMemo(() => trendByMonth(filtered), [filtered]);
  const sev = useMemo(() => severityCounts(filtered), [filtered]);
  const open = openCount(filtered);
  const mttrH = mttrMinutes(filtered) / 60;
  const risk = riskScore(filtered);
  const openDelta = periodDelta(records, filters, openCount);
  const devices = scaledCount(TOTAL_DEVICES, filters.environment);
  const rogue = scaledCount(TOTAL_ROGUE, filters.environment);
  const fwCurrent = useMemo(() => {
    const types = scaledTypes(filters.environment);
    const cur = types.reduce((a, t) => a + t.current, 0);
    const tot = types.reduce((a, t) => a + t.count, 0);
    return tot ? Math.round((cur / tot) * 100) : 0;
  }, [filters.environment]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      <style>{`@keyframes iot-rogue-pulse { 0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(244,63,94,.6) } 50% { opacity: .4; box-shadow: 0 0 0 5px rgba(244,63,94,0) } }`}</style>
      {/* Section A — Header */}
      <motion.header variants={item}>
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent-cyan">
          Module 01 / 10 · Connected Fleet
        </div>
        <h2 className="mt-1.5 font-display text-[28px] font-bold tracking-tight text-text-primary">
          IoT Security
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Risk posture for {devices.toLocaleString("en-US")} connected devices across 7 device classes.
        </p>
      </motion.header>

      {/* Section A — KPI row */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Devices" value={devices} icon={Cpu} />
        <RogueKpi value={rogue} />
        <KpiCard label="Firmware Current" value={fwCurrent} format={(v) => `${Math.round(v)}%`} />
        <KpiCard
          label="Open Incidents"
          value={open}
          delta={openDelta}
          invertDelta
          spark={sparkline(filtered)}
        />
        <KpiCard label="Avg Response" value={mttrH} format={(v) => `${v.toFixed(1)}h`} invertDelta delta={null} />
        <div className="col-span-2 flex items-center justify-center rounded-xl border border-hairline bg-surface-1 py-2 transition-all duration-300 hover:shadow-glow md:col-span-1">
          <RiskGauge score={risk} label="FLEET RISK" size={150} />
        </div>
      </motion.div>

      <FilterMorph className="contents">
        {/* Section B — Fleet matrix + protocol breakdown */}
        <motion.div variants={item} className="grid grid-cols-12 gap-4">
          <SectionCard
            title="Device Fleet Matrix"
            subtitle={`${devices.toLocaleString("en-US")} devices · virtualized 1 cell ≈ 4 devices`}
            className="col-span-12 xl:col-span-7"
          >
            <FleetMatrix
              environment={filters.environment}
              activeState={cellState}
              onSelectState={setCellState}
            />
          </SectionCard>
          <SectionCard
            title="Protocol Breakdown"
            subtitle="Share of device traffic"
            className="col-span-12 xl:col-span-5"
          >
            <ProtocolDonut environment={filters.environment} />
          </SectionCard>
        </motion.div>

        {/* Section C — Firmware + trend */}
        <motion.div variants={item} className="grid grid-cols-12 gap-4">
          <SectionCard
            title="Firmware Status"
            subtitle="Per device class"
            className="col-span-12 xl:col-span-4"
          >
            <FirmwareStack environment={filters.environment} />
          </SectionCard>
          <SectionCard
            title="Incident Trend"
            subtitle="Reported vs resolved · Jul botnet-campaign spike"
            className="col-span-12 xl:col-span-8"
          >
            <TrendChart data={trend} height={280} />
          </SectionCard>
        </motion.div>

        {/* Section D — Device type + severity */}
        <motion.div variants={item} className="grid grid-cols-12 gap-4">
          <SectionCard
            title="Incidents by Device Type"
            subtitle="Resolved vs open"
            className="col-span-12 xl:col-span-6"
          >
            <DeviceTypeIncidents incidents={filtered} />
          </SectionCard>
          <SectionCard
            title="Severity Distribution"
            subtitle="Filtered incidents"
            className="col-span-12 xl:col-span-6"
          >
            <SeverityBars data={sev} />
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
              tableCategory ? (
                <button
                  onClick={() => setCellState(null)}
                  className="flex items-center gap-1.5 rounded-full border border-accent-cyan/50 bg-accent-cyan/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-cyan transition-colors hover:bg-accent-cyan/20"
                >
                  {tableCategory}
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
