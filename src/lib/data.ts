import {
  DOMAINS,
  TEAMS,
  ENVIRONMENTS,
  SEVERITIES,
  type Severity,
  type Status,
  type Team,
  type Environment,
} from "@/lib/domains";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface Incident {
  id: string;
  title: string;
  domain: string;
  severity: Severity;
  status: Status;
  team: Team;
  environment: Environment;
  detectedAt: string; // ISO
  resolvedAt: string | null; // ISO
  responseMinutes: number;
  category: string;
  rootCause: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  // domain-specific extras (populated for relevant domains)
  cvss?: number;
  patchStatus?: "Patched" | "Pending" | "Overdue" | "Not Available";
  exploitability?: "Weaponized" | "PoC Public" | "Theoretical";
  assetType?: string;
  estLoss?: number;
  framework?: "ISO 27001" | "SOC 2" | "NIST CSF" | "PCI DSS";
  auditStatus?: "Compliant" | "Partial" | "Non-Compliant" | "Not Tested";
  owner?: string;
  controlId?: string;
  provider?: "AWS" | "Azure" | "GCP";
  misconfigType?: string;
  spend?: number;
}

export interface FilterState {
  month: string; // 'all' | 'Q1'..'Q4' | '2025-01' .. '2025-12'
  environment: string; // 'all' | Environment
  team: string; // 'all' | Team
  severity: string; // 'all' | Severity
}

export const DEFAULT_FILTERS: FilterState = {
  month: "all",
  environment: "all",
  team: "all",
  severity: "all",
};

/* ------------------------------------------------------------------ */
/* Deterministic PRNG (mulberry32, seed 42)                            */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Generator                                                           */
/* ------------------------------------------------------------------ */

const TARGETS = [
  "prod-db-02", "vpn-gw-eu", "k8s-node-14", "mail-relay-01", "iot-gateway-7",
  "crm-web", "auth-service", "s3-assets", "dc-core-sw", "laptop-fleet-b",
  "erp-prod", "ci-runner-3", "pos-terminal-88", "cam-vlan-north", "dns-resolver-2",
  "api-gw-public", "finance-share", "hr-portal", "build-server", "bastion-host",
];

const OWNERS = ["A. Reyes", "M. Okafor", "J. Lindqvist", "S. Patel", "D. Novak", "K. Tanaka", "L. Moreau", "R. Alvarez"];

const SEV_WEIGHTS: [Severity, number][] = [
  ["Critical", 0.09],
  ["High", 0.24],
  ["Medium", 0.4],
  ["Low", 0.27],
];

function pickSev(r: number): Severity {
  let acc = 0;
  for (const [sev, w] of SEV_WEIGHTS) {
    acc += w;
    if (r <= acc) return sev;
  }
  return "Low";
}

/** month index 0..11 with gentle seasonal curve (mid-year bump) */
function pickMonth(rand: () => number): number {
  const w = [0.9, 0.85, 1.0, 1.05, 1.1, 1.2, 1.15, 1.0, 0.95, 1.0, 1.1, 1.25];
  const total = w.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < 12; i++) {
    r -= w[i];
    if (r <= 0) return i;
  }
  return 11;
}

