# Log Service page — `/log`

**As a** fleet owner, **I want to** record a completed service in under 30 seconds, **so that** the schedule resets and my history stays accurate.

## On this page
- Form: Asset (dropdown), Task type (Oil, Brakes, Tire rotation, Inspection, Other), Date (default today), Odometer / hours, Parts cost, Notes
- "Faults corrected" (after Notes): checkbox group — None (default), All, then one box per open fault of the selected asset (description, cost; DEADLINE faults show icon + red DEADLINE). Picking All checks every fault; picking None clears them; picking a single fault unchecks None
- On save, the checked faults are marked corrected by this entry in the same transaction; their cost is then locked and counts toward the export
- [Save Entry] (primary, full-width) → back to Dashboard with "Saved" toast
- [Cancel] → previous page

## States
- Odometer lower than the last reading → inline red error "Odometer can't be lower than last reading (48,210)"; other inputs keep their values
- No task type → field highlighted "Pick a task type"; Save stays disabled
- Saving fails (network) → "Couldn't save — try again"; nothing is lost
- No assets yet → "Add an asset first" + [Add Asset] instead of the form
- Changing the asset resets Faults corrected to None
- Selected asset has no open faults → "No open faults" instead of the checkboxes

## Done when
- [ ] Saving an oil change for Truck 12 adds it to the top of its history
- [ ] Entering 40,000 mi for Truck 12 shows the inline error and keeps the other fields
- [ ] Every input has a visible label and works by keyboard alone
- [ ] Saving with 2 faults checked marks both corrected; they leave the asset's open fault list
- [ ] Saving with None leaves every fault open
- [ ] Correcting the asset's last open DEADLINE fault removes its DEADLINE marker on the Dashboard
