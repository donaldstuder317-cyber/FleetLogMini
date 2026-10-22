# Upcoming Alerts page — `/alerts`

**As a** fleet owner, **I want to** see everything coming due in the next 30 days or 500 miles, **so that** I can plan the week's shop time and order parts ahead.

## On this page
- Window filter: days (default 30) **or** miles/hours (default 500 mi / 25 hrs) — whichever comes first
- Filter by asset, by task type and by Deadline (All / Yes / No) (dropdowns, default "All")
- Alerts for deadlined assets show the DEADLINE badge (icon + word + red) instead of their status badge, plus the see-through red layer behind the name
- Alert list: status badge, asset, task, "in 6 days" / "340 mi over", chevron. Tap → `/assets/:id`
- Deadlined assets' alerts first, then Overdue pinned above the rest
- [Export this list] → `/export` with current filters carried over

## States
- Nothing in window → "Nothing due in this window 🎉" + [Clear filters]

## Done when
- [ ] With the demo fleet (e2e fixture), the list shows 1 Overdue and 2 Due Soon items
- [ ] Changing the window to 7 days hides Van 4's tire rotation
- [ ] Tapping an alert opens the correct asset
- [ ] Deadline = Yes shows only alerts for deadlined assets (empty state if none); No shows only the rest
