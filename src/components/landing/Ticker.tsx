import { useMemo } from "react";
import { ALL_INCIDENTS, formatMinutes } from "@/lib/data";
import { SEVERITY_COLORS } from "@/lib/domains";

/** Live threat-feed marquee — items derived from the synthetic dataset */
export function Ticker() {
  const items = useMemo(() => {
    const crit = ALL_INCIDENTS.filter((r) => r.severity === "Critical").slice(0, 8);
    const res = ALL_INCIDENTS.filter((r) => r.status === "Resolved").slice(0, 8);
    const mixed = [...crit, ...res].slice(0, 14);
    return mixed.map((r) => ({
      id: r.id,
      label:
        r.status === "Resolved"
          ? `RESOLVED · ${r.id} · ${r.title} · ${formatMinutes(r.responseMinutes)}`
          : `${r.severity.toUpperCase()} · ${r.id} · ${r.title} · ${r.environment}`,
      color: r.status === "Resolved" ? "#34D399" : SEVERITY_COLORS[r.severity],
    }));
  }, []);

  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {items.map((it, i) => (
        <span key={`${key}-${i}`} className="flex items-center font-mono text-xs text-text-secondary">
          <span className="mx-4 inline-block h-1.5 w-1.5 rounded-full" style={{ background: it.color }} />
          {it.label}
          <span className="mx-4 text-text-muted/50">◆</span>
        </span>
      ))}
    </div>
  );

  return (
    <section
      aria-label="Live threat feed"
      className="ticker-mask relative h-14 overflow-hidden border-y border-hairline bg-surface-1"
      data-reveal
    >
      <div className="flex h-14 w-max items-center animate-ticker hover:[animation-play-state:paused]">
        {row("a")}
        {row("b")}
      </div>
    </section>
  );
}

export default Ticker;
