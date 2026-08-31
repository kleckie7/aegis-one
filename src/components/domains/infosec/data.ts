/* Information Security — policy attestation & awareness posture data */

export interface PolicyDef {
  name: string;
  attestation: number; // %
  dueDays: number; // negative = overdue
}

/** 12 tracked policies — avg attestation 94%, AI Usage overdue */
export const POLICIES: PolicyDef[] = [
  { name: "Acceptable Use", attestation: 98, dueDays: 41 },
  { name: "Access Control", attestation: 97, dueDays: 18 },
  { name: "BYOD", attestation: 92, dueDays: 26 },
  { name: "Data Handling", attestation: 96, dueDays: 12 },
  { name: "Remote Work", attestation: 95, dueDays: 33 },
  { name: "Password", attestation: 93, dueDays: 9 },
  { name: "Encryption", attestation: 99, dueDays: 54 },
  { name: "Vendor Access", attestation: 86, dueDays: 7 },
  { name: "Incident Reporting", attestation: 99, dueDays: 47 },
  { name: "Clean Desk", attestation: 93, dueDays: 21 },
  { name: "AI Usage", attestation: 82, dueDays: -6 },
  { name: "Social Media", attestation: 98, dueDays: 38 },
];

export const POLICY_AVG = Math.round(
  POLICIES.reduce((a, p) => a + p.attestation, 0) / POLICIES.length,
); // 94
export const POLICIES_ON_TRACK = POLICIES.filter((p) => p.dueDays >= 0 && p.attestation >= 85).length; // 11

export interface DepartmentDef {
  name: string;
  completion: number; // %
}

/** 8 departments — avg 98.2%, target 95% */
export const DEPARTMENTS: DepartmentDef[] = [
  { name: "Engineering", completion: 99.1 },
  { name: "Finance", completion: 98.4 },
  { name: "Human Resources", completion: 99.3 },
  { name: "Sales", completion: 95.2 },
  { name: "Operations", completion: 97.6 },
  { name: "Legal", completion: 99.8 },
  { name: "Support", completion: 96.1 },
  { name: "Executive", completion: 100 },
];

export const TRAINING_TARGET = 95;
export const TRAINING_AVG =
  Math.round((DEPARTMENTS.reduce((a, d) => a + d.completion, 0) / DEPARTMENTS.length) * 10) / 10; // 98.2
