/* IoT Security — deterministic fleet posture data (posture constants, env-scaled) */

export interface DeviceTypeDef {
  name: string;
  short: string;
  count: number;
  current: number;
  outdated: number;
  eol: number;
  rogue: number;
  firmware: string;
}

/** 7 device classes, 1,284 devices total */
export const DEVICE_TYPES: DeviceTypeDef[] = [
  { name: "Cameras", short: "CAM", count: 296, current: 260, outdated: 18, eol: 18, rogue: 6, firmware: "v4.2.1" },
  { name: "Sensors", short: "SEN", count: 341, current: 324, outdated: 11, eol: 6, rogue: 5, firmware: "v2.9.4" },
  { name: "Printers", short: "PRN", count: 118, current: 97, outdated: 7, eol: 14, rogue: 3, firmware: "v6.1.0" },
  { name: "HVAC Controllers", short: "HVAC", count: 142, current: 131, outdated: 6, eol: 5, rogue: 3, firmware: "v3.3.7" },
  { name: "Medical Devices", short: "MED", count: 87, current: 83, outdated: 2, eol: 2, rogue: 1, firmware: "v8.0.2" },
  { name: "Industrial PLCs", short: "PLC", count: 164, current: 146, outdated: 6, eol: 12, rogue: 4, firmware: "v5.4.9" },
  { name: "Smart Displays", short: "DSP", count: 136, current: 126, outdated: 4, eol: 6, rogue: 1, firmware: "v1.7.3" },
];

export const TOTAL_DEVICES = DEVICE_TYPES.reduce((a, t) => a + t.count, 0); // 1284
export const TOTAL_ROGUE = DEVICE_TYPES.reduce((a, t) => a + t.rogue, 0); // 23
export const FIRMWARE_CURRENT_PCT = Math.round(
  (DEVICE_TYPES.reduce((a, t) => a + t.current, 0) / TOTAL_DEVICES) * 100,
); // 91

export interface ProtocolDef {
  name: string;
  share: number; // % of device traffic
  insecure: boolean;
  color: string;
}

export const PROTOCOLS: ProtocolDef[] = [
  { name: "MQTT", share: 20, insecure: false, color: "#22D3EE" },
  { name: "HTTP/S", share: 24, insecure: true, color: "#FB923C" },
  { name: "CoAP", share: 16, insecure: false, color: "#34D399" },
  { name: "Zigbee", share: 13, insecure: false, color: "#60A5FA" },
  { name: "BLE", share: 13, insecure: false, color: "#A78BFA" },
  { name: "Modbus", share: 14, insecure: true, color: "#F43F5E" },
];

export const INSECURE_SHARE = PROTOCOLS.filter((p) => p.insecure).reduce((a, p) => a + p.share, 0); // 38

/** Fleet posture holds under Team/Month/Severity; Environment scales it. */
export const ENV_SCALE: Record<string, number> = {
  Production: 0.52,
  Corporate: 0.36,
  Staging: 0.12,
};

export function scaledCount(n: number, environment: string): number {
  if (environment === "all") return n;
  return Math.max(1, Math.round(n * (ENV_SCALE[environment] ?? 1)));
}

export function scaledTypes(environment: string): DeviceTypeDef[] {
  return DEVICE_TYPES.map((t) => ({
    ...t,
    count: scaledCount(t.count, environment),
    current: scaledCount(t.current, environment),
    outdated: scaledCount(t.outdated, environment),
    eol: scaledCount(t.eol, environment),
    rogue: scaledCount(t.rogue, environment),
  }));
}

/* ------------------------------------------------------------------ */
/* Fleet matrix cells — 1,284 devices virtualized to ~321 cells        */
/* ------------------------------------------------------------------ */

export type CellState = "healthy" | "outdated" | "eol" | "rogue";

export interface FleetCell {
  typeIdx: number;
  state: CellState;
  devices: number;
}

export const CELL_STATES: { key: CellState; label: string; color: string }[] = [
  { key: "healthy", label: "Healthy", color: "#34D399" },
  { key: "outdated", label: "Outdated FW", color: "#FACC15" },
  { key: "eol", label: "End-of-Life", color: "#FB923C" },
  { key: "rogue", label: "Rogue", color: "#F43F5E" },
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STATE_PRIORITY: CellState[] = ["rogue", "eol", "outdated", "healthy"];
const BUCKET = 4; // devices per rendered cell

/** Build the virtualized dot matrix: one cell per ~4 devices, colored by worst state in the bucket. */
export function buildFleetCells(environment: string): { cells: FleetCell[]; cols: number } {
  const types = scaledTypes(environment);
  const rand = mulberry32(7);
  const devices: { typeIdx: number; state: CellState }[] = [];

  types.forEach((t, typeIdx) => {
    const states: CellState[] = [
      ...Array<CellState>(t.rogue).fill("rogue"),
      ...Array<CellState>(t.eol).fill("eol"),
      ...Array<CellState>(t.outdated).fill("outdated"),
      ...Array<CellState>(Math.max(0, t.count - t.rogue - t.eol - t.outdated)).fill("healthy"),
    ];
    // shuffle within the device type so dots mix
    for (let i = states.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [states[i], states[j]] = [states[j], states[i]];
    }
    states.forEach((state) => devices.push({ typeIdx, state }));
  });

  const cells: FleetCell[] = [];
  for (let i = 0; i < devices.length; i += BUCKET) {
    const bucket = devices.slice(i, i + BUCKET);
    const state = STATE_PRIORITY.find((s) => bucket.some((d) => d.state === s)) ?? "healthy";
    cells.push({ typeIdx: bucket[0].typeIdx, state, devices: bucket.length });
  }
  return { cells, cols: 29 };
}

/** Deterministic device-type assignment for an incident (derived from its id). */
export function deviceTypeForIncident(id: string): DeviceTypeDef {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return DEVICE_TYPES[h % DEVICE_TYPES.length];
}

/** Deterministic protocol assignment for an incident. */
export function protocolForIncident(id: string): ProtocolDef {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) >>> 0;
  return PROTOCOLS[h % PROTOCOLS.length];
}