function generate(): Incident[] {
  const out: Incident[] = [];
  DOMAINS.forEach((domain, di) => {
    const rand = mulberry32(42 + di * 1013);
    const count = domain.volume * 12;
    for (let i = 0; i < count; i++) {
      const m = pickMonth(rand);
      const day = 1 + Math.floor(rand() * 28);
      const hour = Math.floor(rand() * 24);
      const minute = Math.floor(rand() * 60);
      const detected = new Date(Date.UTC(2025, m, day, hour, minute));
      const sev = pickSev(rand());
      const sevRank = SEVERITIES.indexOf(sev); // 0 = critical
      // resolution: higher severity resolved faster but not always
      const resolved = rand() < (sev === "Low" ? 0.72 : sev === "Medium" ? 0.78 : sev === "High" ? 0.84 : 0.9);
      const baseResp = sev === "Critical" ? 60 : sev === "High" ? 360 : sev === "Medium" ? 1440 : 4320;
      const responseMinutes = Math.round(baseResp * (0.3 + rand() * 2.4));
      const resolvedAt = resolved
        ? new Date(detected.getTime() + responseMinutes * 60000).toISOString()
        : null;
      const status: Status = resolved ? "Resolved" : rand() < 0.55 ? "Open" : "In Progress";
      const category = domain.categories[Math.floor(rand() * domain.categories.length)];
      const rootCause = domain.rootCauses[Math.floor(rand() * domain.rootCauses.length)];
      const target = TARGETS[Math.floor(rand() * TARGETS.length)];
      const likelihood = (1 + Math.floor(rand() * 5)) as Incident["likelihood"];
      // impact correlates loosely with severity
      const impact = Math.min(
        5,
        Math.max(1, 5 - sevRank + Math.floor(rand() * 3) - 1),
      ) as Incident["impact"];

      const rec: Incident = {
        id: `${domain.prefix}-${String(1000 + i)}`,
        title: `${category} on ${target}`,
        domain: domain.slug,
        severity: sev,
        status,
        team: TEAMS[Math.floor(rand() * TEAMS.length)],
        environment: ENVIRONMENTS[Math.floor(rand() * ENVIRONMENTS.length)],
        detectedAt: detected.toISOString(),
        resolvedAt,
        responseMinutes,
        category,
        rootCause,
        likelihood,
        impact,
      };

      if (domain.slug === "vulnerability-management") {
        rec.cvss = Math.round((2 + rand() * 8) * 10) / 10;
        if (sev === "Critical") rec.cvss = Math.round((9 + rand()) * 10) / 10;
        rec.patchStatus = (["Patched", "Pending", "Overdue", "Not Available"] as const)[
          Math.floor(rand() * 4)
        ];
        rec.exploitability = (["Weaponized", "PoC Public", "Theoretical"] as const)[
          Math.floor(rand() * 3)
        ];
        rec.assetType = (["Server", "Workstation", "Container", "Network Device", "SaaS"] as const)[
          Math.floor(rand() * 5)
        ];
        rec.estLoss = Math.round(500 + rand() * rand() * 48000);
      }
      if (domain.slug === "grc") {
        rec.framework = (["ISO 27001", "SOC 2", "NIST CSF", "PCI DSS"] as const)[
          Math.floor(rand() * 4)
        ];
        rec.auditStatus = (["Compliant", "Partial", "Non-Compliant", "Not Tested"] as const)[
          Math.floor(rand() * 4)
        ];
        rec.owner = OWNERS[Math.floor(rand() * OWNERS.length)];
        rec.controlId = `${rec.framework === "ISO 27001" ? "A" : rec.framework === "SOC 2" ? "CC" : rec.framework === "NIST CSF" ? "PR" : "PC"}.${1 + Math.floor(rand() * 12)}.${1 + Math.floor(rand() * 9)}`;
      }
      if (domain.slug === "cloud-security") {
        rec.provider = (["AWS", "Azure", "GCP"] as const)[Math.floor(rand() * 3)];
        rec.misconfigType = category;
        rec.spend = Math.round(200 + rand() * rand() * 24000);
      }

      out.push(rec);
    }
  });
  return out;
}

/** Full synthetic dataset — deterministic (seed 42), generated once. */
export const ALL_INCIDENTS: Incident[] = generate();

export const incidentsByDomain = (slug: string) =>
  ALL_INCIDENTS.filter((r) => r.domain === slug);

/* ------------------------------------------------------------------ */
/* Global filter                                                       */
/* ------------------------------------------------------------------ */

const QUARTERS: Record<string, number[]> = {
  Q1: [0, 1, 2],
  Q2: [3, 4, 5],
  Q3: [6, 7, 8],
  Q4: [9, 10, 11],
};

export function monthMatches(iso: string, month: string): boolean {
  if (month === "all") return true;
  const d = new Date(iso);
  if (month in QUARTERS) return QUARTERS[month].includes(d.getUTCMonth());
  return iso.slice(0, 7) === month;
}

export function applyFilters(records: Incident[], f: FilterState): Incident[] {
  return records.filter(
    (r) =>
      monthMatches(r.detectedAt, f.month) &&
      (f.environment === "all" || r.environment === f.environment) &&
      (f.team === "all" || r.team === f.team) &&
      (f.severity === "all" || r.severity === f.severity),
  );
}

/** Stable string key for the active filters — use to re-trigger chart animations. */
export function filterKey(f: FilterState): string {
  return `${f.month}|${f.environment}|${f.team}|${f.severity}`;
}

export function isFiltered(f: FilterState): boolean {
  return f.month !== "all" || f.environment !== "all" || f.team !== "all" || f.severity !== "all";
}

/* ------------------------------------------------------------------ */
/* Derived selectors (pure — memoize at call site if needed)           */
/* ------------------------------------------------------------------ */

export const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface TrendPoint {
  month: string;
  reported: number;
  resolved: number;
}

export function trendByMonth(records: Incident[]): TrendPoint[] {
  const reported = new Array(12).fill(0) as number[];
  const resolved = new Array(12).fill(0) as number[];
  for (const r of records) {
    reported[new Date(r.detectedAt).getUTCMonth()]++;
    if (r.resolvedAt) resolved[new Date(r.resolvedAt).getUTCMonth()]++;
  }
  return MONTH_LABELS.map((m, i) => ({ month: m, reported: reported[i], resolved: resolved[i] }));
}

export function severityCounts(records: Incident[]): { name: Severity; value: number }[] {
  const map: Record<Severity, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  for (const r of records) map[r.severity]++;
  return SEVERITIES.map((s) => ({ name: s, value: map[s] }));
}

export function statusCounts(records: Incident[]): { name: Status; value: number }[] {
  const map: Record<Status, number> = { Open: 0, "In Progress": 0, Resolved: 0 };
  for (const r of records) map[r.status]++;
  return (["Open", "In Progress", "Resolved"] as const).map((s) => ({ name: s, value: map[s] }));
}

