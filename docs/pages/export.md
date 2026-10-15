# Export page — `/export`

**As a** fleet owner, **I want to** download clean service history as CSV or a printable PDF, **so that** I can hand it to my accountant, an auditor or a buyer.

## On this page
- Assets (multi-select, default "All assets")
- Date range: from / to (default: Jan 1 – today)
- Format: CSV or PDF (radio)
- Live preview line: number of entries + total parts cost
- [Download] (primary, full-width)

## States
- Range has 0 entries → "No entries in this range — widen dates"; Download disabled
- From date after To date → inline error "Start date must be before end date"

## Done when
- [ ] CSV has one row per service with headers: date, asset, task, odometer, parts_cost, notes
- [ ] PDF prints cleanly on Letter/A4 with asset name and date range in the header
- [ ] Preview count matches the number of rows in the downloaded file
