# Dashboard page — `/`

**As a** fleet owner, **I want to** see every asset's maintenance status at a glance, **so that** I know what needs attention today without digging through records.

## On this page
- Summary strip: counts of Overdue / Due Soon / Good
- Filter by status (dropdown, default "All"); Sort (Most urgent / Name)
- Asset list: status badge, asset name, most urgent task, how far over/until due, chevron. Tap → `/assets/:id`
- [+ Log Service] (primary) → `/log`; [+ Add Asset] (secondary)

## States
- No assets at all → "No equipment yet — add your first asset" + [Add Asset]
- Filter matches nothing → "No assets match this filter" + [Clear filter]

## Done when
- [ ] The 3 seeded assets show, Overdue first
- [ ] Filtering by "Overdue" shows only Truck 12
- [ ] After logging an oil change for Truck 12, its badge changes to Good
