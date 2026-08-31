import type { ReactNode } from "react";
import { MoreHorizontal, Download, Maximize2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  /** show the "..." menu with mock export/expand actions */
  menu?: boolean;
  padded?: boolean;
}

export function SectionCard({
  title,
  subtitle,
  children,
  className,
  actions,
  menu = true,
  padded = true,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-hairline bg-surface-1 transition-shadow duration-300 hover:shadow-glow",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
            {title}
          </h3>
          {subtitle && <p className="mt-0.5 truncate text-xs text-text-muted/70">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {menu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label={`${title} options`}
                  className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="border-hairline bg-surface-2">
                <DropdownMenuItem className="gap-2 text-xs">
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-xs">
                  <Maximize2 className="h-3.5 w-3.5" /> Expand
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>
      <div className={cn(padded && "p-5")}>{children}</div>
    </section>
  );
}

export default SectionCard;
