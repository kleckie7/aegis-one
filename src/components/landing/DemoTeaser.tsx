import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Bell, Search } from "lucide-react";
import KpiCard from "@/components/widgets/KpiCard";
import TrendChart from "@/components/widgets/TrendChart";
import SeverityDonut from "@/components/widgets/SeverityDonut";
import { applyFilters, incidentsByDomain, mttrMinutes, openCount, severityCounts, trendByMonth, formatMinutes } from "@/lib/data";
import { useFilterStore } from "@/stores/filterStore";
import { cn } from "@/lib/utils";

const QUARTER_PILLS = [
  { value: "all", label: "All" },
  { value: "Q1", label: "Q1" },
  { value: "Q2", label: "Q2" },
  { value: "Q3", label: "Q3" },
  { value: "Q4", label: "Q4" },
];

/** A real working slice of the Network Security dashboard, wired to useFilterStore */
export function DemoTeaser() {
  const month = useFilterStore((s) => s.month);
  const setFilters = useFilterStore((s) => s.setFilters);
  const reset = useFilterStore((s) => s.reset);
  const [morph, setMorph] = useState(0);

  // leave the global store clean for the app
  useEffect(() => () => reset(), [reset]);

  const data = useMemo(() => {
    const all = incidentsByDomain("network-security");
    const filtered = applyFilters(all, { month, environment: "all", team: "all", severity: "all" });
    return {
      filtered,
      open: openCount(filtered),
      mttr: mttrMinutes(filtered),
      total: filtered.length,
      trend: trendByMonth(filtered),
      sev: severityCounts(filtered.filter((r) => r.status !== "Resolved")),
    };
  }, [month]);

  return (
    <section id="demo" className="relative py-24 max-md:py-14">
      <div className="mx-auto max-w-[1200px] px-4 lg:px-6">
        <div className="text-center" data-reveal>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-cyan">Try it now</div>
          <h2 className="mt-4 font-display text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">
            This isn't a screenshot. <span className="text-gradient">Touch it.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-text-secondary">
            A live slice of the Network Security module. Flip the quarter pills — every widget recomputes instantly.
          </p>
        </div>

        <div className="mt-10 origin-center scale-100" data-demo-panel>
          {/* mini app-shell chrome */}
          <div className="overflow-hidden rounded-xl border border-hairline bg-base shadow-[0_24px_80px_rgba(0,0,0,.5)]">
            <div className="flex items-center gap-3 border-b border-hairline bg-surface-1/80 px-4 py-2.5">
              <img src="/logo.svg" alt="" className="h-5 w-5" />
              <span className="font-display text-xs font-bold text-text-primary">
                AEGIS <span className="text-gradient">ONE</span>
              </span>
              <span className="mx-1 h-4 w-px bg-hairline" />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                Command Center / Network Security
              </span>
              <div className="ml-auto flex items-center gap-2 text-text-muted">
                <Search className="h-3.5 w-3.5" />
                <Bell className="h-3.5 w-3.5" />
                <img src="/avatar-analyst.png" alt="" className="h-5 w-5 rounded-full border border-hairline" />
              </div>
            </div>
            <div className="flex items-center gap-2 border-b border-hairline bg-surface-1/40 px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Month</span>
              {QUARTER_PILLS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => {
                    setFilters({ month: p.value });
                    setMorph((v) => v + 1);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-all",
                    month === p.value
                      ? "border-transparent bg-accent-gradient font-semibold text-abyss"
                      : "border-hairline text-text-secondary hover:border-accent-cyan/40 hover:text-accent-cyan",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div key={morph} className="grid gap-4 p-4 md:grid-cols-3" style={{ animation: "filter-morph 250ms ease-out both" }}>
              <KpiCard label="Incidents" value={data.total} spark={data.trend.map((t) => t.reported)} />
              <KpiCard label="Open Now" value={data.open} />
              <KpiCard
                label="MTTR"
                value={data.mttr}
                format={(v) => formatMinutes(Math.round(v))}
                invertDelta
              />
              <div className="rounded-xl border border-hairline bg-surface-1 p-4 md:col-span-2">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                  Reported vs Resolved
                </div>
                <TrendChart data={data.trend} height={200} />
              </div>
              <div className="rounded-xl border border-hairline bg-surface-1 p-4">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
                  Open by Severity
                </div>
                <SeverityDonut data={data.sev} height={200} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8" data-reveal>
          <Link
            to="/app"
            className="group flex items-center justify-center gap-2 rounded-xl bg-accent-gradient bg-[length:200%_100%] bg-right px-6 py-4 font-display text-base font-semibold text-abyss transition-all duration-400 hover:bg-left hover:shadow-[0_0_48px_rgba(34,211,238,.35)]"
          >
            Enter the full suite
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default DemoTeaser;
