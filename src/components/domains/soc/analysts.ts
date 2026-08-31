import type { Incident } from "@/lib/data";

/* Deterministic SOC-specific derivations from incident records */

export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h / 4294967296;
}

export type Shift = "Day" | "Swing" | "Night";
export const SHIFTS: Shift[] = ["Day", "Swing", "Night"];

export const SHIFT_COLORS: Record<Shift, string> = {
  Day: "#22D3EE",
  Swing: "#A78BFA",
  Night: "#60A5FA",
};

export function shiftOf(iso: string): Shift {
  const h = new Date(iso).getUTCHours();
  if (h >= 6 && h < 14) return "Day";
  if (h >= 14 && h < 22) return "Swing";
  return "Night";
}

/* 18 analysts, 6 per shift */
const SURNAMES = [
  "Reyes", "Okafor", "Lindqvist", "Patel", "Novak", "Tanaka",
  "Moreau", "Alvarez", "Kimura", "Haddad", "Novak", "Fischer",
  "Osei", "Kowalski", "Nguyen", "Silva", "Ivanova", "Marsh",
];
const INITIALS = ["A", "M", "J", "S", "D", "K", "L", "R", "T", "Y", "P", "E", "N", "C", "V", "B", "I", "G"];

export interface Analyst {
  id: number;
  name: string;
  shift: Shift;
}

export const ANALYSTS: Analyst[] = SURNAMES.map((s, i) => ({
  id: i,
  name: `${INITIALS[i]}. ${s}`,
  shift: SHIFTS[Math.floor(i / 6)],
}));

export function analystFor(r: Incident): Analyst {
  return ANALYSTS[Math.floor(hashId(r.id) * ANALYSTS.length) % ANALYSTS.length];
}

/* Triage funnel stages */
export const STAGES = ["Ingested", "Triaged", "Investigated", "Escalated", "Contained"] as const;
export type Stage = (typeof STAGES)[number];

/** deterministic stage 1..5 per alert */
export function stageOf(r: Incident): number {
  if (r.status === "Resolved") return 5;
  const h = hashId(r.id);
  if (r.severity === "Critical" || h < 0.22) return 4;
  if (r.status === "In Progress" || h < 0.62) return 3;
  return 2;
}

export const STAGE_COLORS = ["#22D3EE", "#4CC9E4", "#60A5FA", "#8FB8A8", "#34D399"];

export const DROPOFF_REASONS: Record<Stage, string[]> = {
  Ingested: ["Sensor noise", "Duplicate correlation", "Rate-limited source"],
  Triaged: ["Auto-closed benign", "Known false positive", "Suppressed rule"],
  Investigated: ["No user impact", "Duplicate of open case", "Watchlist only"],
  Escalated: ["Contained by EDR", "Blocked at perimeter", "Policy auto-action"],
  Contained: ["—"],
};

/** mean time to detect, minutes — derived deterministically (severity-weighted) */
export function mttdOf(r: Incident): number {
  const base = r.severity === "Critical" ? 4 : r.severity === "High" ? 9 : r.severity === "Medium" ? 18 : 32;
  return Math.max(1, Math.round(base * (0.4 + hashId(r.id) * 1.6)));
}

export function avgMttd(records: Incident[]): number {
  if (records.length === 0) return 0;
  return Math.round(records.reduce((a, r) => a + mttdOf(r), 0) / records.length);
}
