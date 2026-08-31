import type { LucideIcon } from "lucide-react";
import {
  Cpu,
  FileLock2,
  Braces,
  Scale,
  CloudCog,
  ScanSearch,
  Radar,
  DatabaseZap,
  Network,
  MonitorSmartphone,
  LayoutDashboard,
} from "lucide-react";

export interface DomainDef {
  slug: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  color: string;
  /** approx records per month */
  volume: number;
  /** incident id prefix, e.g. NET */
  prefix: string;
  tagline: string;
  categories: string[];
  rootCauses: string[];
}

export const DOMAINS: DomainDef[] = [
  {
    slug: "iot-security",
    name: "IoT Security",
    shortName: "IoT",
    icon: Cpu,
    color: "#22D3EE",
    volume: 80,
    prefix: "IOT",
    tagline: "Every connected device, inventoried and risk-scored.",
    categories: ["Rogue Device", "Firmware Exploit", "Protocol Abuse", "Default Credentials", "Botnet C2", "Sensor Tampering"],
    rootCauses: ["Unpatched Firmware", "Weak Credentials", "Flat Network", "Shadow Device", "Vendor Backdoor"],
  },
  {
    slug: "information-security",
    name: "Information Security",
    shortName: "InfoSec",
    icon: FileLock2,
    color: "#60A5FA",
    volume: 85,
    prefix: "INF",
    tagline: "Policies, incidents and awareness in one pane.",
    categories: ["Policy Violation", "Data Mishandling", "Phishing Susceptibility", "Access Review", "Classification Gap", "Insider Risk"],
    rootCauses: ["Process Gap", "Human Error", "Stale Policy", "Missing Training", "Excessive Privilege"],
  },
  {
    slug: "application-security",
    name: "Application Security",
    shortName: "AppSec",
    icon: Braces,
    color: "#A78BFA",
    volume: 110,
    prefix: "APP",
    tagline: "OWASP findings to fix SLA, per app.",
    categories: ["Injection", "Broken Auth", "XSS", "SSRF", "Insecure Deserialization", "Dependency CVE"],
    rootCauses: ["Unsanitized Input", "Legacy Framework", "Missing Test", "Outdated Dependency", "Config Drift"],
  },
  {
    slug: "grc",
    name: "GRC",
    shortName: "GRC",
    icon: Scale,
    color: "#34D399",
    volume: 70,
    prefix: "GRC",
    tagline: "Compliance posture across ISO 27001, SOC 2, NIST.",
    categories: ["Control Failure", "Audit Finding", "Policy Exception", "Risk Acceptance", "Evidence Gap", "Vendor Risk"],
    rootCauses: ["Missing Evidence", "Control Decay", "Scope Change", "Owner Turnover", "Manual Process"],
  },
  {
    slug: "cloud-security",
    name: "Cloud Security",
    shortName: "Cloud",
    icon: CloudCog,
    color: "#22D3EE",
    volume: 90,
    prefix: "CLD",
    tagline: "CSPM misconfigs and spend-risk, multi-cloud.",
    categories: ["Public Bucket", "Overprivileged IAM", "Unencrypted Store", "Open Security Group", "Missing Logging", "Key Exposure"],
    rootCauses: ["Misconfiguration", "Drift from IaC", "Shadow IT", "Excess Privilege", "Default Settings"],
  },
  {
    slug: "vulnerability-management",
    name: "Vulnerability Management",
    shortName: "Vulns",
    icon: ScanSearch,
    color: "#FB923C",
    volume: 180,
    prefix: "VUL",
    tagline: "CVSS to patch velocity, exploitability-first.",
    categories: ["Remote Code Exec", "Privilege Escalation", "Info Disclosure", "Zero-Day", "EOL Software", "Weak Crypto"],
    rootCauses: ["Missing Patch", "Unsupported OS", "Vendor Delay", "Change Freeze", "Asset Blind Spot"],
  },
  {
    slug: "soc",
    name: "Security Operations Center",
    shortName: "SOC",
    icon: Radar,
    color: "#22D3EE",
    volume: 220,
    prefix: "SOC",
    tagline: "Alert triage, MTTD/MTTR, analyst load.",
    categories: ["Phishing", "Malware", "Lateral Movement", "Data Exfiltration", "Brute Force", "Anomalous Behavior"],
    rootCauses: ["Credential Theft", "Malicious Payload", "Misconfig Alert", "True Positive", "Noise Rule"],
  },
  {
    slug: "data-security",
    name: "Data Security",
    shortName: "Data",
    icon: DatabaseZap,
    color: "#60A5FA",
    volume: 95,
    prefix: "DAT",
    tagline: "DLP events, root causes, crown-jewel systems.",
    categories: ["DLP Block", "Unauthorized Export", "PII Exposure", "Unencrypted Transfer", "Retention Breach", "Shadow Database"],
    rootCauses: ["Human Error", "Broken DLP Rule", "Legacy System", "Missing Encryption", "Process Gap"],
  },
  {
    slug: "network-security",
    name: "Network Security",
    shortName: "Network",
    icon: Network,
    color: "#34D399",
    volume: 150,
    prefix: "NET",
    tagline: "Incidents, environments, response — the classic, now live.",
    categories: ["Intrusion Attempt", "DDoS", "Ransomware Beacon", "Port Scan", "DNS Tunneling", "Rogue Access Point"],
    rootCauses: ["Perimeter Gap", "Flat VLAN", "Unpatched Appliance", "Weak Segmentation", "Stolen VPN Creds"],
  },
  {
    slug: "endpoint-security",
    name: "Endpoint Security",
    shortName: "Endpoint",
    icon: MonitorSmartphone,
    color: "#A78BFA",
    volume: 140,
    prefix: "END",
    tagline: "Fleet compliance and EDR detections at scale.",
    categories: ["EDR Detection", "Ransomware Block", "Quarantine", "USB Violation", "Disk Encryption Gap", "Tamper Attempt"],
    rootCauses: ["Outdated Agent", "User Disabled AV", "Unmanaged Device", "Malicious Macro", "Missing Patch"],
  },
];

