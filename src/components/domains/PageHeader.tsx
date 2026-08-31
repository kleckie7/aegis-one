import { motion } from "framer-motion";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  descriptor: string;
}

/** Domain page header — rise-in, mono eyebrow + Space Grotesk title */
export function PageHeader({ eyebrow, title, descriptor }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-accent-cyan">
        {eyebrow}
      </div>
      <h2 className="mt-2 font-display text-[28px] font-semibold leading-tight tracking-tight text-text-primary">
        {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-sm text-text-secondary">{descriptor}</p>
    </motion.header>
  );
}

export default PageHeader;
