import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { SEVERITY_COLORS, STATUS_COLORS, domainBySlug, type Severity, type Status } from "@/lib/domains";
import { formatDate, formatMinutes, type Incident } from "@/lib/data";
import { SeverityPill, StatusPill } from "@/components/widgets/IncidentTable";
import { cn } from "@/lib/utils";

const SLA_MINUTES: Record<Severity, number> = { Critical: 240, High: 1440, Medium: 4320, Low: 20160 };

export function SlaBar({ incident }: { incident: Incident }) {
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

/** generic chip used by domain tables (provider / scanner / framework …) */
export function Chip({ label, color = "#22D3EE" }: { label: string; color?: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
      style={{ color, borderColor: `${color}55`, background: `${color}14` }}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Column model                                                        */
/* ------------------------------------------------------------------ */

export interface ColumnDef {
  key: string;
  label: string;
  render: (r: Incident) => ReactNode;
  sortValue?: (r: Incident) => string | number;
  className?: string;
  thClassName?: string;
}

interface DomainTableProps {
  records: Incident[];
  columns: ColumnDef[];
  searchPlaceholder?: string;
  pageSize?: number;
  /** extra detail blocks inside the drawer */
  renderDrawerExtra?: (r: Incident) => ReactNode;
  /** label for a primary drawer action (e.g. "Mark remediated") */
  actionLabel?: (r: Incident) => string | null;
  onAction?: (r: Incident, setStatus: (s: Status) => void) => void;
  /** extra rows for the drawer detail grid */
  drawerFields?: (r: Incident) => [string, string][];
}

const SEV_ORDER: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export function DomainTable({
  records,
  columns,
  searchPlaceholder = "Search id, title, category…",
  pageSize = 8,
  renderDrawerExtra,
  actionLabel,
  onAction,
  drawerFields,
}: DomainTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("detectedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Status>>({});

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? records.filter(
          (r) =>
            r.id.toLowerCase().includes(q) ||
            r.title.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            r.team.toLowerCase().includes(q) ||
            (r.controlId ?? "").toLowerCase().includes(q) ||
            (r.owner ?? "").toLowerCase().includes(q) ||
            (r.framework ?? "").toLowerCase().includes(q),
        )
      : records;
    const col = columns.find((c) => c.key === sortKey);
    const sorted = [...filtered].sort((a, b) => {
      const av = col?.sortValue ? col.sortValue(a) : a.detectedAt;
      const bv = col?.sortValue ? col.sortValue(b) : b.detectedAt;
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [records, query, sortKey, sortAsc, columns]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key !== "detectedAt");
    }
    setPage(0);
  };

  const effective = (r: Incident): Incident => (statusOverrides[r.id] ? { ...r, status: statusOverrides[r.id] } : r);
  const setStatus = (id: string, status: Status) => {
    setStatusOverrides((prev) => ({ ...prev, [id]: status }));
    setSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  };

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
          placeholder={searchPlaceholder}
          aria-label="Search records"
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
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-3 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted",
                    c.thClassName,
                  )}
                >
                  {c.sortValue ? (
                    <button
                      onClick={() => toggleSort(c.key)}
                      className={cn("inline-flex items-center gap-1 hover:text-accent-cyan", sortKey === c.key && "text-accent-cyan")}
                    >
                      {c.label}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
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
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-3 py-2.5", c.className)}>
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center font-mono text-xs text-text-muted">
                  No records match the current filters.
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

      <DomainDrawer
        incident={selected}
        onClose={() => setSelected(null)}
        setStatus={setStatus}
        renderExtra={renderDrawerExtra}
        actionLabel={actionLabel}
        onAction={onAction}
        drawerFields={drawerFields}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

function DomainDrawer({
  incident,
  onClose,
  setStatus,
  renderExtra,
  actionLabel,
  onAction,
  drawerFields,
}: {
  incident: Incident | null;
  onClose: () => void;
  setStatus: (id: string, s: Status) => void;
  renderExtra?: (r: Incident) => ReactNode;
  actionLabel?: (r: Incident) => string | null;
  onAction?: (r: Incident, setStatus: (s: Status) => void) => void;
  drawerFields?: (r: Incident) => [string, string][];
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
            aria-label={`Record ${incident.id}`}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-[420px] flex-col border-l border-hairline bg-surface-1"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <span className="font-mono text-sm font-semibold text-accent-cyan">
                {incident.controlId ? `${incident.id} · ${incident.controlId}` : incident.id}
              </span>
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
                  ...(incident.provider ? [["Provider", incident.provider] as [string, string]] : []),
                  ...(incident.framework ? [["Framework", incident.framework] as [string, string]] : []),
                  ...(incident.owner ? [["Owner", incident.owner] as [string, string]] : []),
                  ...(drawerFields ? drawerFields(incident) : []),
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{k}</dt>
                    <dd className="mt-0.5 text-text-secondary">{v}</dd>
                  </div>
                ))}
              </dl>
              {renderExtra?.(incident)}
            </div>
            <div className="space-y-3 border-t border-hairline px-5 py-4">
              {actionLabel?.(incident) && (
                <button
                  onClick={() => onAction?.(incident, (s) => setStatus(incident.id, s))}
                  className="w-full rounded-lg bg-accent-gradient px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-abyss transition-opacity hover:opacity-90"
                >
                  {actionLabel(incident)}
                </button>
              )}
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Set status</div>
                <div className="flex gap-2">
                  {(["Open", "In Progress", "Resolved"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(incident.id, s)}
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
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export { SEV_ORDER, SEVERITY_COLORS, STATUS_COLORS };
export default DomainTable;
