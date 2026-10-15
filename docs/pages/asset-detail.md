# Asset Detail page — `/assets/:id`

**As a** fleet owner, **I want to** see one asset's schedules, current reading and service history, **so that** I know exactly which task is due and what was done last.

## On this page
- Header: back link, asset name, type/model
- Current odometer / engine hours with inline [Update]
- Schedule list: task, interval (miles, hours or days), status badge, distance/time until due
- Service history: date, task, parts cost, chevron (newest first)
- [Log Service] (pre-fills this asset) → `/log?asset=:id`; [Report Fault]

## States
- No services logged → "No services logged yet — log the first one" + [Log Service]
- Unknown id → "Asset not found" + [Back to Dashboard]

## Done when
- [ ] Truck 12 shows Oil change as OVERDUE by 340 mi
- [ ] Updating the odometer recalculates every badge immediately
- [ ] Tapping Log Service opens the form with Truck 12 already selected
