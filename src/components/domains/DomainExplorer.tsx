import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { STATUS_COLORS, domainBySlug, type Severity, type Status } from "@/lib/domains";
import { formatDate, formatMinutes, type Incident } from "@/lib/data";
import { SeverityPill, StatusPill } from "@/components/widgets/IncidentTable";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 8;
const SEV_ORDER: Record<Severity, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const STATUS_ORDER: Record<Status, number> = { Open: 0, "In Progress": 1, Resolved: 2 };

/* ------------------------------------------------------------------ */
/* Mini timeline stepper (Detected → Acknowledged → Contained → Resolved) */
/* ------------------------------------------------------------------ */

export function TimelineStepper({ incident }: { incident: Incident }) {
  const steps = ["Detected", "Acknowledged", "Contained", "Resolved"];
  const done = incident.status === "Resolved" ? 4 : incident.status === "In Progress" ? 2 : 1;
  const progress = (done - 1) / (steps.length - 1);
  const detected = new Date(incident.detectedAt).getTime();
  const stepTimes = steps.map((_, i) => {
    if (i === 0) return formatDate(incident.detectedAt);
    if (i === 3 && incident.resolvedAt) return formatDate(incident.resolvedAt);
    const frac = i / 3;
    return formatDate(new Date(detected + incident.responseMinutes * 60000 * frac).toISOString());
  });

  return (
    <div>
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        Response timeline
      </div>
      <div className="relative px-1">
        <div className="absolute left-2 right-2 top-[7px] h-0.5 rounded bg-surface-2" />
        <motion.div
          className="absolute left-2 top-[7px] h-0.5 rounded bg-accent-gradient"
          style={{ right: "0.5rem", transformOrigin: "left" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(0.02, progress) }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
        <div className="relative flex justify-between">
          {steps.map((s, i) => {
            const reached = i < done;
            return (
              <div key={s} className="flex w-14 flex-col items-center gap-1.5">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.1, type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "h-4 w-4 rounded-full border-2",
                    reached ? "border-accent-cyan bg-accent-cyan/30" : "border-hairline bg-surface-2",
                  )}
                />
                <span
                  className={cn(
                    "text-center font-mono text-[9px] uppercase tracking-wider",
                    reached ? "text-text-secondary" : "text-text-muted/60",
                  )}
                >
                  {s}
                </span>
                <span className="text-center font-mono text-[8px] text-text-muted/50 font-tnum">
                  {reached ? stepTimes[i] : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DomainExplorer — table variant with domain columns + custom drawer   */
/* ------------------------------------------------------------------ */

export interface ExplorerColumn {
  header: string;
  cell: (r: Incident) => ReactNode;
  sortValue?: (r: Incident) => string | number;
}

interface DomainExplorerProps {
  incidents: Incident[];
  formatId?: (r: Incident) => string;
  /** extra columns inserted after Title */
  extraColumns?: ExplorerColumn[];
  /** extra blocks in the drawer body (below the field grid) */
  drawerBody?: (r: Incident) => ReactNode;
  /** drawer footer (replaces default status buttons when provided) */
  drawerActions?: (r: Incident, close: () => void) => ReactNode;
  searchPlaceholder?: string;
  headerChip?: ReactNode;
}

type SortKey = "id" | "severity" | "status" | "team" | "detectedAt" | number; // number = extra column index

export function DomainExplorer({
  incidents,
  formatId,
  extraColumns = [],
  drawerBody,
  drawerActions,
  searchPlaceholder = "Search id, title, category, team…",
  headerChip,
}: DomainExplorerProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("detectedAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Incident | null>(null);

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
      if (typeof sortKey === "number") {
        const sv = extraColumns[sortKey]?.sortValue;
        if (sv) {
          const va = sv(a);
          const vb = sv(b);
          cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
        }
      } else {
        switch (sortKey) {
          case "id": cmp = a.id.localeCompare(b.id); break;
          case "severity": cmp = SEV_ORDER[a.severity] - SEV_ORDER[b.severity]; break;
          case "status": cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break;
          case "team": cmp = a.team.localeCompare(b.team); break;
          case "detectedAt": cmp = a.detectedAt.localeCompare(b.detectedAt); break;
        }
      }
      return sortAsc ? cmp : -cmp;
    });
    return sorted;
  }, [incidents, query, sortKey, sortAsc, extraColumns]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(key !== "detectedAt");
    }
    setPage(0);
  };

  const thClass =
    "px-3 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted";
  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => toggleSort(key)}
      className={cn("inline-flex items-center gap-1 hover:text-accent-cyan", sortKey === key && "text-accent-cyan")}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-hairline bg-surface-2/60 px-3 py-2">
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
        {headerChip}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-hairline bg-surface-2/60">
              <th className={thClass}>{sortBtn("id", "ID")}</th>
              <th className={thClass}>Title</th>
              <th className={thClass}>{sortBtn("severity", "Severity")}</th>
              {extraColumns.map((c, i) => (
                <th key={c.header} className={thClass}>
                  {c.sortValue ? sortBtn(i, c.header) : c.header}
                </th>
              ))}
              <th className={thClass}>{sortBtn("status", "Status")}</th>
              <th className={thClass}>{sortBtn("team", "Team")}</th>
              <th className={thClass}>{sortBtn("detectedAt", "Detected")}</th>
              <th className={thClass}>Response</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r, ri) => (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ri * 0.04, duration: 0.3 }}
                onClick={() => setSelected(r)}
                className="cursor-pointer border-b border-hairline/50 transition-colors hover:bg-surface-2"
              >
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-accent-cyan">
                  {formatId ? formatId(r) : r.id}
                </td>
                <td className="max-w-[240px] truncate px-3 py-2.5 text-text-secondary">{r.title}</td>
                <td className="px-3 py-2.5">
                  <SeverityPill severity={r.severity} />
                </td>
                {extraColumns.map((c) => (
                  <td key={c.header} className="whitespace-nowrap px-3 py-2.5 text-xs text-text-secondary">
                    {c.cell(r)}
                  </td>
                ))}
                <td className="px-3 py-2.5">
                  <StatusPill status={r.status} />
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-xs text-text-secondary">{r.team}</td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-text-muted font-tnum">
                  {formatDate(r.detectedAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-text-secondary font-tnum">
                  {formatMinutes(r.responseMinutes)}
                </td>
              </motion.tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={8 + extraColumns.length} className="px-3 py-10 text-center font-mono text-xs text-text-muted">
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

      {/* Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-abyss/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.aside
              role="dialog"
              aria-label={`Record ${selected.id}`}
              className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-[420px] flex-col border-l border-hairline bg-surface-1"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                <span className="font-mono text-sm font-semibold text-accent-cyan">
                  {formatId ? formatId(selected) : selected.id}
                </span>
                <button
                  aria-label="Close drawer"
                  onClick={() => setSelected(null)}
                  className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                <h3 className="font-display text-lg font-semibold leading-snug text-text-primary">{selected.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <SeverityPill severity={selected.severity} />
                  <StatusPill status={selected.status} />
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                  {(
                    [
                      ["Domain", domainBySlug(selected.domain)?.name ?? selected.domain],
                      ["Team", selected.team],
                      ["Environment", selected.environment],
                      ["Category", selected.category],
                      ["Root Cause", selected.rootCause],
                      ["Detected", formatDate(selected.detectedAt)],
                      ["Resolved", selected.resolvedAt ? formatDate(selected.resolvedAt) : "—"],
                      ["Response", formatMinutes(selected.responseMinutes)],
                      ...(selected.cvss != null ? [["CVSS", selected.cvss.toFixed(1)]] : []),
                      ...(selected.patchStatus ? [["Patch", selected.patchStatus]] : []),
                      ...(selected.exploitability ? [["Exploitability", selected.exploitability]] : []),
                      ...(selected.assetType ? [["Asset", selected.assetType]] : []),
                      ...(selected.estLoss != null ? [["Est. Loss", `$${selected.estLoss.toLocaleString("en-US")}`]] : []),
                    ] as [string, string][]
                  ).map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{k}</dt>
                      <dd className="mt-0.5 text-text-secondary">{v}</dd>
                    </div>
                  ))}
                </dl>
                {drawerBody?.(selected)}
              </div>
              <div className="border-t border-hairline px-5 py-4">
                {drawerActions ? (
                  drawerActions(selected, () => setSelected(null))
                ) : (
                  <div className="flex gap-2">
                    {(["Open", "In Progress", "Resolved"] as const).map((s) => (
                      <button
                        key={s}
                        className={cn(
                          "flex-1 rounded-lg border px-2 py-2 font-mono text-[11px] uppercase tracking-wider",
                          selected.status === s
                            ? "border-accent-cyan/60 bg-accent-cyan/10 text-accent-cyan"
                            : "border-hairline text-text-secondary",
                        )}
                        style={
                          selected.status === s
                            ? undefined
                            : { color: STATUS_COLORS[s] }
                        }
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}

export default DomainExplorer;
