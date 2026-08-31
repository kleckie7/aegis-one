import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { SEVERITY_COLORS, STATUS_COLORS, domainBySlug, type Severity, type Status } from "@/lib/domains";
import { formatDate, formatMinutes, type Incident } from "@/lib/data";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

const SLA_MINUTES: Record<Severity, number> = { Critical: 240, High: 1440, Medium: 4320, Low: 20160 };

export function SeverityPill({ severity }: { severity: Severity }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
      style={{
        color: SEVERITY_COLORS[severity],
        borderColor: `${SEVERITY_COLORS[severity]}55`,
        background: `${SEVERITY_COLORS[severity]}14`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: SEVERITY_COLORS[severity] }} />
      {severity}
    </span>
  );
}

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
      style={{
        color: STATUS_COLORS[status],
        borderColor: `${STATUS_COLORS[status]}55`,
        background: `${STATUS_COLORS[status]}14`,
      }}
    >
      {status}
    </span>
  );
}

function SlaBar({ incident }: { incident: Incident }) {
  const sla = SLA_MINUTES[incident.severity];
  const pct = Math.min(100, (incident.responseMinutes / sla) * 100);
  const breached = pct >= 100;
  return (
    <div className="w-20">
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: breached ? "#F43F5E" : pct > 70 ? "#FB923C" : "#34D399" }}
        />
      </div>
      <div className={cn("mt-1 font-mono text-[10px]", breached ? "text-sev-critical" : "text-text-muted")}>
        {formatMinutes(incident.responseMinutes)} / {formatMinutes(sla)}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* IncidentDrawer                                                      */
/* ------------------------------------------------------------------ */

