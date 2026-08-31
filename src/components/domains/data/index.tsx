import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MONTH_LABELS, type Incident } from "@/lib/data";
import { SEVERITIES, SEVERITY_COLORS, type Severity } from "@/lib/domains";
import { AXIS_TICK, GRID_STROKE, useFilterKey } from "@/components/widgets/shared";
import { ColorDonut, hashStr } from "@/components/domains/utils";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Enrichment (deterministic from record id)                           */
/* ------------------------------------------------------------------ */

export const SYSTEMS = ["Customer DB", "HR Platform", "Payments Vault", "File Shares", "Email", "Data Warehouse"] as const;
export const UNITS = ["Finance", "Engineering", "Sales", "HR", "Operations"] as const;
export const CLASSIFICATIONS = ["Restricted", "Confidential", "Internal", "Public"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

export const CLASSIFICATION_COLORS: Record<Classification, string> = {
  Restricted: "#F43F5E",
  Confidential: "#FB923C",
  Internal: "#22D3EE",
  Public: "#64748B",
};

export interface DataEnrichment {
  system: string;
  unit: string;
  classification: Classification;
  recordsAffected: number;
}

export function enrich(r: Incident): DataEnrichment {
  const h = hashStr(r.id);
  const sevBase: Record<Severity, number> = { Critical: 40000, High: 18000, Medium: 6000, Low: 1500 };
  return {
    system: SYSTEMS[h % SYSTEMS.length],
    unit: UNITS[Math.floor(h / 6) % UNITS.length],
    classification: CLASSIFICATIONS[Math.floor(h / 30) % CLASSIFICATIONS.length],
    recordsAffected: Math.round(sevBase[r.severity] * (0.3 + ((h % 100) / 100) * 1.4)),
  };
}

/* ------------------------------------------------------------------ */
/* Section B — incident trendline + avg detection time (right axis)     */
/* ------------------------------------------------------------------ */

export function DetectionTrend({ records }: { records: Incident[] }) {
  const filterKey = useFilterKey();
  const data = useMemo(
    () =>
      MONTH_LABELS.map((month, i) => {
        const rows = records.filter((r) => new Date(r.detectedAt).getUTCMonth() === i);
        const det = rows.length ? rows.reduce((a, r) => a + r.responseMinutes, 0) / rows.length / 60 : 0;
        return {
          month,
          reported: rows.length,
          resolved: rows.filter((r) => r.resolvedAt).length,
          detH: Math.round(det * 10) / 10,
        };
      }),
    [records],
  );
  return (
    <div style={{ height: 300 }} key={filterKey} role="img" aria-label="Reported vs resolved trend with average detection time">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id="dataReported" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
          <YAxis yAxisId="left" tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
          <YAxis yAxisId="right" orientation="right" unit="h" tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-hairline bg-surface-2/95 px-3 py-2 shadow-xl backdrop-blur-md">
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">{label}</div>
                  {payload.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 font-mono text-xs">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: String(p.color ?? "#22D3EE") }} />
                      <span className="text-text-secondary">{p.name}</span>
                      <span className="ml-auto pl-3 font-semibold text-text-primary font-tnum">{String(p.value)}</span>
                    </div>
                  ))}
                </div>
              ) : null
            }
            cursor={{ stroke: "rgba(148,163,184,.25)" }}
          />
          <Area yAxisId="left" type="monotone" dataKey="reported" name="Reported" stroke="#22D3EE" strokeWidth={2} fill="url(#dataReported)" isAnimationActive animationDuration={700} animationEasing="ease-out" />
          <Line yAxisId="left" type="monotone" dataKey="resolved" name="Resolved" stroke="#34D399" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#34D399", stroke: "#0A0E16" }} isAnimationActive animationDuration={700} animationEasing="ease-out" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="detH"
            name="Avg detection (h)"
            stroke="#A78BFA"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive
            animationDuration={900}
            animationBegin={300}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-1 flex items-center justify-center gap-4 font-mono text-[11px] text-text-secondary">
        {[
          ["Reported", "#22D3EE"],
          ["Resolved", "#34D399"],
          ["Avg detection (h)", "#A78BFA"],
        ].map(([n, c]) => (
          <span key={n} className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Classification donut                                                */
/* ------------------------------------------------------------------ */

export function ClassificationDonut({
  records,
  selected,
  onSelect,
}: {
  records: Incident[];
  selected: string | null;
  onSelect: (c: string) => void;
}) {
  const data = CLASSIFICATIONS.map((c) => ({
    name: c as string,
    value: records.filter((r) => enrich(r).classification === c).length,
  })).filter((d) => d.value > 0);
  return (
    <ColorDonut
      data={data}
      colors={CLASSIFICATION_COLORS as Record<string, string>}
      centerLabel="INCIDENTS"
      onSelect={onSelect}
      selected={selected}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Section D — incidents by system (bars colored by dominant severity)  */
/* ------------------------------------------------------------------ */

export function SystemsBar({ records }: { records: Incident[] }) {
  const filterKey = useFilterKey();
  const data = useMemo(
    () =>
      SYSTEMS.map((system) => {
        const rows = records.filter((r) => enrich(r).system === system);
        let dominant: Severity = "Low";
        for (const sev of SEVERITIES) {
          if (rows.some((r) => r.severity === sev && r.status !== "Resolved")) {
            dominant = sev;
            break;
          }
        }
        return { system, count: rows.length, fill: SEVERITY_COLORS[dominant] };
      }),
    [records],
  );
  return (
    <div style={{ height: 280 }} key={filterKey} role="img" aria-label="Incidents by system, colored by dominant severity">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="system" tick={{ ...AXIS_TICK, fontSize: 9 }} tickLine={false} axisLine={{ stroke: GRID_STROKE }} interval={0} angle={-16} textAnchor="end" height={48} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,.06)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-hairline bg-surface-2/95 px-3 py-2 shadow-xl backdrop-blur-md">
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">{label}</div>
                  <div className="font-mono text-xs text-text-secondary">
                    Incidents <span className="ml-2 font-semibold text-text-primary font-tnum">{String(payload[0].value)}</span>
                  </div>
                </div>
              ) : null
            }
          />
          <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]} barSize={30} isAnimationActive animationDuration={700} animationEasing="ease-out">
            {data.map((d) => (
              <Cell key={d.system} fill={d.fill} fillOpacity={0.85} />
            ))}
            <LabelList dataKey="count" position="top" style={{ fill: "#94A3B8", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Incidents by business unit — ranked list                            */
/* ------------------------------------------------------------------ */

export function BusinessUnitList({
  records,
  selected,
  onSelect,
}: {
  records: Incident[];
  selected: string | null;
  onSelect: (u: string) => void;
}) {
  const rows = useMemo(
    () =>
      UNITS.map((unit) => {
        const ur = records.filter((r) => enrich(r).unit === unit);
        return {
          unit,
          count: ur.length,
          records: ur.reduce((a, r) => a + enrich(r).recordsAffected, 0),
        };
      }).sort((a, b) => b.count - a.count),
    [records],
  );
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="space-y-3">
      {rows.map((r, i) => (
        <button
          key={r.unit}
          onClick={() => onSelect(r.unit)}
          className={cn(
            "block w-full rounded-lg border px-3 py-2 text-left transition-colors",
            selected === r.unit ? "border-accent-cyan/40 bg-accent-cyan/5" : "border-transparent hover:border-hairline hover:bg-surface-2/60",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className={cn("text-xs", selected === r.unit ? "text-accent-cyan" : "text-text-secondary")}>{r.unit}</span>
            <span className="font-mono text-xs text-text-primary font-tnum">
              {r.count}
              <span className="ml-2 text-[10px] text-text-muted">{r.records.toLocaleString("en-US")} rec</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full rounded-full bg-info-blue/80"
              style={{ transformOrigin: "left" }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: r.count / max }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </button>
      ))}
    </div>
  );
}
