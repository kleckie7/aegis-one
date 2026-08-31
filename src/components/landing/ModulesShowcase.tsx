import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { DOMAINS } from "@/lib/domains";
import { incidentsByDomain, sparkline } from "@/lib/data";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const CHIPS: Record<string, string[]> = {
  "iot-security": ["1,284 devices", "23 rogue", "91% patched"],
  "information-security": ["97 controls", "98.2% training", "12 open"],
  "application-security": ["46 apps", "312 findings", "9d MTTR"],
  grc: ["4 frameworks", "87% compliant", "6 audits"],
  "cloud-security": ["3 clouds", "41 misconfigs", "$84K at risk"],
  "vulnerability-management": ["1,842 vulns", "96 critical", "72% SLA"],
  soc: ["2.6K alerts", "14m MTTD", "18 analysts"],
  "data-security": ["38 systems", "64 DLP events", "2.1h detect"],
  "network-security": ["148 incidents", "73 risk score", "4.2h response"],
  "endpoint-security": ["3,940 endpoints", "99.1% compliant", "57 quarantined"],
};

function MiniSpark({ slug, active }: { slug: string; active: boolean }) {
  const data = useMemo(
    () => sparkline(incidentsByDomain(slug)).map((v, i) => ({ i, v })),
    [slug],
  );
  return (
    <div className="h-10 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={`mod-${slug}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            key={active ? "on" : "off"}
            type="monotone"
            dataKey="v"
            stroke="#22D3EE"
            strokeWidth={1.5}
            fill={`url(#mod-${slug})`}
            isAnimationActive={active}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ModuleCard({ index, active, slug }: { index: number; active: boolean; slug: string }) {
  const domain = DOMAINS.find((d) => d.slug === slug)!;
  const Icon = domain.icon;
  return (
    <Link
      to={`/app/${slug}`}
      className={cn(
        "group block rounded-xl border bg-surface-1 p-6 transition-all duration-500",
        active
          ? "pointer-events-auto translate-y-0 scale-100 border-hairline opacity-100 shadow-glow"
          : "pointer-events-none absolute inset-0 -translate-y-6 scale-[0.97] border-hairline/50 opacity-0",
      )}
      style={{ transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)" }}
    >
      <div className="flex items-start justify-between">
        <div className="rounded-xl border border-hairline bg-surface-2 p-3" style={{ color: domain.color }}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="font-mono text-[11px] text-text-muted font-tnum">
          {String(index + 1).padStart(2, "0")} / 10
        </span>
      </div>
      <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">{domain.name}</h3>
      <p className="mt-1.5 text-[15px] text-text-secondary">{domain.tagline}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {CHIPS[slug].map((c) => (
          <span
            key={c}
            className="rounded-full border border-hairline bg-surface-2/70 px-2.5 py-1 font-mono text-[11px] text-text-secondary font-tnum"
          >
            {c}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-end justify-between">
        <MiniSpark slug={slug} active={active} />
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-accent-cyan opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Open live module <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export function ModulesShowcase({ reduced }: { reduced: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [wide, setWide] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches,
  );
  const pinned = wide && !reduced;

  // track viewport width for pin mode
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setWide(mq.matches);
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // create the pin only after the pinned markup exists in the DOM
  useEffect(() => {
    if (!pinned) return;
    const section = sectionRef.current;
    const pinEl = section?.querySelector("[data-pin]");
    if (!section || !pinEl) return;
    const st = ScrollTrigger.create({
      trigger: pinEl,
      start: "top top",
      end: "+=200%",
      pin: true,
      scrub: 0.4,
      onUpdate: (self) => {
        const idx = Math.min(9, Math.floor(self.progress * 10));
        setActive(idx);
        if (barRef.current) barRef.current.style.transform = `scaleY(${self.progress})`;
      },
    });
    return () => st.kill();
  }, [pinned]);

  // reveals for the end grid + mobile stack
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-mod-reveal]").forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "expo.out",
            delay: (i % 5) * 0.08,
            scrollTrigger: { trigger: el, start: "top 85%" },
          },
        );
      });
    }, section);
    return () => ctx.revert();
  }, [pinned]);

  return (
    <section ref={sectionRef} id="modules" className="relative py-24 max-md:py-14">
      <div className="mx-auto max-w-[1200px] px-4 lg:px-6">
        {/* pinned story (desktop) */}
        {pinned ? (
          <div data-pin className="flex min-h-[100dvh] items-center gap-12">
            <div className="w-[38%] shrink-0">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-cyan">The collection</div>
              <h2 className="mt-4 font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.02em]">
                Ten domains.
                <br />
                One command suite.
              </h2>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-text-secondary">
                Every dashboard from the classic bundle — rebuilt as live, cross-filtered modules inside a single
                shell. Scroll through the arsenal.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <span className="font-mono text-sm text-accent-cyan font-tnum">
                  {String(active + 1).padStart(2, "0")}
                </span>
                <div className="h-24 w-px overflow-hidden bg-hairline">
                  <div ref={barRef} className="h-full w-full origin-top scale-y-0 bg-accent-gradient" />
                </div>
                <span className="font-mono text-sm text-text-muted font-tnum">10</span>
              </div>
            </div>
            <div className="relative flex-1">
              <div className="relative" style={{ minHeight: 340 }}>
                {DOMAINS.map((d, i) => (
                  <ModuleCard key={d.slug} index={i} slug={d.slug} active={active === i} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* mobile / reduced-motion: vertical stack */
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-cyan">The collection</div>
            <h2 className="mt-4 font-display text-[32px] font-semibold tracking-[-0.02em]">
              Ten domains. One command suite.
            </h2>
            <div className="mt-8 space-y-4">
              {DOMAINS.map((d, i) => (
                <div key={d.slug} data-mod-reveal className="relative" style={{ minHeight: 300 }}>
                  <ModuleCard index={i} slug={d.slug} active />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* end-of-pin: the entire collection at a glance (5×2) */}
        <div className={cn(pinned && "mt-4")}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5" data-mod-reveal>
            {DOMAINS.map((d, i) => (
              <Link
                key={d.slug}
                to={`/app/${d.slug}`}
                data-mod-reveal
                className="group rounded-xl border border-hairline bg-surface-1 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
              >
                <d.icon className="h-5 w-5" style={{ color: d.color }} />
                <div className="mt-2.5 text-[13px] font-medium text-text-primary">{d.shortName}</div>
                <div className="mt-1 font-mono text-[11px] text-text-muted font-tnum">
                  risk {String(58 + ((i * 7) % 31)).padStart(2, "0")}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ModulesShowcase;