export function IncidentDrawer({
  incident,
  onClose,
  onStatusChange,
}: {
  incident: Incident | null;
  onClose: () => void;
  onStatusChange?: (id: string, status: Status) => void;
}) {
  return (
    <AnimatePresence>
      {incident && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-abyss/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-label={`Incident ${incident.id}`}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-[420px] flex-col border-l border-hairline bg-surface-1"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <span className="font-mono text-sm font-semibold text-accent-cyan">{incident.id}</span>
              <button
                aria-label="Close drawer"
                onClick={onClose}
                className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <h3 className="font-display text-lg font-semibold leading-snug text-text-primary">{incident.title}</h3>
              <div className="flex flex-wrap gap-2">
                <SeverityPill severity={incident.severity} />
                <StatusPill status={incident.status} />
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                {[
                  ["Domain", domainBySlug(incident.domain)?.name ?? incident.domain],
                  ["Team", incident.team],
                  ["Environment", incident.environment],
                  ["Category", incident.category],
                  ["Root Cause", incident.rootCause],
                  ["Detected", formatDate(incident.detectedAt)],
                  ["Resolved", incident.resolvedAt ? formatDate(incident.resolvedAt) : "—"],
                  ["Response", formatMinutes(incident.responseMinutes)],
                  ["Likelihood × Impact", `L${incident.likelihood} × I${incident.impact}`],
                  ...(incident.cvss != null ? [["CVSS", incident.cvss.toFixed(1)] as const] : []),
                  ...(incident.patchStatus ? [["Patch", incident.patchStatus] as const] : []),
                  ...(incident.framework ? [["Framework", incident.framework] as const] : []),
                  ...(incident.auditStatus ? [["Audit", incident.auditStatus] as const] : []),
                  ...(incident.controlId ? [["Control", incident.controlId] as const] : []),
                  ...(incident.owner ? [["Owner", incident.owner] as const] : []),
                  ...(incident.provider ? [["Provider", incident.provider] as const] : []),
                  ...(incident.spend != null ? [["Spend at Risk", `$${incident.spend.toLocaleString("en-US")}`] as const] : []),
                  ...(incident.estLoss != null ? [["Est. Loss", `$${incident.estLoss.toLocaleString("en-US")}`] as const] : []),
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{k}</dt>
                    <dd className="mt-0.5 text-text-secondary">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="border-t border-hairline px-5 py-4">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Set status</div>
              <div className="flex gap-2">
                {(["Open", "In Progress", "Resolved"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onStatusChange?.(incident.id, s)}
                    className={cn(
                      "flex-1 rounded-lg border px-2 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
                      incident.status === s
                        ? "border-accent-cyan/60 bg-accent-cyan/10 text-accent-cyan"
                        : "border-hairline text-text-secondary hover:border-accent-cyan/40 hover:text-text-primary",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* IncidentTable                                                       */
/* ------------------------------------------------------------------ */

type SortKey = "id" | "severity" | "status" | "team" | "environment" | "detectedAt";

const SEV_ORDER: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const STATUS_ORDER: Record<Status, number> = { Open: 0, "In Progress": 1, Resolved: 2 };

function Th({
  k,
  sortKey,
  onSort,
  className,
  children,
}: {
  k: SortKey;
  sortKey: SortKey;
  onSort: (k: SortKey) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <th className={cn("px-3 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted", className)}>
      <button
        onClick={() => onSort(k)}
        className={cn("inline-flex items-center gap-1 hover:text-accent-cyan", sortKey === k && "text-accent-cyan")}
      >
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}

interface IncidentTableProps {
  incidents: Incident[];
  pageSize?: number;
  showDomain?: boolean;
}

export function IncidentTable({ incidents, pageSize = PAGE_SIZE, showDomain = false }: IncidentTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("detectedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Status>>({});

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? incidents.filter(
          (r) =>
            r.id.toLowerCase().includes(q) ||
            r.title.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            r.team.toLowerCase().includes(q),
        )
      : incidents;
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "id": cmp = a.id.localeCompare(b.id); break;
        case "severity": cmp = SEV_ORDER[a.severity] - SEV_ORDER[b.severity]; break;
        case "status": cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break;
        case "team": cmp = a.team.localeCompare(b.team); break;
        case "environment": cmp = a.environment.localeCompare(b.environment); break;
        case "detectedAt": cmp = a.detectedAt.localeCompare(b.detectedAt); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [incidents, query, sortKey, sortAsc]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key !== "detectedAt");
    }
    setPage(0);
  };

  const effective = (r: Incident): Incident =>
    statusOverrides[r.id] ? { ...r, status: statusOverrides[r.id] } : r;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 rounded-lg border border-hairline bg-surface-2/60 px-3 py-2">
        <Search className="h-3.5 w-3.5 text-text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          placeholder="Search id, title, category, team…"
          aria-label="Search incidents"
          className="w-full bg-transparent font-mono text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
        />
        <span className="shrink-0 font-mono text-[10px] text-text-muted font-tnum">
          {rows.length.toLocaleString("en-US")} rows
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-hairline bg-surface-2/60">
              <Th sortKey={sortKey} onSort={toggleSort} k="id">ID</Th>
              <th className="px-3 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">Title</th>
              <Th sortKey={sortKey} onSort={toggleSort} k="severity">Severity</Th>
              <Th sortKey={sortKey} onSort={toggleSort} k="status">Status</Th>
              {showDomain && (
                <th className="px-3 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">Domain</th>
              )}
              <Th sortKey={sortKey} onSort={toggleSort} k="team">Team</Th>
              <Th sortKey={sortKey} onSort={toggleSort} k="environment">Env</Th>
              <Th sortKey={sortKey} onSort={toggleSort} k="detectedAt">Detected</Th>
              <th className="px-3 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">SLA</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((raw) => {
              const r = effective(raw);
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer border-b border-hairline/50 transition-colors hover:bg-surface-2"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-accent-cyan">{r.id}</td>
                  <td className="max-w-[260px] truncate px-3 py-2.5 text-text-secondary">{r.title}</td>
                  <td className="px-3 py-2.5"><SeverityPill severity={r.severity} /></td>
                  <td className="px-3 py-2.5"><StatusPill status={r.status} /></td>
                  {showDomain && (
                    <td className="whitespace-nowrap px-3 py-2.5 text-xs text-text-muted">
                      {domainBySlug(r.domain)?.shortName ?? r.domain}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-text-secondary">{r.team}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-text-secondary">{r.environment}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-text-muted font-tnum">{formatDate(r.detectedAt)}</td>
                  <td className="px-3 py-2.5"><SlaBar incident={r} /></td>
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center font-mono text-xs text-text-muted">
                  No incidents match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[11px] text-text-muted font-tnum">
          Page {safePage + 1} / {pageCount}
        </span>
        <div className="flex gap-1">
          <button
            aria-label="Previous page"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-md border border-hairline p-1.5 text-text-secondary transition-colors hover:border-accent-cyan/40 hover:text-accent-cyan disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Next page"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded-md border border-hairline p-1.5 text-text-secondary transition-colors hover:border-accent-cyan/40 hover:text-accent-cyan disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <IncidentDrawer
        incident={selected}
        onClose={() => setSelected(null)}
        onStatusChange={(id, status) => {
          setStatusOverrides((prev) => ({ ...prev, [id]: status }));
          setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
        }}
      />
    </div>
  );
}

export default IncidentTable;
