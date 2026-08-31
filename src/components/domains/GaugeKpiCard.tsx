import RiskGauge from "@/components/widgets/RiskGauge";

interface GaugeKpiCardProps {
  score: number;
  label?: string;
}

/** KPI-sized card wrapping the shared RiskGauge (the "73%"-style live gauge) */
export function GaugeKpiCard({ score, label = "RISK SCORE" }: GaugeKpiCardProps) {
  return (
    <div className="group flex flex-col justify-between rounded-xl border border-hairline bg-surface-1 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
      <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
        {label}
      </div>
      <div className="-mb-2 mt-1 flex justify-center">
        <RiskGauge score={score} label={label} size={132} />
      </div>
    </div>
  );
}

export default GaugeKpiCard;
