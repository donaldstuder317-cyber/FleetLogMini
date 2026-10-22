# Asset Detail page — `/assets/:id`

**As a** fleet owner, **I want to** see one asset's schedules, current reading and service history, **so that** I know exactly which task is due and what was done last.

**As a** fleet owner, **I want to** edit or delete any asset, service entry or fault, **so that** my records stay correct.

**As a** fleet owner, **I want to** change a schedule's interval, **so that** alerts match how I actually service this equipment.

**As a** fleet owner, **I want to** see the faults reported against an asset, **so that** I know what still needs attention.

**As a** fleet owner, **I want to** mark a fault as DEADLINE and give it a cost, **so that** I can see which equipment is out of service and what repairs cost.

## On this page
- Header: back link, asset name, type/model; while the asset has an open DEADLINE fault the name area gets a see-through red layer (`bg-danger/15`) plus icon + DEADLINE; [Edit Asset] opens an inline form (Name, Type, Model, Odometer/Engine hours; unit shown, not editable)
- Current odometer / engine hours with inline [Update]
- Schedule list: task, interval (miles, hours or days), status badge, distance/time until due; [Edit interval] per row opens an inline number field (unit shown, not editable)
- Service history: date, task, parts cost, chevron (newest first); per row [Edit] (inline form: Date, Odometer/hours, Parts cost, Notes; task shown read-only) and delete icon with confirm
- [Log Service] (pre-fills this asset) → `/log?asset=:id`; [Report Fault] form: Description, Cost ($, default 0), DEADLINE checkbox (label in capitals, red text, with icon)
- Faults section: open faults (newest first) showing date, description, cost and a DEADLINE tag when set; per row [Edit] (inline form: Date, Description, Cost, DEADLINE) and delete icon with confirm
- Corrected faults (fixed by a logged service) leave the open list and show under "Corrected faults" with the date they were fixed; [Edit] there changes Date and Description only — cost and DEADLINE are locked
- [Delete Asset] with inline confirm
- Only one edit form is open at a time; Cancel or Escape closes it and returns focus to its [Edit] button

## Rules
- Asset reading (Edit Asset and [Update]) can't be lower than the highest logged service reading for that asset (0 if none)
- A service entry's reading must be ≥ 0 and can't be higher than the asset's current reading
- "Latest entry" for a task = newest date, then highest reading, then newest created; editing or deleting an entry resets that task's schedule to its latest entry, or to the schedule's baseline (the reading and date it was created with) if none remains
- Dates (entries, faults) can't be in the future
- Interval is a whole number greater than 0
- Fault cost is a number ≥ 0 with at most 2 decimals; it can only be changed while the fault is open (enforced in the DB too)
- An asset is deadlined while it has at least one open fault marked DEADLINE; it clears only when none are left
- Deleting the service entry that corrected a fault reopens that fault (and re-deadlines the asset if it was a DEADLINE fault)

## States
- No services logged → "No services logged yet — log the first one" + [Log Service]
- No faults → "No faults reported"
- Unknown id (or another user's asset) → "Asset not found" + [Back to Dashboard]
- Edit asset: blank name → "Enter a name"; reading below the highest logged service → "Reading can't be lower than the last logged service (48,210)"
- Edit entry: date in the future → "Date can't be in the future"; bad reading → "Enter a valid number"; reading above the asset → "Reading can't be higher than the current reading (48,210)"; bad cost → "Enter a valid cost"
- Report / edit fault: blank description → "Describe the fault"; date in the future → "Date can't be in the future"; bad cost → "Enter a valid cost"
- Edit interval: not a whole number above 0 → "Enter a whole number greater than 0"
- Saving an edit fails → "Couldn't save — try again"; the form stays open with the values entered

## Done when
- [ ] With the demo fleet (e2e fixture), Truck 12 shows Oil change as OVERDUE by 340 mi
- [ ] Updating the odometer recalculates every badge immediately
- [ ] Tapping Log Service opens the form with Truck 12 already selected
- [ ] [Delete Asset] shows an inline confirm; confirming removes the asset with its history and faults and returns to the dashboard
- [ ] Deleting a service entry rolls its schedule back to the newest remaining entry for that task, or to the schedule's baseline if none remains; the asset reading is unchanged
- [ ] The Faults section lists faults for this asset; a reported fault appears there and can be edited or deleted
- [ ] Every asset, entry, fault and schedule interval has an edit control; every asset, entry and fault has a delete control
- [ ] Editing the asset saves name/type/model/reading; a reading below the highest service-entry reading shows the inline error and keeps the other fields
- [ ] Editing a service entry's date or reading recalculates that task's schedule, and badges update immediately
- [ ] Changing a schedule interval to 3,000 updates its ring, badge and countdown immediately; 0, -5 and 2.5 show the error
- [ ] Editing a fault with a future date or blank description shows the matching error and saves nothing
- [ ] Reporting a fault with DEADLINE checked marks the header; correcting or deleting the last open DEADLINE fault removes the marker
- [ ] A corrected fault's cost and DEADLINE can't be edited (not shown in the UI; a direct DB update is rejected)
- [ ] Deleting the entry that corrected a fault moves it back to the open list
