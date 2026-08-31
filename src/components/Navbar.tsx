import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { DOMAINS } from "@/lib/domains";
import { MagneticCta } from "@/components/MagneticCta";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Modules", href: "#modules", id: "modules" },
  { label: "Live Demo", href: "#demo", id: "demo" },
  { label: "Compare", href: "#compare", id: "compare" },
  { label: "Pricing", href: "#pricing", id: "pricing" },
  { label: "FAQ", href: "#faq", id: "faq" },
];

/** Landing top nav — fixed overlay nav; Layout owns the content offset. */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // scroll-spy
  useEffect(() => {
    const sections = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -64 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 h-16 transition-all duration-300",
          scrolled ? "surface-glass border-b border-hairline" : "border-b border-transparent",
        )}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center gap-6 px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="AEGIS ONE logo" className="h-8 w-8" />
            <span className="font-display text-base font-bold tracking-tight text-text-primary">
              AEGIS <span className="text-gradient">ONE</span>
            </span>
          </Link>

          <nav className="mx-auto hidden items-center gap-7 lg:flex" aria-label="Primary">
            {LINKS.map((l) => (
              <a
                key={l.id}
                href={l.href}
                className={cn(
                  "relative text-sm transition-colors hover:text-accent-cyan",
                  active === l.id ? "text-accent-cyan" : "text-text-secondary",
                )}
              >
                {l.label}
                <span
                  className={cn(
                    "absolute -bottom-1.5 left-0 h-px w-full origin-left bg-accent-cyan transition-transform duration-300",
                    active === l.id ? "scale-x-100" : "scale-x-0",
                  )}
                />
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 lg:ml-0">
            <button
              onClick={() => navigate("/app")}
              className="hidden rounded-lg px-4 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary sm:block"
            >
              Sign in
            </button>
            <MagneticCta to="/app" className="hidden px-5 py-2.5 sm:inline-flex">
              Launch Live Suite <ArrowRight className="h-4 w-4" />
            </MagneticCta>
            <button
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="rounded-lg border border-hairline p-2 text-text-secondary lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile full-screen overlay — clip-path circle reveal from top-right */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col bg-abyss/95 backdrop-blur-xl"
            initial={{ clipPath: "circle(0% at 92% 5%)" }}
            animate={{ clipPath: "circle(150% at 92% 5%)" }}
            exit={{ clipPath: "circle(0% at 92% 5%)" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex h-16 items-center justify-between px-4">
              <span className="font-display text-base font-bold text-text-primary">
                AEGIS <span className="text-gradient">ONE</span>
              </span>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-hairline p-2 text-text-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col justify-center gap-5 px-8" aria-label="Mobile">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.id}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="font-display text-[28px] font-semibold text-text-primary"
                >
                  {l.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="pt-4"
              >
                <MagneticCta to="/app" className="w-full">
                  Launch Live Suite <ArrowRight className="h-4 w-4" />
                </MagneticCta>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-2 pt-6"
              >
                {DOMAINS.map((d) => (
                  <Link
                    key={d.slug}
                    to={`/app/${d.slug}`}
                    className="flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-xs text-text-secondary"
                  >
                    <d.icon className="h-3.5 w-3.5" style={{ color: d.color }} />
                    {d.shortName}
                  </Link>
                ))}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
