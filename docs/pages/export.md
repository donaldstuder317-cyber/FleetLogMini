# Export page — `/export`

**As a** fleet owner, **I want to** download clean service history as CSV or a printable PDF, **so that** I can hand it to my accountant, an auditor or a buyer.

## On this page
- Assets (multi-select, default "All assets")
- Date range: from / to (default: Jan 1 – today)
- Format: CSV or PDF (radio)
- Live preview line: number of entries + faults corrected + total cost (parts + corrected fault costs)
- [Download] (primary, full-width)
- No other controls: the page only picks assets, dates and format (the reload footer is gone — every save already refreshes the data)

## The file
- Grouped by asset. For each asset: its service entries in the date range; under each entry, the faults it corrected (description + cost); then the asset's open DEADLINE faults (current status, shown whatever the date range or task filter — but only for selected assets); then a **Total** row = parts cost + corrected fault costs
- Grand total at the end
- PDF: DEADLINE fault rows in red text (a darker print-safe red so it's readable on paper) with the word DEADLINE
- Open DEADLINE fault costs are listed but not counted in totals (not spent yet)
- CSV: no styling — headers `row_type, date, asset, task, odometer, parts_cost, fault, deadline, fault_cost, total, notes`; `row_type` is `service`, `fault_corrected`, `open_fault`, `total` (one per asset) or `grand_total` (last line); `deadline` is `DEADLINE` or blank; `total` is filled on total rows only

## States
- Range has 0 entries → "No entries in this range — widen dates"; Download disabled
- From date after To date → inline error "Start date must be before end date"

## Done when
- [ ] CSV has the headers above, one `service` row per entry, one row per corrected / open DEADLINE fault, and one `total` row per asset
- [ ] PDF prints cleanly on Letter/A4 with asset name and date range in the header
- [ ] Preview entry count matches the `service` rows in the file; preview total matches the grand total
- [ ] Each asset's Total = its parts cost + its corrected fault costs
- [ ] DEADLINE fault rows print in red in the PDF
- [ ] The "Reload data from server" footer is gone
