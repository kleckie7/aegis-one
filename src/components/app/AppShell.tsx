import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Globe,
  LayoutDashboard,
  Menu,
  Search,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DOMAINS, ENVIRONMENTS, MONTHS, SEVERITIES, SEVERITY_COLORS, TEAMS, domainBySlug } from "@/lib/domains";
import { ALL_INCIDENTS, DEFAULT_FILTERS, filterKey, isFiltered, worstOpenSeverity, type FilterState } from "@/lib/data";
import { useFilterKey, useFilterStore } from "@/stores/filterStore";
import { DomainSwitcher } from "./DomainSwitcher";
import { cn } from "@/lib/utils";

/* worst open severity per domain — computed once from the full dataset */
const DOMAIN_DOTS: Record<string, string | null> = Object.fromEntries(
  DOMAINS.map((d) => {
    const worst = worstOpenSeverity(ALL_INCIDENTS.filter((r) => r.domain === d.slug));
    return [d.slug, worst ? SEVERITY_COLORS[worst] : null];
  }),
);

function LivePill({ collapsed }: { collapsed?: boolean }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-2.5 py-1",
        collapsed && "px-1.5",
      )}
    >
      <span className="h-2 w-2 rounded-full bg-accent-cyan animate-glow-pulse" />
      {!collapsed && <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-cyan">Live</span>}
    </div>
  );
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-2.5 border-b border-hairline px-4 py-4", collapsed && "justify-center px-2")}>
        <img src="/logo.svg" alt="AEGIS ONE" className="h-8 w-8 shrink-0" />
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display text-[15px] font-bold leading-tight tracking-tight text-text-primary">
              AEGIS <span className="text-gradient">ONE</span>
            </div>
            <LivePill />
          </div>
        )}
        {collapsed && <LivePill collapsed />}
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className={cn("px-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted", collapsed && "sr-only")}>
          Overview
        </div>
        <NavItem
          to="/app"
          icon={LayoutDashboard}
          label="Command Center"
          active={pathname === "/app"}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        <div className={cn("px-2 pb-1.5 pt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted", collapsed && "sr-only")}>
          Domains
        </div>
        {DOMAINS.map((d) => (
          <NavItem
            key={d.slug}
            to={`/app/${d.slug}`}
            icon={d.icon}
            label={d.name}
            active={pathname === `/app/${d.slug}`}
            collapsed={collapsed}
            dot={DOMAIN_DOTS[d.slug]}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  active,
  collapsed,
  dot,
  onNavigate,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
  collapsed: boolean;
  dot?: string | null;
  onNavigate?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        "relative mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
        active ? "bg-surface-2 text-accent-cyan" : "text-text-secondary hover:bg-surface-2/60 hover:text-text-primary",
        collapsed && "justify-center px-2",
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent-gradient"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative shrink-0">
        <Icon className="h-4 w-4" />
        {dot && <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full" style={{ background: dot }} />}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

/* ------------------------------------------------------------------ */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted xl:inline">{label}</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label={label}
          className="h-8 w-[104px] border-hairline bg-surface-1 font-mono text-xs text-text-secondary focus:ring-accent-cyan/40 sm:w-[124px]"
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent className="border-hairline bg-surface-2">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="font-mono text-xs focus:bg-surface-1 focus:text-accent-cyan">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const NOTIFICATIONS = [
  { id: 1, sev: "#F43F5E", text: "Critical incident NET-0231 breached response SLA", time: "4m" },
  { id: 2, sev: "#FB923C", text: "New weaponized CVE added to Vulnerability Management", time: "22m" },
  { id: 3, sev: "#22D3EE", text: "Q4 GRC audit evidence request assigned to you", time: "1h" },
  { id: 4, sev: "#34D399", text: "Cloud SecOps resolved 41 misconfigurations", time: "3h" },
];

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const store = useFilterStore();
  const fKey = useFilterKey();
  const [sweeping, setSweeping] = useState(false);

  // filter-morph: slim accent progress bar sweeps the topbar on filter change
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const unsub = useFilterStore.subscribe((s, prev) => {
      if (filterKey(s) !== filterKey(prev)) {
        setSweeping(true);
        clearTimeout(t);
        t = setTimeout(() => setSweeping(false), 450);
      }
    });
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, []);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const slug = location.pathname.startsWith("/app/") ? location.pathname.slice(5) : null;
  const domain = slug ? domainBySlug(slug) : null;
  const pageTitle = domain ? domain.name : "Command Center";

  const activeChips = useMemo(() => {
    const chips: { key: keyof FilterState; label: string }[] = [];
    if (store.month !== "all") chips.push({ key: "month", label: MONTHS.find((m) => m.key === store.month)?.label ?? store.month });
    if (store.environment !== "all") chips.push({ key: "environment", label: store.environment });
    if (store.team !== "all") chips.push({ key: "team", label: store.team });
    if (store.severity !== "all") chips.push({ key: "severity", label: store.severity });
    return chips;
  }, [store.month, store.environment, store.team, store.severity]);

  return (
    <div className="min-h-[100dvh] bg-base text-text-primary">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r border-hairline bg-base transition-[width] duration-300 lg:block",
          collapsed ? "w-[72px]" : "w-[248px]",
        )}
      >
        <SidebarContent collapsed={collapsed} />
        <div className="absolute inset-x-0 bottom-0 border-t border-hairline p-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-text-secondary hover:bg-surface-2/60 hover:text-text-primary",
              collapsed && "justify-center px-2",
            )}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            {!collapsed && "Collapse"}
          </button>
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-text-secondary hover:bg-surface-2/60 hover:text-text-primary",
              collapsed && "justify-center px-2",
            )}
          >
            <Globe className="h-4 w-4 shrink-0" />
            {!collapsed && "Back to site"}
          </Link>
          {!collapsed && (
            <div className="px-2.5 pb-1 pt-1">
              <span className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                v1.0 Demo
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-abyss/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[248px] border-r border-hairline bg-base lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-4 rounded-md p-1.5 text-text-muted hover:bg-surface-2 hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className={cn("flex min-h-[100dvh] flex-col transition-[margin] duration-300", collapsed ? "lg:ml-[72px]" : "lg:ml-[248px]")}>
        {/* Topbar */}
        <header className="surface-glass sticky top-0 z-30 border-b border-hairline">
          {/* filter-morph sweep */}
          <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
            {sweeping && (
              <div
                className="h-full w-full bg-accent-gradient"
                style={{ animation: "filter-sweep 400ms ease-out both" }}
              />
            )}
          </div>
          <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
            <button
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-text-secondary hover:bg-surface-2 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted sm:block">
                Command Center{domain ? ` / ${domain.name}` : ""}
              </div>
              <h1 className="truncate font-display text-xl font-semibold leading-tight tracking-tight">{pageTitle}</h1>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-2 md:flex">
                <FilterSelect
                  label="Month"
                  value={store.month}
                  onChange={store.setMonth}
                  options={[
                    { value: "all", label: "All" },
                    ...MONTHS.map((m) => ({ value: m.key, label: m.label })),
                  ]}
                />
                <FilterSelect
                  label="Env"
                  value={store.environment}
                  onChange={store.setEnvironment}
                  options={[{ value: "all", label: "All" }, ...ENVIRONMENTS.map((e) => ({ value: e, label: e }))]}
                />
                <FilterSelect
                  label="Team"
                  value={store.team}
                  onChange={store.setTeam}
                  options={[{ value: "all", label: "All" }, ...TEAMS.map((t) => ({ value: t, label: t }))]}
                />
                <FilterSelect
                  label="Sev"
                  value={store.severity}
                  onChange={store.setSeverity}
                  options={[{ value: "all", label: "All" }, ...SEVERITIES.map((s) => ({ value: s, label: s }))]}
                />
              </div>

              <button
                onClick={() => setPaletteOpen(true)}
                aria-label="Open command palette"
                className="flex h-8 items-center gap-2 rounded-lg border border-hairline bg-surface-1 px-2.5 font-mono text-xs text-text-muted transition-colors hover:border-accent-cyan/40 hover:text-accent-cyan"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Jump to…</span>
                <kbd className="hidden rounded border border-hairline bg-surface-2 px-1 text-[10px] lg:inline">⌘K</kbd>
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Notifications"
                    className="relative rounded-lg border border-hairline bg-surface-1 p-2 text-text-secondary transition-colors hover:border-accent-cyan/40 hover:text-accent-cyan"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sev-critical px-1 font-mono text-[9px] font-bold text-white">
                      4
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 border-hairline bg-surface-2">
                  <DropdownMenuLabel className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                    Notifications
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-hairline" />
                  {NOTIFICATIONS.map((n) => (
                    <DropdownMenuItem key={n.id} className="flex items-start gap-2.5 py-2.5 focus:bg-surface-1">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: n.sev }} />
                      <span className="flex-1 text-xs leading-snug text-text-secondary">{n.text}</span>
                      <span className="font-mono text-[10px] text-text-muted">{n.time}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-1 py-1 pl-1 pr-2.5">
                <img src="/avatar-analyst.png" alt="SecOps Lead avatar" className="h-7 w-7 rounded-full border border-hairline" />
                <div className="hidden leading-tight sm:block">
                  <div className="text-xs font-medium text-text-primary">SecOps Lead</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted">Demo mode</div>
                </div>
              </div>
            </div>
          </div>

          {/* mobile active filter chips */}
          {activeChips.length > 0 && (
            <div className="scrollbar-none flex gap-2 overflow-x-auto px-4 pb-2 md:hidden">
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={() => store.setFilters({ [c.key]: "all" })}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-cyan"
                >
                  {c.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                onClick={store.reset}
                className="shrink-0 rounded-full border border-hairline px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-text-muted"
              >
                Reset
              </button>
            </div>
          )}
        </header>

        {domain && <DomainSwitcher />}

        {/* Routed content with page transitions */}
        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ⌘K Command palette */}
      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent className="overflow-hidden border-hairline bg-surface-1 p-0 sm:max-w-lg">
          <Command className="bg-transparent">
            <CommandInput placeholder="Jump to a domain, view, or filter preset…" className="font-mono text-sm" />
            <CommandList>
              <CommandEmpty className="py-6 text-center font-mono text-xs text-text-muted">No results.</CommandEmpty>
              <CommandGroup heading="Pages" className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                <CommandItem
                  onSelect={() => { navigate("/app"); setPaletteOpen(false); }}
                  className="gap-2 font-sans text-sm"
                >
                  <LayoutDashboard className="h-4 w-4 text-accent-cyan" /> Command Center
                </CommandItem>
                {DOMAINS.map((d) => (
                  <CommandItem
                    key={d.slug}
                    onSelect={() => { navigate(`/app/${d.slug}`); setPaletteOpen(false); }}
                    className="gap-2 font-sans text-sm"
                  >
                    <d.icon className="h-4 w-4" style={{ color: d.color }} /> {d.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup heading="Filter presets" className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                <CommandItem
                  onSelect={() => { store.setFilters({ ...DEFAULT_FILTERS, severity: "Critical" }); setPaletteOpen(false); }}
                  className="gap-2 font-sans text-sm"
                >
                  <span className="h-2 w-2 rounded-full bg-sev-critical" /> Critical severity, all domains
                </CommandItem>
                <CommandItem
                  onSelect={() => { store.setFilters({ ...DEFAULT_FILTERS, environment: "Production" }); setPaletteOpen(false); }}
                  className="gap-2 font-sans text-sm"
                >
                  <span className="h-2 w-2 rounded-full bg-accent-cyan" /> Production environment only
                </CommandItem>
                <CommandItem
                  onSelect={() => { store.setFilters({ ...DEFAULT_FILTERS, month: "2025-12" }); setPaletteOpen(false); }}
                  className="gap-2 font-sans text-sm"
                >
                  <span className="h-2 w-2 rounded-full bg-accent-emerald" /> December 2025 snapshot
                </CommandItem>
                <CommandItem
                  onSelect={() => { store.reset(); setPaletteOpen(false); }}
                  className="gap-2 font-sans text-sm"
                >
                  <X className="h-4 w-4 text-text-muted" /> Reset all filters
                </CommandItem>
              </CommandGroup>
              {isFiltered(store) && (
                <div className="border-t border-hairline px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                  Active: {fKey.replace(/\|/g, " · ")}
                </div>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AppShell;
