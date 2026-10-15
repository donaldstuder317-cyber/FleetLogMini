# System overview

```
Browser (Vite SPA)
 ├─ pages/            route screens (Dashboard, AssetDetail, LogService, Alerts, Export, AddAsset)
 ├─ components/       presentational pieces (no business logic)
 ├─ hooks/useFleet    reads FleetContext (data + mutations) and derived statuses
 ├─ app/FleetProvider holds FleetData in state, persists BEFORE updating state
 ├─ services/         pure logic: status, alerts, fleetService, validation, exportService, storage
 └─ localStorage      key "fleetlog-mini:v1" → { assets, schedules, entries, faults }
```

## Data model (`src/types/index.ts`)
- **Asset** — id, name, kind, model, `reading` (odometer mi or engine hours), `unit`
- **Schedule** — per asset + task: `interval` in mi / hrs / days, `lastReading`, `lastDate`
- **ServiceEntry** — logged service: asset, task, date, reading, partsCost, notes
- **Fault** — free-text report against an asset

## Key flows
- **Status** = `used / interval`: ≥90% → Due Soon, remaining < 0 → Overdue (`services/status.ts`).
- **Log service** → `addServiceEntry` appends the entry, raises the asset reading, resets the matching schedule → badges recompute immediately.
- **Alerts window** → Overdue always shown; otherwise days OR mi/hrs (500 mi ≙ 25 hrs) whichever matches (`services/alerts.ts`).
- **Export** → filter entries → `buildCsv` / `buildPdf` (jsPDF, Letter) → Blob download. The preview count uses the same filter.

Diagrams: `fleetlog-8-questions.tldr` (this folder), `../wireframes/app-wireframes.tldr`.
