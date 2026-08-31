import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { MONTH_LABELS, riskScore, type Incident } from "@/lib/data";
import { SEVERITIES, SEVERITY_COLORS } from "@/lib/domains";
import { AXIS_TICK, GRID_STROKE, useFilterKey } from "@/components/widgets/shared";
import { ColorDonut, RankedBars, hashStr } from "@/components/domains/utils";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Enrichment                                                          */
/* ------------------------------------------------------------------ */

export const PROVIDERS = ["AWS", "Azure", "GCP"] as const;
export type Provider = (typeof PROVIDERS)[number];
export const PROVIDER_COLORS: Record<Provider, string> = { AWS: "#FB923C", Azure: "#60A5FA", GCP: "#34D399" };

export const SERVICES = ["Compute", "Storage", "Database", "Networking", "Identity"] as const;
export const serviceOf = (r: Incident): string => SERVICES[hashStr(r.id) % SERVICES.length];

export const ROSE_TYPES = new Set(["Public Bucket", "Key Exposure"]);

const REMEDIATION: Record<string, string> = {
  "Public Bucket":
    "aws s3api put-public-access-block --bucket $BUCKET \\\n  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true",
  "Overprivileged IAM":
    "aws iam put-role-policy --role-name $ROLE \\\n  --policy-name least-privilege --policy-document file://scoped-policy.json",
  "Unencrypted Store": "aws s3api put-bucket-encryption --bucket $BUCKET \\\n  --server-side-encryption-configuration '{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"aws:kms\"}}]}'",
  "Open Security Group":
    "aws ec2 revoke-security-group-ingress --group-id $SG \\\n  --protocol tcp --port 0-65535 --cidr 0.0.0.0/0",
  "Missing Logging": "aws cloudtrail put-event-selectors --trail-name org-trail \\\n  --event-selectors file://log-all-events.json",
  "Key Exposure": "aws iam update-access-key --access-key-id $KEY --status Inactive \\\n  && aws iam delete-access-key --access-key-id $KEY",
};

/** Mono code block that types itself in when mounted (drawer delight). */
export function TypedCode({ code }: { code: string }) {
  const [n, setN] = useState(0);
  const [prevCode, setPrevCode] = useState(code);
  if (prevCode !== code) {
    // reset typing when a different record opens (render-phase adjust, no effect setState)
    setPrevCode(code);
    setN(0);
  }
  useEffect(() => {
    const t = setInterval(() => {
      setN((v) => {
        if (v >= code.length) {
          clearInterval(t);
          return v;
        }
        return v + 2;
      });
    }, 1000 / 30 * 2); // ~30 chars/s
    return () => clearInterval(t);
  }, [code]);
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Remediation</div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-hairline bg-abyss/70 p-3 font-mono text-[11px] leading-relaxed text-accent-emerald">
        {code.slice(0, n)}
        <span className="animate-caret-blink text-accent-cyan">▌</span>
      </pre>
    </div>
  );
}

export const remediationFor = (r: Incident): string =>
  REMEDIATION[r.category] ?? "aegis remediate --finding " + r.id + " --auto";

/* ------------------------------------------------------------------ */
/* Section B — Posture trend (line) + misconfig bars + target line      */
/* ------------------------------------------------------------------ */