export function categoryCounts(records: Incident[], topN = 6): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of records) map.set(r.category, (map.get(r.category) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}

export function rootCauseCounts(records: Incident[], topN = 5): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const r of records) map.set(r.rootCause, (map.get(r.rootCause) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, value]) => ({ name, value }));
}

export function teamCounts(records: Incident[]): { team: string; reported: number; resolved: number }[] {
  return TEAMS.map((team) => {
    const rows = records.filter((r) => r.team === team);
    return {
      team,
      reported: rows.length,
      resolved: rows.filter((r) => r.status === "Resolved").length,
    };
  });
}

/** 5x5 grid: rows = impact 5..1 (top→bottom), cols = likelihood 1..5 */
export function heatmapGrid(records: Incident[]): number[][] {
  const grid = Array.from({ length: 5 }, () => new Array(5).fill(0) as number[]);
  for (const r of records) grid[5 - r.impact][r.likelihood - 1]++;
  return grid;
}

/** 0–100 org risk score from open records */
export function riskScore(records: Incident[]): number {
  const open = records.filter((r) => r.status !== "Resolved");
  if (open.length === 0) return 8;
  const weights: Record<Severity, number> = { Critical: 10, High: 6, Medium: 3, Low: 1 };
  const raw = open.reduce((a, r) => a + weights[r.severity], 0) / open.length;
  const volumeFactor = Math.min(1, open.length / 400);
  return Math.round(Math.min(98, raw * 8 + volumeFactor * 22));
}

export function openCount(records: Incident[]): number {
  return records.filter((r) => r.status !== "Resolved").length;
}

export function criticalOpenCount(records: Incident[]): number {
  return records.filter((r) => r.status !== "Resolved" && r.severity === "Critical").length;
}

/** mean time to respond, minutes (resolved only) */
export function mttrMinutes(records: Incident[]): number {
  const res = records.filter((r) => r.resolvedAt);
  if (res.length === 0) return 0;
  return Math.round(res.reduce((a, r) => a + r.responseMinutes, 0) / res.length);
}

/** % resolved inside a simple SLA (crit 4h, high 24h, med 72h, low 14d) */
export function slaCompliance(records: Incident[]): number {
  const sla: Record<Severity, number> = { Critical: 240, High: 1440, Medium: 4320, Low: 20160 };
  const res = records.filter((r) => r.resolvedAt);
  if (res.length === 0) return 100;
  const inside = res.filter((r) => r.responseMinutes <= sla[r.severity]).length;
  return Math.round((inside / res.length) * 1000) / 10;
}

/** worst open severity for a record set (for sidebar dots) */
export function worstOpenSeverity(records: Incident[]): Severity | null {
  for (const sev of SEVERITIES) {
    if (records.some((r) => r.severity === sev && r.status !== "Resolved")) return sev;
  }
  return null;
}

/** 7-point sparkline series (weekly-ish buckets of the filtered records) */
export function sparkline(records: Incident[], points = 7): number[] {
  if (records.length === 0) return new Array(points).fill(0) as number[];
  const buckets = new Array(points).fill(0) as number[];
  const t0 = Date.UTC(2025, 0, 1);
  const t1 = Date.UTC(2025, 11, 31, 23, 59);
  for (const r of records) {
    const t = new Date(r.detectedAt).getTime();
    const idx = Math.min(points - 1, Math.floor(((t - t0) / (t1 - t0)) * points));
    buckets[idx]++;
  }
  return buckets;
}

/** % delta of current vs previous period (based on month filter); null when not comparable */
export function periodDelta(records: Incident[], f: FilterState, metric: (r: Incident[]) => number): number | null {
  const cur = metric(records);
  let prev: Incident[];
  if (f.month === "all") {
    prev = records.filter((r) => new Date(r.detectedAt).getUTCMonth() < 6);
    const curHalf = metric(records.filter((r) => new Date(r.detectedAt).getUTCMonth() >= 6));
    const p = metric(prev);
    return p === 0 ? null : Math.round(((curHalf - p) / p) * 100);
  }
  if (f.month in QUARTERS) {
    const qi = Object.keys(QUARTERS).indexOf(f.month);
    if (qi <= 0) return null;
    const prevQ = Object.keys(QUARTERS)[qi - 1];
    prev = records.filter((r) => QUARTERS[prevQ].includes(new Date(r.detectedAt).getUTCMonth()));
  } else {
    const m = new Date(`${f.month}-15T00:00:00Z`).getUTCMonth();
    if (m === 0) return null;
    prev = records.filter((r) => new Date(r.detectedAt).getUTCMonth() === m - 1);
  }
  const p = metric(prev);
  if (p === 0) return null;
  return Math.round(((cur - p) / p) * 100);
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${(mins / 60).toFixed(1)}h`;
  return `${(mins / 1440).toFixed(1)}d`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${MONTH_LABELS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}
