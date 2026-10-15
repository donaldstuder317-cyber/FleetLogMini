# Log Service page — `/log`

**As a** fleet owner, **I want to** record a completed service in under 30 seconds, **so that** the schedule resets and my history stays accurate.

## On this page
- Form: Asset (dropdown), Task type (Oil, Brakes, Tire rotation, Inspection, Other), Date (default today), Odometer / hours, Parts cost, Notes
- [Save Entry] (primary, full-width) → back to Dashboard with "Saved" toast
- [Cancel] → previous page

## States
- Odometer lower than the last reading → inline red error "Odometer can't be lower than last reading (48,210)"; other inputs keep their values
- No task type → field highlighted "Pick a task type"; Save stays disabled
- Saving fails (network) → "Couldn't save — try again"; nothing is lost

## Done when
- [ ] Saving an oil change for Truck 12 adds it to the top of its history
- [ ] Entering 40,000 mi for Truck 12 shows the inline error and keeps the other fields
- [ ] Every input has a visible label and works by keyboard alone
