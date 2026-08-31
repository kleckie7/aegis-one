import type { Incident } from "@/lib/data";
import type { Severity } from "@/lib/domains";

const SEV_WEIGHT: Record<Severity, number> = { Critical: 40, High: 24, Medium: 12, Low: 4 };

/** composite risk: severity weight + likelihood × impact */
export function riskValue(r: Incident): number {
  return SEV_WEIGHT[r.severity] + r.likelihood * r.impact;
}
