# Sign Up page — `/sign-up`

**As a** new fleet owner, **I want to** create an account with my name, email and a password, **so that** I can keep my own maintenance logbook.

## On this page
- FleetLog Mini wordmark, "Sign Up" heading, Name, Email, Password, Confirm password fields
- Password hint under the field: "8+ characters with an uppercase letter, a number and a symbol."
- [Sign Up] (primary, full-width on mobile, min 44px tall; disabled with "Creating account…" while waiting)
- "Already have an account? Sign in" link → `/sign-in`
- Not inside the app shell
- Already signed in → straight to `/`

## Rules
- Name is required (trimmed, not blank, up to 120 characters)
- Email must look like `name@domain.tld`
- Password: at least 8 characters, with an uppercase letter, a number and a symbol
- Confirm password must match

## States
- Blank name → "Enter your name."
- Invalid email → "Enter a valid email address."
- Password breaks a rule → "Password must be at least 8 characters and include an uppercase letter, a number and a symbol."
- Passwords differ → "Passwords don't match."
- Email already registered → "An account with this email already exists. Sign in instead." ("Sign in" links to `/sign-in`)
- Network / other error → "Couldn't create your account. Please try again."
- Success with a session → signed in and sent to Dashboard
- Success with no session (email confirmation turned on in Supabase) → form replaced by "Check your email to confirm your account, then sign in." + [Go to Sign In]
- Errors never wipe other inputs

## Behind the scenes
- Supabase Auth creates the login with the name in user metadata; the `on_auth_user_created` trigger creates the `public.users` profile
- A new account starts with an empty fleet (no assets, schedules, entries or faults)

## Done when
- [ ] A new name + email + valid password lands on Dashboard with "No equipment yet — add your first asset", and the name shown in the shell
- [ ] An asset added by the new user is not visible to any other account
- [ ] Each validation message appears for its case and keeps the inputs
- [ ] Signing up twice with the same email shows the "already exists" message
- [ ] A sign-up that returns no session shows the "Check your email" message
- [ ] Every field has a visible label and a keyboard focus ring
