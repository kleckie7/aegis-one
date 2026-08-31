import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, Check, Gem, Rocket, ShieldCheck, SlidersHorizontal, Zap } from "lucide-react";
import Hero from "@/components/landing/Hero";
import Ticker from "@/components/landing/Ticker";
import ModulesShowcase from "@/components/landing/ModulesShowcase";
import DemoTeaser from "@/components/landing/DemoTeaser";
import Comparison from "@/components/landing/Comparison";
import { MagneticCta } from "@/components/MagneticCta";
import { useCountUp } from "@/components/widgets/shared";

gsap.registerPlugin(ScrollTrigger);

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */

const VALUE_PROPS = [
  { icon: Zap, title: "Time-Saving", body: "Zero manual refresh. Every chart updates the moment you filter." },
  { icon: Gem, title: "Professionally Designed", body: "SOC-grade dark UI engineered for readability at a glance." },
  {
    icon: SlidersHorizontal,
    title: "100% Interactive",
    body: "Live slicers for month, team, environment, severity — across all 10 domains at once.",
  },
  { icon: Rocket, title: "Instant Access", body: "No installs, no macros, no versioning chaos. Open the suite and go." },
];

function ValueProps() {
  return (
    <section className="relative py-24 max-md:py-14">
      <div className="mx-auto max-w-[1200px] px-4 lg:px-6">
        <div data-reveal>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-cyan">Why AEGIS ONE</div>
          <h2 className="mt-4 max-w-2xl font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[40px]">
            Spreadsheets report the past. <span className="text-gradient">AEGIS runs the present.</span>
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {VALUE_PROPS.map((v) => (
            <div
              key={v.title}
              data-value-card
              className="group rounded-xl border border-hairline bg-surface-1 p-6 transition-all duration-300 hover:shadow-glow"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-hairline bg-surface-2 text-accent-cyan shadow-[0_0_16px_rgba(34,211,238,.12)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">{v.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-text-secondary">{v.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const INCLUDED = [
  "All 10 interactive domain dashboards",
  "Unified command center",
  "Global filters: month · team · environment · severity",
  "Risk heatmap + incident explorer",
  "Lifetime updates",
  "Free future modules",
];

function PriceDigits() {
  const ref = useRef<HTMLSpanElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const v = useCountUp(seen ? 89.99 : 0, 900);
  return (
    <span ref={ref} className="font-tnum">
      ${v.toFixed(2)}
    </span>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="relative py-24 max-md:py-14">
      <div className="mx-auto max-w-[1200px] px-4 lg:px-6">
        <div className="text-center" data-reveal>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-cyan">Pricing</div>
          <h2 className="mt-4 font-display text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">
            One suite. Every domain. Launch pricing.
          </h2>
        </div>

        <div className="relative mx-auto mt-12 max-w-[560px]" data-reveal>
          {/* pulsing radial glow */}
          <div className="absolute -inset-10 rounded-full bg-accent-cyan/10 blur-3xl animate-float" aria-hidden />
          <div className="relative rounded-xl bg-accent-gradient p-px">
            <div className="rounded-[11px] bg-surface-1 p-8 animate-float">
              <div className="flex items-baseline justify-center gap-3">
                <span className="font-mono text-lg text-text-muted line-through font-tnum">$99.99</span>
                <span className="font-display text-[56px] font-bold leading-none tracking-[-0.03em] text-gradient">
                  <PriceDigits />
                </span>
              </div>
              <div className="mt-1 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
                one-time
              </div>
              <ul className="mt-7 space-y-2.5">
                {INCLUDED.map((i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[15px] text-text-secondary">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-emerald" />
                    {i}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <MagneticCta to="/app" className="w-full py-3.5 text-base">
                  Launch Live Suite <ArrowRight className="h-5 w-5" />
                </MagneticCta>
                <p className="mt-3 text-center font-mono text-[11px] text-text-muted">
                  Demo mode — no signup, no card
                </p>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["30-day guarantee", "Instant access", "Secure checkout"].map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-hairline px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "Is this really better than the Excel bundle?",
    a: "Yes: same 10 domains and KPI scope, but live-filtered, cross-linked and unified in one command center instead of 10 separate files.",
  },
  {
    q: "Do I need to code or install anything?",
    a: "No. Open the suite in a browser; everything runs instantly.",
  },
  {
    q: "Can I filter across all domains at once?",
    a: "Yes — month, team, environment and severity filters are global.",
  },
  {
    q: "Is my data real in this demo?",
    a: "This review build ships with realistic synthetic data; connect your sources in production.",
  },
  {
    q: "What does one-time pricing include?",
    a: "All current modules, the command center, and lifetime updates.",
  },
  {
    q: "Can I request a new module?",
    a: "Yes — future modules are free for bundle owners.",
  },
];

function Faq() {
  return (
    <section id="faq" className="relative py-24 max-md:py-14">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 lg:grid-cols-[1fr_1.4fr] lg:px-6">
        <div className="lg:sticky lg:top-28 lg:self-start" data-reveal>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-cyan">Questions</div>
          <h2 className="mt-4 font-display text-[32px] font-semibold tracking-[-0.02em] md:text-[40px]">
            Everything else you're wondering.
          </h2>
          <div className="mt-6 flex items-center gap-3">
            <img src="/avatar-analyst.png" alt="SecOps team avatar" className="h-11 w-11 rounded-full border border-hairline" />
            <div>
              <div className="text-sm font-medium text-text-primary">SecOps team</div>
              <div className="font-mono text-[11px] text-text-muted">replies within a day</div>
            </div>
          </div>
        </div>
        <div data-reveal>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-hairline bg-surface-1 px-5 transition-shadow hover:shadow-glow"
              >
                <AccordionTrigger className="py-4 text-left font-display text-base font-medium text-text-primary hover:text-accent-cyan hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-[15px] leading-relaxed text-text-secondary">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function FinalCta() {
  return (
    <section className="relative overflow-hidden border-y border-hairline bg-surface-1 py-24 max-md:py-14">
      <div className="absolute inset-0 blueprint-grid animate-grid-pan" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "url(/texture-noise.png)" }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1200px] px-4 text-center lg:px-6">
        <h2 data-final-h2 className="font-display text-[32px] font-bold leading-[1.08] tracking-[-0.03em] md:text-[48px]">
          {"Stop reporting risk. Start commanding it.".split(" ").map((w, i) => (
            <span key={i} className="inline-block overflow-hidden pb-1 align-top">
              <span className="inline-block will-change-transform" data-final-word>
                {w}&nbsp;
              </span>
            </span>
          ))}
        </h2>
        <div data-final-line className="mx-auto mt-4 h-px w-48 origin-center scale-x-0 bg-accent-gradient" />
        <p className="mx-auto mt-5 max-w-xl text-[15px] text-text-secondary" data-reveal>
          The entire cybersecurity bundle — live, interactive, and one click away.
        </p>
        <div className="mt-8 flex justify-center" data-reveal>
          <MagneticCta to="/app" className="px-10 py-4 text-lg">
            Launch Live Suite <ArrowRight className="h-5 w-5" />
          </MagneticCta>
        </div>
        <div className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted" data-reveal>
          10 domains · 1 suite · 0 spreadsheets
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export default function Landing() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  // Lenis smooth scroll + GSAP sync
  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ lerp: 0.11 });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // anchor links through lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const target = document.querySelector(a.getAttribute("href")!);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: -64 });
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [reduced]);

  // generic scroll reveals
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 85%" },
          },
        );
      });
      gsap.utils.toArray<HTMLElement>("[data-value-card]").forEach((el, i) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: "expo.out",
            delay: i * 0.12,
            scrollTrigger: { trigger: el, start: "top 80%" },
          },
        );
      });
      // comparison cards from opposite X offsets
      const left = root.querySelector('[data-compare="left"]');
      const right = root.querySelector('[data-compare="right"]');
      if (left && right) {
        gsap.fromTo(
          left,
          { x: -60, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.6, ease: "expo.out", scrollTrigger: { trigger: left, start: "top 80%" } },
        );
        gsap.fromTo(
          right,
          { x: 60, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.6, ease: "expo.out", scrollTrigger: { trigger: right, start: "top 80%" } },
        );
        gsap.fromTo(
          root.querySelectorAll("[data-compare-item]"),
          { y: 12, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.06,
            delay: 0.3,
            ease: "expo.out",
            scrollTrigger: { trigger: right, start: "top 75%" },
          },
        );
      }
      // demo panel scale-in
      const panel = root.querySelector("[data-demo-panel]");
      if (panel) {
        gsap.fromTo(
          panel,
          { scale: 0.92, opacity: 0, y: 30 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: { trigger: panel, start: "top 75%" },
          },
        );
      }
      // final CTA word reveal + line draw
      const words = root.querySelectorAll("[data-final-word]");
      if (words.length) {
        gsap.fromTo(
          words,
          { y: 30, filter: "blur(8px)", opacity: 0 },
          {
            y: 0,
            filter: "blur(0px)",
            opacity: 1,
            duration: 0.6,
            stagger: 0.06,
            ease: "expo.out",
            scrollTrigger: { trigger: "[data-final-h2]", start: "top 80%" },
          },
        );
        gsap.to("[data-final-line]", {
          scaleX: 1,
          duration: 0.8,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-final-h2]", start: "top 78%" },
        });
      }
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={rootRef} className="relative">
      <Hero reduced={reduced} />
      <Ticker />
      <ValueProps />
      <ModulesShowcase reduced={reduced} />
      <DemoTeaser />
      <Comparison />
      <Pricing />
      <Faq />
      <FinalCta />
      <div className="border-t border-hairline bg-base py-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
        <ShieldCheck className="mr-2 inline h-3.5 w-3.5 text-accent-emerald" />
        Review build · <Link to="/app" className="text-accent-cyan hover:underline">jump straight to the suite</Link>
      </div>
    </div>
  );
}
