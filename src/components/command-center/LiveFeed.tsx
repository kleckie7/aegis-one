import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { SectionCard } from "@/components/widgets/SectionCard";
import { ALL_INCIDENTS } from "@/lib/data";
import { SEVERITY_COLORS, domainBySlug, type Severity } from "@/lib/domains";
import { cn } from "@/lib/utils";

interface FeedItem {
  key: number;
  id: string;
  title: string;
  domain: string;
  severity: Severity;
  time: number; // ms epoch (virtual timeline continuing the dataset)
}

const FEED_CAP = 14;
const PUSH_MS = 8000;

function relTime(deltaMs: number): string {
  const s = Math.max(0, Math.round(deltaMs / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** weighted random severity — feed skews toward actionable items */
function randomSeverity(): Severity {
  const r = Math.random();
  if (r < 0.14) return "Critical";
  if (r < 0.45) return "High";
  if (r < 0.78) return "Medium";
  return "Low";
}

function seedFeed(): FeedItem[] {
  const recent = [...ALL_INCIDENTS]
    .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
    .slice(0, 9);
  return recent.map((r, i) => ({
    key: i,
    id: r.id,
    title: r.title,
    domain: r.domain,
    severity: r.severity,
    time: Date.parse(r.detectedAt),
  }));
}

/** Row 4 (right) — auto-updating live incident feed (mock push every 8s) */
export function LiveFeed() {
  const [items, setItems] = useState<FeedItem[]>(seedFeed);
  const [manualPause, setManualPause] = useState(false);
  const [hoverPause, setHoverPause] = useState(false);
  const [received, setReceived] = useState(0);
  const keyRef = useRef(100);

  const paused = manualPause || hoverPause;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setItems((prev) => {
        const src = ALL_INCIDENTS[Math.floor(Math.random() * ALL_INCIDENTS.length)];
        const newest = prev[0]?.time ?? Date.parse(src.detectedAt);
        const item: FeedItem = {
          key: keyRef.current++,
          id: `${src.id.slice(0, 4)}${Math.floor(2000 + Math.random() * 7999)}`,
          title: src.title,
          domain: src.domain,
          severity: randomSeverity(),
          time: newest + (60 + Math.floor(Math.random() * 180)) * 1000,
        };
        return [item, ...prev].slice(0, FEED_CAP);
      });
      setReceived((n) => n + 1);
    }, PUSH_MS);
    return () => clearInterval(t);
  }, [paused]);

  const newest = items[0]?.time ?? 0;

  return (
    <SectionCard
      title="Live Incident Feed"
      subtitle="Streaming detections · all domains"
      className="h-full"
      menu={false}
      actions={
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-hairline bg-surface-2/60 px-2 py-0.5 font-mono text-[10px] text-text-muted font-tnum">
            +{received} this session
          </span>
          <button
            onClick={() => setManualPause((v) => !v)}
            aria-label={manualPause ? "Resume live feed" : "Pause live feed"}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors",
              paused
                ? "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan"
                : "border-hairline text-text-secondary hover:text-text-primary",
            )}
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      }
    >
      <ul
        className="max-h-[380px] space-y-1.5 overflow-y-auto pr-1"
        onMouseEnter={() => setHoverPause(true)}
        onMouseLeave={() => setHoverPause(false)}
        aria-live="polite"
        aria-label="Live incident feed"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const d = domainBySlug(item.domain);
            return (
              <motion.li
                key={item.key}
                layout
                initial={{ opacity: 0, y: -16, backgroundColor: "rgba(34,211,238,0.16)" }}
                animate={{ opacity: 1, y: 0, backgroundColor: "rgba(34,211,238,0)" }}
                exit={{ opacity: 0 }}
                transition={{
                  layout: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                  opacity: { duration: 0.25 },
                  y: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
                  backgroundColor: { duration: 0.6, ease: "easeOut" },
                }}
                className="flex items-center gap-3 rounded-lg border border-hairline/50 px-3 py-2"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: SEVERITY_COLORS[item.severity] }}
                  title={item.severity}
                />
                <span className="shrink-0 font-mono text-xs text-accent-cyan">{item.id}</span>
                <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">{item.title}</span>
                {d && (
                  <span
                    className="hidden shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider sm:inline"
                    style={{ color: d.color, borderColor: `${d.color}44`, background: `${d.color}12` }}
                  >
                    {d.shortName}
                  </span>
                )}
                <span className="shrink-0 font-mono text-[10px] text-text-muted font-tnum">
                  {relTime(newest - item.time)}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </SectionCard>
  );
}

export default LiveFeed;