export const COMMAND_CENTER = {
  slug: "app",
  name: "Command Center",
  shortName: "Command",
  icon: LayoutDashboard,
  color: "#22D3EE",
};

export const domainBySlug = (slug: string) => DOMAINS.find((d) => d.slug === slug);

export const SEVERITIES = ["Critical", "High", "Medium", "Low"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: "#F43F5E",
  High: "#FB923C",
  Medium: "#FACC15",
  Low: "#34D399",
};

export const STATUSES = ["Open", "In Progress", "Resolved"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_COLORS: Record<Status, string> = {
  Open: "#F43F5E",
  "In Progress": "#FBBF24",
  Resolved: "#34D399",
};

export const TEAMS = [
  "Threat Response",
  "Infrastructure",
  "AppSec Engineering",
  "Cloud SecOps",
  "Governance Office",
  "Endpoint Fleet",
] as const;
export type Team = (typeof TEAMS)[number];

export const ENVIRONMENTS = ["Production", "Corporate", "Staging"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

export const CHART_SERIES = ["#22D3EE", "#34D399", "#60A5FA", "#A78BFA", "#64748B"];

export const MONTHS = [
  { key: "2025-01", label: "Jan 2025", short: "Jan" },
  { key: "2025-02", label: "Feb 2025", short: "Feb" },
  { key: "2025-03", label: "Mar 2025", short: "Mar" },
  { key: "2025-04", label: "Apr 2025", short: "Apr" },
  { key: "2025-05", label: "May 2025", short: "May" },
  { key: "2025-06", label: "Jun 2025", short: "Jun" },
  { key: "2025-07", label: "Jul 2025", short: "Jul" },
  { key: "2025-08", label: "Aug 2025", short: "Aug" },
  { key: "2025-09", label: "Sep 2025", short: "Sep" },
  { key: "2025-10", label: "Oct 2025", short: "Oct" },
  { key: "2025-11", label: "Nov 2025", short: "Nov" },
  { key: "2025-12", label: "Dec 2025", short: "Dec" },
] as const;
