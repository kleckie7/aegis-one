import { Link } from "react-router";
import { DOMAINS } from "@/lib/domains";

/** Landing footer (app pages have no footer — the shell is full-height). */
export function Footer() {
  return (
    <footer className="relative border-t border-hairline bg-base">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "url(/texture-noise.png)" }}
      />
      <div className="relative mx-auto max-w-[1200px] px-4 py-14 lg:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <img src="/logo.svg" alt="AEGIS ONE logo" className="h-8 w-8" />
              <span className="font-display text-base font-bold tracking-tight text-text-primary">
                AEGIS <span className="text-gradient">ONE</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
              Visualize Risk. Track Compliance. Command Your Entire Security Posture.
            </p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
              Demo build — synthetic data, no signup
            </p>
          </div>
          <div>
            <h4 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">Modules</h4>
            <ul className="mt-4 grid grid-cols-1 gap-2">
              <li>
                <Link to="/app" className="text-sm text-text-secondary transition-colors hover:text-accent-cyan">
                  Command Center
                </Link>
              </li>
              {DOMAINS.map((d) => (
                <li key={d.slug}>
                  <Link
                    to={`/app/${d.slug}`}
                    className="text-sm text-text-secondary transition-colors hover:text-accent-cyan"
                  >
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">Resources</h4>
            <ul className="mt-4 space-y-2">
              {["Documentation", "API Reference", "Changelog", "Security", "Status"].map((r) => (
                <li key={r}>
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-sm text-text-secondary transition-colors hover:text-accent-cyan">
                    {r}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-6 sm:flex-row">
          <span className="font-mono text-xs text-text-muted">
            © 2025 AEGIS ONE — Interactive Security Suite
          </span>
          <span className="rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-cyan">
            Built for review
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
