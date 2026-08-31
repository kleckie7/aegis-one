import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  label: string;
  /** toast message on success */
  successMessage: string;
  variant?: "primary" | "danger" | "ghost";
}

/** Mock async action: spinner (1.2s) → emerald check morph → sonner toast */
export function ActionButton({ label, successMessage, variant = "primary" }: ActionButtonProps) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const run = () => {
    if (state !== "idle") return;
    setState("busy");
    timer.current = setTimeout(() => {
      setState("done");
      toast.success(successMessage);
      timer.current = setTimeout(() => setState("idle"), 1600);
    }, 1200);
  };

  return (
    <button
      onClick={run}
      disabled={state !== "idle"}
      className={cn(
        "relative flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors",
        variant === "primary" &&
          "border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan hover:bg-accent-cyan/20",
        variant === "danger" &&
          "border-sev-critical/50 bg-sev-critical/10 text-sev-critical hover:bg-sev-critical/20",
        variant === "ghost" &&
          "border-hairline text-text-secondary hover:border-accent-cyan/40 hover:text-text-primary",
        state !== "idle" && "opacity-90",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "busy" ? (
          <motion.span
            key="busy"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Working
          </motion.span>
        ) : state === "done" ? (
          <motion.span
            key="done"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="flex items-center gap-2 text-accent-emerald"
          >
            <Check className="h-3.5 w-3.5" /> Done
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export default ActionButton;
