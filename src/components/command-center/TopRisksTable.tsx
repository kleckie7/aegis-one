import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { IncidentDrawer, SeverityPill, StatusPill } from "@/components/widgets/IncidentTable";
import { formatDate, type Incident } from "@/lib/data";
import { domainBySlug, type Severity, type Status } from "@/lib/domains";
import { riskValue } from "./risk";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;

const SEV_ORDER: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

type SortKey = "id" | "severity" | "detectedAt" | "risk";

interface Toast {
  id: number;
  message: string;
}

interface TopRisksTableProps {
  incidents: Incident[];
  /** active heatmap cell filter, if any */
  cell: { l: number; i: number } | null;
  onClearCell: () => void;
}

/**
 * Row 5 — top-risk register: Critical/High open items ranked by composite risk.
 * Reuses the shared pills + IncidentDrawer; adds Assign/Escalate row actions
 * with mock toast confirmations.
 */
export function TopRisksTable({ incidents, cell, onClearCell }: TopRisksTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("risk");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Status>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, message }]);
  };
  useEffect(() => {
    if (toasts.length === 0) return;
    const t = setTimeout(() => setToasts((prev) => prev.slice(1)), 2800);
    return () => clearTimeout(t);
  }, [toasts]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? incidents.filter(
          (r) =>
            r.id.toLowerCase().includes(q) ||
            r.title.toLowerCase().includes(q) ||
            r.team.toLowerCase().includes(q) ||
            (domainBySlug(r.domain)?.name.toLowerCase().includes(q) ?? false),
        )
      : incidents;
    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "id": cmp = a.id.localeCompare(b.id); break;
        case "severity": cmp = SEV_ORDER[a.severity] - SEV_ORDER[b.severity]; break;
        case "detectedAt": cmp = a.detectedAt.localeCompare(b.detectedAt); break;
        case "risk": cmp = riskValue(a) - riskValue(b); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [incidents, query, sortKey, sortAsc]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
    setPage(0);
  };

  const effective = (r: Incident): Incident =>
    statusOverrides[r.id] ? { ...r, status: statusOverrides[r.id] } : r;

  const thCls = "px-3 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted";
  const thBtn = (k: SortKey, label: string): ReactNode => (
    <button
      onClick={() => toggleSort(k)}
      className={cn("inline-flex items-center gap-1 hover:text-accent-cyan", sortKey === k && "text-accent-cyan")}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-hairline bg-surface-2/60 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-text-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search id, title, team, domain…"
            aria-label="Search top risks"
            className="w-full bg-transparent font-mono text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none"
          />
          <span className="shrink-0 font-mono text-[10px] text-text-muted font-tnum">
            {rows.length.toLocaleString("en-US")} rows
          </span>
        </div>
        {cell && (
          <button
            onClick={onClearCell}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-cyan"
          >
            Cell L{cell.l} × I{cell.i}
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-hairline bg-surface-2/60">
              <th className={thCls}>{thBtn("id", "ID")}</th>
              <th className={thCls}>Title</th>
              <th className={thCls}>Domain</th>
              <th className={thCls}>{thBtn("severity", "Severity")}</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Team</th>
              <th className={thCls}>{thBtn("detectedAt", "Detected")}</th>
              <th className={thCls}>{thBtn("risk", "Risk")}</th>
              <th className={thCls}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((raw, idx) => {
              const r = effective(raw);
              const d = domainBySlug(r.domain);
              return (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer border-b border-hairline/50 transition-colors hover:bg-surface-2"
                >
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-accent-cyan">{r.id}</td>
                  <td className="max-w-[240px] truncate px-3 py-2.5 text-text-secondary">{r.title}</td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {d && (
                      <span
                        className="rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                        style={{ color: d.color, borderColor: `${d.color}44`, background: `${d.color}12` }}
                      >
                        {d.shortName}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5"><SeverityPill severity={r.severity} /></td>
                  <td className="px-3 py-2.5"><StatusPill status={r.status} /></td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-xs text-text-secondary">{r.team}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-text-muted font-tnum">
                    {formatDate(r.detectedAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-text-primary font-tnum">
                    L{r.likelihood} × I{r.impact}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pushToast(`${r.id} assigned to ${r.team}`);
                        }}
                        aria-label={`Assign ${r.id}`}
                        className="flex items-center gap-1 rounded-md border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-accent-cyan/40 hover:text-accent-cyan"
                      >
                        <UserPlus className="h-3 w-3" /> Assign
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          pushToast(`${r.id} escalated to Tier 3 response`);
                        }}
                        aria-label={`Escalate ${r.id}`}
                        className="flex items-center gap-1 rounded-md border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-sev-critical/50 hover:text-sev-critical"
                      >
                        <ArrowUpRight className="h-3 w-3" /> Escalate
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-10 text-center font-mono text-xs text-text-muted">
                  No top risks match the current filters.
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
          pushToast(`${id} marked ${status}`);
        }}
      />

      {/* mock action toasts */}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex w-72 flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto flex items-center gap-2 rounded-lg border border-accent-emerald/40 bg-surface-2/95 px-3 py-2.5 shadow-xl backdrop-blur-md"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-accent-emerald" />
              <span className="font-mono text-xs text-text-secondary">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TopRisksTable;
