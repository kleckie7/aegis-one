import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowDown, Boxes, SlidersHorizontal, Zap, Code2 } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MagneticCta } from "@/components/MagneticCta";
import type { GlobeControls } from "./GlobeCanvas";

const GlobeCanvas = lazy(() => import("./GlobeCanvas"));

gsap.registerPlugin(ScrollTrigger);

const H1_LINE1 = "Visualize Risk. Track Compliance.";
const H1_LINE2 = "Command Your Entire Security Posture.";
const TYPED = "> 10 domains. One live command suite. Zero spreadsheets.";

function splitChars(text: string, gradient = false) {
  return text.split(" ").map((word, wi) => (
    <span key={wi} className="inline-block whitespace-nowrap">
      {word.split("").map((c, ci) => (
        <span
          key={ci}
          className={
            gradient
              ? "inline-block bg-accent-gradient bg-clip-text text-transparent will-change-transform"
              : "inline-block will-change-transform"
          }
          data-char
        >
          {c}
        </span>
      ))}
      {"\u00A0"}
    </span>
  ));
}

function TypedLine({ start }: { start: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    const iv = setInterval(() => {
      setN((v) => {
        if (v >= TYPED.length) {
          clearInterval(iv);
          return v;
        }
        return v + 1;
      });
    }, 1000 / 28);
    return () => clearInterval(iv);
  }, [start]);
  return (
    <p className="mt-6 min-h-6 font-mono text-[15px] text-accent-emerald">
      {TYPED.slice(0, n)}
      <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-accent-emerald animate-caret-blink" />
    </p>
  );
}

export function Hero({ reduced }: { reduced: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const [typedStart, setTypedStart] = useState(false);
  const [controls] = useState<GlobeControls>(() => ({
    speed: { current: 1 },
    mouse: { current: { x: 0, y: 0 } },
  }));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      controls.mouse.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [controls]);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const ctx = gsap.context(() => {
      // H1 char reveal
      gsap.fromTo(
        "[data-char]",
        { yPercent: 110, rotateX: -60, opacity: 0 },
        {
          yPercent: 0,
          rotateX: 0,
          opacity: 1,
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.018,
          delay: 0.2,
          onComplete: () => setTypedStart(true),
        },
      );
      // CTAs + chips rise-in
      gsap.fromTo(
        "[data-hero-rise]",
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "expo.out", stagger: 0.1, delay: 1.4 },
      );

      if (!reduced) {
        // pinned scroll story
        const rings = ringsRef.current?.querySelectorAll("[data-ring]");
        gsap
          .timeline({
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=150%",
              pin: true,
              scrub: 0.6,
              onUpdate: (self) => {
                controls.speed.current = 1 + self.progress * 2;
              },
            },
          })
          .to(content, { y: -120, opacity: 0, ease: "none" }, 0)
          .fromTo(
            rings ?? [],
            { scale: 0.8, opacity: 0.35 },
            { scale: 1.6, opacity: 0, ease: "none", stagger: 0.15 },
            0,
          );
      }
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={sectionRef} className="relative -mt-16 flex min-h-[100dvh] items-center overflow-hidden">
      {/* background layers */}
      <div className="absolute inset-0 vignette-abyss" />
      {reduced ? (
        <img
          src="/hero-poster.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-60"
        />
      ) : (
        <>
          <img
            src="/hero-poster.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
          <Suspense fallback={null}>
            <GlobeCanvas controls={controls} />
          </Suspense>
        </>
      )}
      <div className="absolute inset-0 blueprint-grid-masked" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "url(/texture-noise.png)" }}
      />
      {/* radar rings */}
      <div ref={ringsRef} className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            data-ring
            className="absolute h-[38vmin] w-[38vmin] rounded-full border border-accent-cyan/30 opacity-0"
          />
        ))}
      </div>
      {/* readability gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-abyss/90 via-abyss/50 to-transparent" />

      {/* content */}
      <div ref={contentRef} className="relative z-10 mx-auto w-full max-w-[1200px] px-4 pt-16 lg:px-6">
        <div className="max-w-[640px]">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-cyan">
            <span className="h-2 w-2 rounded-full bg-accent-cyan animate-glow-pulse" />
            The all-in-one cybersecurity bundle — reimagined live
          </div>
          <h1
            className="mt-5 font-display text-[40px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[56px] xl:text-[64px]"
            style={{ perspective: 800 }}
          >
            <span className="block overflow-hidden pb-1">{splitChars(H1_LINE1)}</span>
            <span className="block overflow-hidden pb-1">{splitChars(H1_LINE2, true)}</span>
          </h1>
          <TypedLine start={typedStart || reduced} />
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span data-hero-rise className="opacity-0">
              <MagneticCta to="/app">
                Launch Live Suite <ArrowRight className="h-4 w-4" />
              </MagneticCta>
            </span>
            <span data-hero-rise className="opacity-0">
              <MagneticCta href="#modules" variant="ghost">
                See what's included <ArrowDown className="h-4 w-4" />
              </MagneticCta>
            </span>
          </div>
          <div className="mt-10 flex flex-wrap gap-2.5">
            {[
              { icon: Boxes, label: "10 Modules" },
              { icon: SlidersHorizontal, label: "Live Filtering" },
              { icon: Zap, label: "Instant Demo" },
              { icon: Code2, label: "No Coding Required" },
            ].map((c) => (
              <span
                key={c.label}
                data-hero-rise
                className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface-1/70 px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-text-secondary opacity-0 backdrop-blur-sm"
              >
                <c.icon className="h-3.5 w-3.5 text-accent-cyan" />
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
