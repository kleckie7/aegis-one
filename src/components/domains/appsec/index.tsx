import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MONTH_LABELS, type Incident } from "@/lib/data";
import { AXIS_TICK, GRID_STROKE, useCountUp, useFilterKey } from "@/components/widgets/shared";
import { hashStr } from "@/components/domains/utils";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Enrichment (deterministic from record id)                           */
/* ------------------------------------------------------------------ */

export const SCANNERS = ["SAST", "DAST", "SCA", "Pentest"] as const;
export type Scanner = (typeof SCANNERS)[number];
export const SCANNER_COLORS: Record<Scanner, string> = { SAST: "#22D3EE", DAST: "#60A5FA", SCA: "#A78BFA", Pentest: "#FB923C" };

export const OWASP = [
  { code: "A01", name: "Broken Access Control" },
  { code: "A02", name: "Cryptographic Failures" },
  { code: "A03", name: "Injection" },
  { code: "A04", name: "Insecure Design" },
  { code: "A05", name: "Security Misconfiguration" },
  { code: "A06", name: "Vulnerable Components" },
  { code: "A07", name: "AuthN Failures" },
  { code: "A08", name: "Integrity Failures" },
  { code: "A09", name: "Logging Failures" },
  { code: "A10", name: "SSRF" },
] as const;

export const APPS = [
  "payments-api", "auth-service", "user-portal", "admin-console", "billing-web", "checkout-web",
  "mobile-backend", "partner-gateway", "inventory-api", "search-api", "notification-svc", "reporting-web",
  "crm-connector", "sso-bridge", "file-upload", "media-api", "orders-api", "shipping-api",
  "loyalty-web", "support-desk", "chat-service", "analytics-etl", "data-export", "iam-admin",
  "device-registry", "pricing-api", "tax-engine", "fraud-scoring", "kyc-portal", "onboarding-web",
  "marketing-site", "docs-portal", "status-page", "email-relay", "sms-gateway", "webhook-hub",
  "audit-viewer", "sandbox-api", "feature-flags", "config-service", "session-store", "cache-proxy",
  "graphql-gw", "grpc-edge", "legacy-monolith", "batch-jobs",
] as const;

const SLA_DAYS: Record<string, number> = { Critical: 30, High: 90, Medium: 180, Low: 365 };

export interface AppEnrichment {
  app: string;
  scanner: Scanner;
  owasp: (typeof OWASP)[number];
  fixSlaDays: number;
  withinSla: boolean;
}

export function enrich(r: Incident): AppEnrichment {
  const h = hashStr(r.id);
  const fixSlaDays = SLA_DAYS[r.severity] ?? 365;
  return {
    app: APPS[h % APPS.length],
    scanner: SCANNERS[Math.floor(h / 46) % SCANNERS.length],
    owasp: OWASP[Math.floor(h / 184) % OWASP.length],
    fixSlaDays,
    withinSla: r.resolvedAt != null && r.responseMinutes <= fixSlaDays * 1440,
  };
}

/* ------------------------------------------------------------------ */
/* Section B — OWASP category board (signature)                         */
/* ------------------------------------------------------------------ */

