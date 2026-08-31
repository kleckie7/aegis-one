import { motion } from "framer-motion";
import { useFilterKey } from "@/components/widgets/shared";
import { POLICY_CHECKS } from "./ComplianceHeatStrip";

interface NonCompliantDevice {
  hostname: string;
  user: string;
  failed: string[];
  lastSeen: string;
}

const HOSTS = ["ws-fin-0412", "lt-mkt-0233", "srv-legacy-02", "ws-hr-0188", "lt-eng-0904", "ws-ops-0317"];
const USERS = ["j.chen", "m.alvarez", "s.patel", "d.novak", "k.tanaka", "l.moreau"];
const SEEN = ["12m ago", "38m ago", "1h ago", "3h ago", "6h ago", "9h ago"];

function buildDevices(): NonCompliantDevice[] {
  return HOSTS.map((hostname, i) => {
    const failed: string[] = [];
    // deterministic 1–3 failed checks per device
    for (let c = 0; c < POLICY_CHECKS.length; c++) {
      const h = Math.sin((i + 1) * 91.7 + (c + 1) * 47.3) * 43758.5453;
      if (h - Math.floor(h) > 0.62) failed.push(POLICY_CHECKS[c]);
    }
    if (failed.length === 0) failed.push(POLICY_CHECKS[i % POLICY_CHECKS.length]);
    return { hostname, user: USERS[i], failed, lastSeen: SEEN[i] };
  });
}

const DEVICES = buildDevices();

/** Compact non-compliant device table (6 rows) */
export function NonCompliantTable() {
  const filterKey = useFilterKey();
  return (
    <div key={filterKey} className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-hairline">
            {["Hostname", "User", "Failed checks", "Last seen"].map((h) => (
              <th key={h} className="px-2 py-2 text-left font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DEVICES.map((d, i) => (
            <motion.tr
              key={d.hostname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className="border-b border-hairline/50 transition-colors hover:bg-surface-2"
            >
              <td className="whitespace-nowrap px-2 py-2.5 font-mono text-xs text-accent-cyan">{d.hostname}</td>
              <td className="whitespace-nowrap px-2 py-2.5 text-xs text-text-secondary">{d.user}</td>
              <td className="px-2 py-2.5">
                <div className="flex flex-wrap gap-1">
                  {d.failed.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-sev-critical/40 bg-sev-critical/10 px-2 py-px font-mono text-[9px] uppercase tracking-wider text-sev-critical"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </td>
              <td className="whitespace-nowrap px-2 py-2.5 font-mono text-[11px] text-text-muted">{d.lastSeen}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default NonCompliantTable;
