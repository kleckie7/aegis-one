# AEGIS ONE — Cybersecurity All-in-One Command Suite

> **Visualize Risk. Track Compliance. Command Your Entire Security Posture.**

AEGIS ONE is a fully interactive, web-based cybersecurity management suite. It reimagines a commercial "Cybersecurity All-in-One Bundle" (a pack of 10 static Excel dashboard templates sold for $89.99) as a single live web application — one unified command center plus **10 interactive domain dashboards**, all driven by a global real-time filter system.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-34D399)

---

## What It Does

| Area | Highlights |
|---|---|
| **Landing page** | Cinematic hero with a Three.js particle globe, live threat ticker, pinned scroll showcase of all 10 modules, a working filterable mini-dashboard teaser, Excel-vs-web comparison, pricing, FAQ |
| **Command Center** (`/app`) | Org-wide risk gauge, cross-domain KPIs, a 10-tile domain status grid that re-sorts itself by risk (FLIP animation), global trend chart with drag-to-filter brush, 5×5 risk heatmap, live auto-updating incident feed, top-risks table |
| **10 domain dashboards** | IoT Security · Information Security · Application Security · GRC · Cloud Security · Vulnerability Management · SOC · Data Security · Network Security · Endpoint Security — each with tailored KPIs, charts, signature widgets, and a searchable/sortable incident explorer with a slide-in detail drawer |

### The 10 Modules

1. **IoT Security** — 1,284-device fleet matrix, protocol breakdown, firmware patch status
2. **Information Security** — policy attestation board, awareness training, data classification
3. **Application Security** — OWASP A01–A10 findings board, SAST/DAST trends, fix-SLA dial
4. **GRC** — ISO 27001 / SOC 2 / NIST CSF / PCI-DSS compliance rings, audit calendar, risk register
5. **Cloud Security** — CSPM posture, misconfiguration tracking, multi-cloud spend-vs-risk scatter
6. **Vulnerability Management** — patch SLA, CVSS distribution, exploitability, MTTR, loss-per-asset
7. **SOC** — alert triage funnel, MTTD/MTTR vs targets, analyst workload board
8. **Data Security** — detection-time trends, DLP events, incidents by system and business unit
9. **Network Security** — live rebuild of the original Excel reference dashboard (same KPI scope, fully interactive)
10. **Endpoint Security** — fleet compliance heat strip, EDR detections, quarantine actions

## Key Engineering Features

- **Global filter system** — one Zustand store (Month / Environment / Team / Severity); every KPI, chart, gauge, heatmap, and table on every page derives from the same filtered dataset and re-animates on change
- **Seeded synthetic data engine** — a deterministic generator (mulberry32, seed 42) produces ~14,600 realistic incident/vulnerability/control records across 12 months; no backend required
- **Reusable widget library** — KPI cards with count-up + sparklines, radial risk gauges, trend charts, severity donuts, 5×5 risk heatmaps, and a full-featured incident table (search, sort, pagination, SLA bars, detail drawer)
- **Cross-filtering** — click a chart segment, heatmap cell, or legend item to filter the tables below it
- **⌘K command palette** — fuzzy-jump to any domain or apply filter presets
- **Motion design** — GSAP scroll storytelling on the landing, Framer Motion micro-interactions in the app, FLIP layout reordering, chart draw animations — all respecting `prefers-reduced-motion`
- **Dark "war-room glass" design system** — custom Tailwind theme, Space Grotesk / Inter / JetBrains Mono type system, WCAG-AA-conscious contrast

## Tech Stack

- **React 19 + TypeScript** on **Vite 7**
- **Tailwind CSS 3.4** + **shadcn/ui** (Radix primitives)
- **Recharts** for all data visualization
- **Zustand** for global filter state
- **Framer Motion**, **GSAP + ScrollTrigger**, **Lenis**, **Three.js / React Three Fiber**
- **React Router v6**, **Lucide** icons

## Project Structure

```
src/
├── components/
│   ├── app/            # AppShell (sidebar + topbar + ⌘K), DomainSwitcher
│   ├── widgets/        # Shared widget library (KpiCard, RiskGauge, TrendChart,
│   │                   #   SeverityDonut, RiskHeatmap, IncidentTable, ...)
│   ├── command-center/ # Command Center specifics (DomainGrid, LiveFeed, ...)
│   ├── domains/        # Per-domain signature widgets (iot/, soc/, grc/, ...)
│   ├── landing/        # Landing page sections (hero globe, showcase, teaser, ...)
│   └── ui/             # shadcn/ui primitives
├── lib/
│   ├── data.ts         # Seeded synthetic data engine + filter-aware selectors
│   └── domains.ts      # Domain registry (slugs, icons, colors, categories)
├── pages/
│   ├── Landing.tsx
│   └── app/            # CommandCenter + domains/ (10 dashboards)
└── stores/
    └── filterStore.ts  # Global filter state (Zustand)
```

## Getting Started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build → dist/
npm run preview  # preview the production build
```

Node.js 20+ required. All data is synthetic and generated deterministically at runtime — no API keys, database, or backend needed.

## Design Docs

The complete design system (color tokens, typography, motion specs, per-page layouts) was planned before implementation. Key ideas:

- Charts render on transparent backgrounds over a near-black blueprint grid
- A single cyan→emerald accent gradient; severity always uses a fixed 4-color scale
- Animation budget: ≤10 simultaneously animating elements per viewport; the only WebGL effect is the landing hero (with poster fallback)

## Roadmap Ideas

- [ ] Connect a real backend (tRPC + Drizzle) for live data ingestion
- [ ] User authentication and saved views
- [ ] PDF/CSV report export per domain
- [ ] Alerting rules and threshold configuration
- [ ] Unit + e2e test coverage (Vitest / Playwright)

## License

MIT — see [LICENSE](LICENSE).

---

**Disclaimer:** All data shown is synthetic and generated for demonstration purposes. AEGIS ONE is a portfolio/demo project inspired by the concept of commercial Excel dashboard bundles; it is not affiliated with any vendor.
