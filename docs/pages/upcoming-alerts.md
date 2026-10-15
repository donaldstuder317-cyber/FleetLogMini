# Upcoming Alerts page — `/alerts`

**As a** fleet owner, **I want to** see everything coming due in the next 30 days or 500 miles, **so that** I can plan the week's shop time and order parts ahead.

## On this page
- Window filter: days (default 30) **or** miles/hours (default 500 mi / 25 hrs) — whichever comes first
- Filter by asset and by task type (dropdowns, default "All")
- Alert list: status badge, asset, task, "in 6 days" / "340 mi over", chevron. Tap → `/assets/:id`
- Overdue items always pinned to the top
- [Export this list] → `/export` with current filters carried over

## States
- Nothing in window → "Nothing due in this window 🎉" + [Clear filters]

## Done when
- [ ] The seeded data shows 1 Overdue and 2 Due Soon items
- [ ] Changing the window to 7 days hides Van 4's tire rotation
- [ ] Tapping an alert opens the correct asset
