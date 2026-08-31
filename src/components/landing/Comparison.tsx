import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import RiskGauge from "@/components/widgets/RiskGauge";
import { incidentsByDomain, trendByMonth } from "@/lib/data";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

const OLD_POINTS = [
  "Static slicers, manual refresh",
  "10 siloed files to juggle",
  "Dated 2010-era visuals",
  "No cross-domain view",
  "Breaks when you edit formulas",
];

const NEW_POINTS = [
  "Global live filters, instant recompute",
  "All 10 domains in one shell",
  "Modern SOC-grade design",
  "Unified command center + risk heatmap",
  "Nothing to break — it's code",
];

/** auto-playing 6s loop: risk gauge + trend animate while in view */
function LivePreview() {
  const [score, setScore] = useState(42);
  const trend = useMemo(() => trendByMonth(incidentsByDomain("soc")).map((t) => ({ i: t.month, v: t.reported })), []);

  useEffect(() => {
    const targets = [42, 67, 31, 58, 47, 73];
    let i = 0;
    const iv = setInterval(() => {
      i = (i + 1) % targets.length;
      setScore(targets[i]);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex items-center gap-4 rounded-lg border border-hairline bg-base p-4">
      <div className="w-36 shrink-0">
        <RiskGauge score={score} size={140} />
      </div>
      <div className="h-28 min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trend} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
            <defs>
              <linearGradient id="cmp-trend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#22D3EE"
              strokeWidth={2}
              fill="url(#cmp-trend)"
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function Comparison() {
  return (
    <section id="compare" className="relative py-24 max-md:py-14">
      <div className="mx-auto max-w-[1200px] px-4 lg:px-6">
        <div className="text-center" data-reveal>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-cyan">Old way vs AEGIS ONE</div>
          <h2 className="mt-4 font-display text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">
            The bundle grew up.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {/* old way */}
          <div data-compare="left" className="rounded-xl border border-hairline bg-surface-1 p-6 opacity-90">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-xl font-semibold text-text-secondary">Excel Bundle</h3>
              <span className="font-mono text-sm text-text-muted font-tnum">$89.99</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-hairline">
              <div className="flex items-center gap-1.5 border-b border-hairline bg-surface-2 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-text-muted/40" />
                <span className="h-2 w-2 rounded-full bg-text-muted/40" />
                <span className="h-2 w-2 rounded-full bg-text-muted/40" />
                <span className="ml-2 font-mono text-[10px] text-text-muted">CyberSecurity-Dashboard-FINAL-v7.xlsm</span>
              </div>
              <img src="/excel-old.jpg" alt="A dated, cluttered Excel security dashboard" className="w-full opacity-80 saturate-50" />
            </div>
            <ul className="mt-5 space-y-2.5">
              {OLD_POINTS.map((p) => (
                <li key={p} data-compare-item className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-sev-critical" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* AEGIS ONE */}
          <div
            data-compare="right"
            className="rounded-xl border border-accent-cyan/40 bg-surface-1 p-[1px] shadow-glow"
          >
            <div className="h-full rounded-[11px] bg-surface-1 p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-xl font-semibold">
                  AEGIS ONE <span className="text-gradient">Live Suite</span>
                </h3>
                <span className="font-mono text-sm text-accent-emerald font-tnum">Included</span>
              </div>
              <div className="mt-4">
                <LivePreview />
              </div>
              <ul className="mt-5 space-y-2.5">
                {NEW_POINTS.map((p) => (
                  <li key={p} data-compare-item className="flex items-start gap-2.5 text-sm text-text-secondary">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Comparison;
