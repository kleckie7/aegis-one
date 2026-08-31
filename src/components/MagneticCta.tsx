import { useRef, type ReactNode } from "react";
import { Link } from "react-router";
import { motion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * magnetic-cta: button subtly translates toward cursor (≤6px), springs back on leave.
 */
export function MagneticCta({
  to,
  href,
  children,
  variant = "primary",
  className,
  onClick,
}: {
  to?: string;
  href?: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 18 });
  const y = useSpring(0, { stiffness: 220, damping: 18 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    x.set(Math.max(-6, Math.min(6, dx * 0.18)));
    y.set(Math.max(-6, Math.min(6, dy * 0.18)));
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const cls = cn(
    "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg px-6 py-3 font-display text-sm font-semibold transition-all duration-300",
    variant === "primary"
      ? "bg-accent-gradient bg-[length:200%_100%] bg-right text-abyss shadow-[0_0_28px_rgba(34,211,238,.25)] hover:bg-left hover:shadow-[0_0_40px_rgba(34,211,238,.4)]"
      : "border border-hairline text-text-secondary hover:border-accent-cyan/50 hover:text-accent-cyan",
    className,
  );

  const inner = (
    <motion.span ref={ref} style={{ x, y }} onMouseMove={onMove} onMouseLeave={onLeave} className={cls} onClick={onClick}>
      {children}
    </motion.span>
  );

  if (to) return <Link to={to}>{inner}</Link>;
  if (href) return <a href={href}>{inner}</a>;
  return inner;
}

export default MagneticCta;