export function PostureTrend({ records }: { records: Incident[] }) {
  const filterKey = useFilterKey();
  const data = useMemo(
    () =>
      MONTH_LABELS.map((month, i) => {
        const rows = records.filter((r) => new Date(r.detectedAt).getUTCMonth() === i);
        const good = rows.filter((r) => r.status === "Resolved").length + rows.filter((r) => r.status === "In Progress").length * 0.5;
        return {
          month,
          posture: rows.length ? Math.round((good / rows.length) * 100) : null,
          misconfigs: rows.length,
        };
      }),
    [records],
  );
  return (
    <div style={{ height: 300 }} key={filterKey} role="img" aria-label="Posture score trend with misconfiguration volume">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -10 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
          <YAxis yAxisId="left" domain={[0, 100]} tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
          <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
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
          <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94A3B8" }} />
          <ReferenceLine
            yAxisId="left"
            y={90}
            stroke="#34D399"
            strokeDasharray="6 4"
            label={{ value: "TARGET 90", position: "insideTopLeft", fill: "#34D399", fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
          />
          <Bar yAxisId="right" dataKey="misconfigs" name="Misconfigs" fill="#F43F5E" fillOpacity={0.45} radius={[4, 4, 0, 0]} barSize={14} isAnimationActive animationDuration={700} animationEasing="ease-out" />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="posture"
            name="Posture score"
            stroke="#22D3EE"
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: "#22D3EE", stroke: "#0A0E16" }}
            connectNulls
            isAnimationActive
            animationDuration={900}
            animationBegin={300}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Provider split donut                                                */
/* ------------------------------------------------------------------ */

export function ProviderDonut({
  records,
  selected,
  onSelect,
}: {
  records: Incident[];
  selected: string | null;
  onSelect: (p: string) => void;
}) {
  const data = PROVIDERS.map((p) => ({ name: p as string, value: records.filter((r) => r.provider === p).length })).filter(
    (d) => d.value > 0,
  );
  return (
    <ColorDonut
      data={data}
      colors={PROVIDER_COLORS as Record<string, string>}
      centerLabel="FINDINGS"
      onSelect={onSelect}
      selected={selected}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Section C — misconfig types + findings by service                    */
/* ------------------------------------------------------------------ */

export function MisconfigBars({ records }: { records: Incident[] }) {
  const items = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of records) map.set(r.category, (map.get(r.category) ?? 0) + 1);
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({
        name,
        value,
        highlight: ROSE_TYPES.has(name),
        sub: `${Math.round(value * 2.4)} resources affected`,
      }));
  }, [records]);
  return <RankedBars items={items} />;
}

