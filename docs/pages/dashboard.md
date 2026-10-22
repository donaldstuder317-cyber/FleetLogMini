# Dashboard page — `/`

**As a** fleet owner, **I want to** see every asset's maintenance status at a glance, **so that** I know what needs attention today without digging through records.

## On this page
- Summary strip: counts of Overdue / Due Soon / Good
- Wordmark "FleetLog Mini" (top-left on mobile, sidebar on desktop) is a plain link, not a button → `/` from any page
- Filter by status (dropdown, default "All"); Deadline filter (All / Yes / No, default "All"; combines with Status); Sort (Most urgent / Name)
- Asset list: status badge, asset name, most urgent task, how far over/until due, chevron. Tap → `/assets/:id`
- Deadlined asset (has at least one open DEADLINE fault): the DEADLINE badge (icon + word + red) replaces its Overdue / Due Soon / Good badge, and the name area gets a see-through red layer (`bg-danger/15`)
- Most urgent sort: deadlined assets first, then the existing status order
- [+ Log Service] (primary) → `/log`; [+ Add Asset] (secondary)

## States
- No assets at all (a new account always starts here) → "No equipment yet — add your first asset" + [Add Asset]
- Filters match nothing → "No assets match this filter" + [Clear filter] (resets Status and Deadline)

## Done when
- [ ] A new account sees "No equipment yet — add your first asset" + [Add Asset] and a summary strip of 0 / 0 / 0
- [ ] With the demo fleet (e2e fixture), the 3 assets show, Overdue first
- [ ] With the demo fleet (e2e fixture), filtering by "Overdue" shows only Truck 12
- [ ] After logging an oil change for Truck 12, its badge changes to Good
- [ ] Clicking the wordmark from any signed-in page returns to `/`; it has a visible focus ring and works by keyboard
- [ ] Deadline = Yes shows only deadlined assets; No shows only the rest
- [ ] A deadlined asset shows the red layer + DEADLINE marker and sorts first under Most urgent
