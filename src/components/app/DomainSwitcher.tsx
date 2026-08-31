import { Link, useLocation } from "react-router";
import { DOMAINS } from "@/lib/domains";
import { cn } from "@/lib/utils";

/** Horizontally scrollable pill strip of all 10 domains (scroll-snap wayfinding) */
export function DomainSwitcher() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Domain switcher"
      className="scrollbar-none flex gap-2 overflow-x-auto border-b border-hairline bg-base/60 px-4 py-2.5 lg:px-6"
      style={{ scrollSnapType: "x proximity" }}
    >
      {DOMAINS.map((d) => {
        const active = pathname === `/app/${d.slug}`;
        const Icon = d.icon;
        return (
          <Link
            key={d.slug}
            to={`/app/${d.slug}`}
            style={{ scrollSnapAlign: "start" }}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-all duration-200",
              active
                ? "border-transparent bg-accent-gradient font-semibold text-abyss shadow-[0_0_18px_rgba(34,211,238,.25)]"
                : "border-hairline text-text-secondary hover:border-accent-cyan/40 hover:text-accent-cyan",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {d.shortName}
          </Link>
        );
      })}
    </nav>
  );
}

export default DomainSwitcher;