export function ServiceStack({ records }: { records: Incident[] }) {
  const filterKey = useFilterKey();
  const data = useMemo(
    () =>
      SERVICES.map((service) => {
        const rows = records.filter((r) => serviceOf(r) === service);
        const out: Record<string, number | string> = { service };
        for (const sev of SEVERITIES) out[sev] = rows.filter((r) => r.severity === sev).length;
        return out;
      }),
    [records],
  );
  return (
    <div style={{ height: 280 }} key={filterKey} role="img" aria-label="Findings by cloud service stacked by severity">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="service" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,.06)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-lg border border-hairline bg-surface-2/95 px-3 py-2 shadow-xl backdrop-blur-md">
                  <div className="mb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">{label}</div>
                  {payload.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 font-mono text-xs">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: String(p.color) }} />
                      <span className="text-text-secondary">{p.name}</span>
                      <span className="ml-auto pl-3 font-semibold text-text-primary font-tnum">{String(p.value)}</span>
                    </div>
                  ))}
                </div>
              ) : null
            }
          />
          <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94A3B8" }} />
          {SEVERITIES.map((sev, i) => (
            <Bar
              key={sev}
              dataKey={sev}
              stackId="sev"
              fill={SEVERITY_COLORS[sev]}
              radius={i === 0 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              barSize={26}
              isAnimationActive
              animationDuration={700}
              animationBegin={i * 50}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section D — spend vs risk scatter (signature) + benchmarks           */
/* ------------------------------------------------------------------ */

interface Bubble {
  provider: Provider;
  service: string;
  spend: number; // $K
  risk: number;
  resources: number;
  count: number;
}

export function SpendRiskScatter({
  records,
  onSelect,
}: {
  records: Incident[];
  onSelect: (p: string) => void;
}) {
  const filterKey = useFilterKey();
  const { byProvider, medianSpend, medianRisk } = useMemo(() => {
    const combos: Bubble[] = [];
    for (const p of PROVIDERS) {
      for (const s of SERVICES) {
        const rows = records.filter((r) => r.provider === p && serviceOf(r) === s);
        if (rows.length === 0) continue;
        combos.push({
          provider: p,
          service: s,
          spend: Math.round(rows.reduce((a, r) => a + (r.spend ?? 0), 0) / 100) / 10,
          risk: riskScore(rows),
          resources: rows.filter((r) => r.status !== "Resolved").length,
          count: rows.length,
        });
      }
    }
    const spends = combos.map((c) => c.spend).sort((a, b) => a - b);
    const risks = combos.map((c) => c.risk).sort((a, b) => a - b);
    const med = (arr: number[]) => (arr.length ? arr[Math.floor(arr.length / 2)] : 0);
    return {
      byProvider: PROVIDERS.map((p) => ({ provider: p, bubbles: combos.filter((c) => c.provider === p) })),
      medianSpend: med(spends),
      medianRisk: med(risks),
    };
  }, [records]);

  const maxSpend = Math.max(10, ...byProvider.flatMap((g) => g.bubbles.map((b) => b.spend)));

  return (
    <div style={{ height: 320 }} key={filterKey} role="img" aria-label="Cloud spend versus risk scatter by provider and service">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 12, bottom: 0, left: -10 }}>
          <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" />
          <XAxis
            type="number"
            dataKey="spend"
            name="Monthly spend"
            unit="K"
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={{ stroke: GRID_STROKE }}
            label={{ value: "MONTHLY SPEND ($K)", position: "insideBottom", offset: -2, fill: "#5B6B80", fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
            domain={[0, Math.ceil(maxSpend * 1.15)]}
          />
          <YAxis
            type="number"
            dataKey="risk"
            name="Risk score"
            domain={[0, 100]}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <ZAxis type="number" dataKey="resources" range={[60, 420]} name="Resources at risk" />
          <Tooltip
            cursor={{ strokeDasharray: "3 3", stroke: "rgba(148,163,184,.25)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const b = payload[0].payload as Bubble;
              return (
                <div className="rounded-lg border border-hairline bg-surface-2/95 px-3 py-2 shadow-xl backdrop-blur-md">
                  <div className="mb-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: PROVIDER_COLORS[b.provider] }}>
                    {b.provider} · {b.service}
                  </div>
                  {[
                    ["Monthly spend", `$${b.spend.toFixed(1)}K`],
                    ["Risk score", String(b.risk)],
                    ["Resources at risk", String(b.resources)],
                    ["Findings", String(b.count)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-text-secondary">{k}</span>
                      <span className="ml-auto pl-3 font-semibold text-text-primary font-tnum">{v}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <ReferenceArea
            x1={medianSpend}
            x2={Math.ceil(maxSpend * 1.15)}
            y1={medianRisk}
            y2={100}
            fill="#F43F5E"
            fillOpacity={0.05}
            label={{ value: "HIGH SPEND · HIGH RISK", position: "insideTopRight", fill: "#F43F5E", fillOpacity: 0.7, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }}
          />
          <ReferenceLine x={medianSpend} stroke="#94A3B8" strokeOpacity={0.35} strokeDasharray="4 4" />
          <ReferenceLine y={medianRisk} stroke="#94A3B8" strokeOpacity={0.35} strokeDasharray="4 4" />
          {byProvider.map((g) => (
            <Scatter
              key={g.provider}
              name={g.provider}
              data={g.bubbles}
              fill={PROVIDER_COLORS[g.provider]}
              fillOpacity={0.75}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
              onClick={(d) => {
                const b = (d as unknown as { payload?: Bubble }).payload;
                if (b) onSelect(b.provider);
              }}
              cursor="pointer"
            >
              {g.bubbles.map((b) => (
                <Cell key={`${b.provider}-${b.service}`} stroke={PROVIDER_COLORS[b.provider]} strokeWidth={1.5} />
              ))}
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      <div className="mt-1 flex items-center justify-center gap-4">
        {PROVIDERS.map((p) => (
          <button key={p} onClick={() => onSelect(p)} className="flex items-center gap-1.5 font-mono text-[11px] text-text-secondary hover:text-accent-cyan">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: PROVIDER_COLORS[p] }} />
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ComplianceBenchmarks({ records }: { records: Incident[] }) {
  const rows = PROVIDERS.map((p, i) => {
    const pr = records.filter((r) => r.provider === p);
    const good = pr.filter((r) => r.status === "Resolved").length + pr.filter((r) => r.status === "In Progress").length * 0.5;
    const pct = pr.length ? Math.round((good / pr.length) * 100) : 0;
    const delta = (hashStr(p) % 7) - 2; // deterministic mock delta
    return { name: `CIS ${p} Foundations`, pct, delta, key: p, delay: i * 0.12 };
  });
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-text-secondary">{r.name}</span>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-1.5 py-px font-mono text-[9px] uppercase tracking-wider",
                  r.delta >= 0
                    ? "border-accent-emerald/40 bg-accent-emerald/10 text-accent-emerald"
                    : "border-sev-critical/40 bg-sev-critical/10 text-sev-critical",
                )}
              >
                {r.delta >= 0 ? "▲" : "▼"} {Math.abs(r.delta)}%
              </span>
              <span className="font-mono text-xs font-semibold text-text-primary font-tnum">{r.pct}%</span>
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full rounded-full"
              style={{ background: PROVIDER_COLORS[r.key], transformOrigin: "left" }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: r.pct / 100 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: r.delay, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      ))}
      <p className="pt-1 font-mono text-[10px] leading-relaxed text-text-muted">
        Benchmark attainment derived from resolved posture findings per provider. Deltas vs previous quarter.
      </p>
    </div>
  );
}