export function OwaspBoard({
  records,
  selected,
  onSelect,
}: {
  records: Incident[];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  const rows = useMemo(
    () =>
      OWASP.map((o) => {
        const rr = records.filter((r) => enrich(r).owasp.code === o.code);
        const crit = rr.filter((r) => r.severity === "Critical").length;
        const appCounts = new Map<string, number>();
        for (const r of rr) {
          const app = enrich(r).app;
          appCounts.set(app, (appCounts.get(app) ?? 0) + 1);
        }
        const topApp = [...appCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
        return { ...o, total: rr.length, crit, topApp };
      }),
    [records],
  );
  const max = Math.max(1, ...rows.map((r) => r.total));

  return (
    <div className="space-y-2.5">
      {rows.map((row, i) => (
        <button
          key={row.code}
          title={`${row.total} findings · ${row.crit} critical · most affected: ${row.topApp}`}
          onClick={() => onSelect(row.code)}
          className={cn(
            "block w-full rounded-lg border px-2.5 py-1.5 text-left transition-colors",
            selected === row.code ? "border-accent-cyan/40 bg-accent-cyan/5" : "border-transparent hover:border-hairline hover:bg-surface-2/60",
          )}
        >
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="w-10 shrink-0 rounded-md border border-hairline bg-surface-2 px-1.5 py-0.5 text-center font-mono text-[10px] font-semibold text-accent-cyan"
            >
              {row.code}
            </motion.span>
            <span className={cn("min-w-0 flex-1 truncate text-xs", selected === row.code ? "text-accent-cyan" : "text-text-secondary")}>
              {row.name}
            </span>
            <span className="shrink-0 font-mono text-xs text-text-primary font-tnum">
              {row.total}
              {row.crit > 0 && <span className="ml-1.5 text-[10px] text-sev-critical">{row.crit} crit</span>}
            </span>
          </div>
          <div className="ml-[52px] mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="relative h-full rounded-full bg-accent-cyan/80"
              style={{ transformOrigin: "left" }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: row.total / max }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              {row.total > 0 && row.crit > 0 && (
                <span className="absolute inset-y-0 left-0 rounded-full bg-sev-critical" style={{ width: `${(row.crit / row.total) * 100}%` }} />
              )}
            </motion.div>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section C — scanner trend (stacked areas) + fix SLA dial             */
/* ------------------------------------------------------------------ */

export function ScannerTrend({ records }: { records: Incident[] }) {
  const filterKey = useFilterKey();
  const [hidden, setHidden] = useState<Set<Scanner>>(new Set());
  const data = useMemo(
    () =>
      MONTH_LABELS.map((month, i) => {
        const rows = records.filter((r) => new Date(r.detectedAt).getUTCMonth() === i);
        const out: Record<string, number | string> = { month };
        for (const s of SCANNERS) out[s] = rows.filter((r) => enrich(r).scanner === s).length;
        return out;
      }),
    [records],
  );
  const toggle = (s: Scanner) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  return (
    <div key={filterKey}>
      <div style={{ height: 260 }} role="img" aria-label="Monthly findings per scanner, stacked">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -14 }}>
            <defs>
              {SCANNERS.map((s) => (
                <linearGradient key={s} id={`scan-${s}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SCANNER_COLORS[s]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={SCANNER_COLORS[s]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke={GRID_STROKE} strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="month" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: GRID_STROKE }} />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={40} />
            <Tooltip
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
              cursor={{ stroke: "rgba(148,163,184,.25)" }}
            />
            {SCANNERS.filter((s) => !hidden.has(s)).map((s, i) => (
              <Area
                key={s}
                type="monotone"
                dataKey={s}
                stackId="scan"
                stroke={SCANNER_COLORS[s]}
                strokeWidth={1.5}
                fill={`url(#scan-${s})`}
                isAnimationActive
                animationDuration={700}
                animationBegin={i * 150}
                animationEasing="ease-out"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-center gap-2">
        {SCANNERS.map((s) => (
          <button
            key={s}
            onClick={() => toggle(s)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
              hidden.has(s) ? "border-hairline text-text-muted/50" : "border-hairline text-text-secondary hover:border-accent-cyan/40",
            )}
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: SCANNER_COLORS[s], opacity: hidden.has(s) ? 0.3 : 1 }} />
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FixSlaDial({ pct }: { pct: number }) {
  const counted = useCountUp(pct, 900);
  const filterKey = useFilterKey();
  return (
    <div className="flex flex-col items-center" key={filterKey}>
      <div className="relative h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="72%" outerRadius="100%" data={[{ v: pct }]} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "rgba(244,63,94,0.18)" }}
              dataKey="v"
              cornerRadius={10}
              fill="#34D399"
              angleAxisId={0}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-[30px] font-semibold leading-none text-text-primary font-tnum">{Math.round(counted)}%</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">Within SLA</div>
        </div>
      </div>
      <div className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        SLA: 30d critical · 90d high
      </div>
      <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-accent-emerald" /> Met
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-sev-critical/60" /> Breached
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section D — app risk grid                                            */
/* ------------------------------------------------------------------ */

type SortMode = "risk" | "findings" | "name";

export function AppRiskGrid({
  records,
  selected,
  onSelect,
}: {
  records: Incident[];
  selected: string | null;
  onSelect: (app: string) => void;
}) {
  const [sort, setSort] = useState<SortMode>("risk");
  const apps = useMemo(() => {
    const stats = APPS.map((app) => {
      const rr = records.filter((r) => enrich(r).app === app);
      const open = rr.filter((r) => r.status !== "Resolved");
      const crit = open.filter((r) => r.severity === "Critical").length;
      const high = open.filter((r) => r.severity === "High").length;
      const risk = Math.min(98, Math.round(crit * 18 + high * 8 + open.length * 2.2));
      return { app, total: rr.length, open: open.length, crit, high, risk };
    });
    const sorted = [...stats];
    if (sort === "risk") sorted.sort((a, b) => b.risk - a.risk);
    else if (sort === "findings") sorted.sort((a, b) => b.open - a.open);
    else sorted.sort((a, b) => a.app.localeCompare(b.app));
    return sorted;
  }, [records, sort]);
  const maxRisk = Math.max(1, ...apps.map((a) => a.risk));

  const tint = (risk: number) => {
    const t = Math.sqrt(risk / maxRisk);
    const c0 = [21, 29, 44];
    const c1 = [244, 63, 94];
    const c = c0.map((v, i) => Math.round(v + (c1[i] - v) * t * 0.85));
    return `rgba(${c[0]},${c[1]},${c[2]},0.55)`;
  };
  const riskColor = (risk: number) => (risk >= 60 ? "#F43F5E" : risk >= 35 ? "#FB923C" : risk >= 18 ? "#FACC15" : "#34D399");

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5">
        <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Sort</span>
        {(["risk", "findings", "name"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setSort(m)}
            className={cn(
              "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
              sort === m ? "border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan" : "border-hairline text-text-muted hover:text-text-secondary",
            )}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
        {apps.map((a, i) => (
          <motion.button
            key={a.app}
            layout
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.3, delay: Math.min(i * 0.012, 0.5), layout: { duration: 0.3 } }}
            onClick={() => onSelect(a.app)}
            title={`${a.open} open · ${a.crit} critical · ${a.high} high`}
            className={cn(
              "rounded-lg border p-2.5 text-left transition-shadow hover:shadow-glow",
              selected === a.app ? "border-accent-cyan shadow-glow" : "border-hairline/70",
            )}
            style={{ background: tint(a.risk) }}
          >
            <div className="truncate text-[11px] font-medium text-text-primary">{a.app}</div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="font-mono text-sm font-semibold font-tnum" style={{ color: riskColor(a.risk) }}>
                {a.risk}
              </span>
              <span className="font-mono text-[10px] text-text-muted font-tnum">{a.open} open</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
