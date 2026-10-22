# Sign In page — `/sign-in`

**As a** fleet owner, **I want to** sign in with my email and password, **so that** I see my own fleet and nobody else's.

## On this page
- FleetLog Mini wordmark, "Sign In" heading, Email field, Password field
- [Sign In] (primary, full-width on mobile, min 44px tall; disabled with "Signing in…" while waiting)
- "No account? Sign up" link → `/sign-up`
- Not inside the app shell: no tab bar or sidebar
- Already signed in → straight to `/`

## Rules (checked before anything is sent)
- Email must look like `name@domain.tld`
- Password must not be empty

## States
- Invalid email → "Enter a valid email address."
- Empty password → "Enter your password."
- Wrong password or unknown email → "Wrong email or password." Password is cleared, email stays filled
- Network / other error → "Couldn't sign in. Please try again."
- Field errors show inline below each field (`aria-invalid="true"`). Server errors show above [Sign In] (`role="alert"`) and never wipe other inputs

## Session
- Supabase Auth keeps the session in the browser. Refreshing or opening a new tab restores the same user and their fleet
- Any app page visited while signed out → here; after signing in, back to the page originally requested (otherwise `/`)
- [Sign out] (app shell) ends the session, clears the fleet from memory and returns here; other open tabs follow

## Done when
- [ ] A registered user with the right password lands on Dashboard with their name (or email) shown in the shell
- [ ] Visiting `/assets/:id` while signed out goes here, and signing in returns to that asset
- [ ] A wrong password shows "Wrong email or password.", clears the password and keeps the email
- [ ] A badly formatted email or empty password shows the matching message without contacting the server
- [ ] Refreshing while signed in keeps the user and their fleet
- [ ] Sign out returns here, and going Back does not show fleet data
- [ ] Every field has a visible label and a keyboard focus ring
