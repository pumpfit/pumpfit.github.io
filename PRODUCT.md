# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Personal trainer (primary, decides conflicts):** works alone, own gym or studio, about 30 students. Today everything runs through WhatsApp: workouts, schedule, payments, messages. Uses the app mostly to manage the day: who trains today, who disappeared, who has not paid, which workout needs changing. Desktop and phone.
- **Student (secondary):** opens the app on the phone, often mid-workout, to follow the workout, log load and reps, see progress, reschedule and pay.

## Product Purpose

Pump organizes the personal trainer's business (students, workouts, schedule, payments, progress) in one place so nothing gets lost in a WhatsApp thread. Success: the trainer opens the Today screen and knows in seconds who trains, who is missing, and who owes; students keep training because they can see their progress.

## Positioning

Does not fight WhatsApp, uses it: the app organizes, WhatsApp only notifies (class reminder, new workout, payment) with a link. Students join by link on the phone, nothing to download from a store.

## Operating Context

- Trainer: morning check of the day, between classes on the phone, end-of-day admin on desktop.
- Student: at the gym, phone in one hand, sweaty, short rest timers, sometimes no connection (works offline after first visit).
- Brazilian Portuguese; payment by Pix; currency BRL.

## Capabilities and Constraints

- Trainer: Today (attendance, alerts, billing), Students (search, filters, profile), Workouts editor (sets, reps, load, order, exercise library, save and send), Schedule (week, attendance, cancel, book free slots), Finance (filters, charge by Pix, mark paid), Leads (possible clients), Student access (invite link valid 7 days, single use).
- Student: Home, guided Workout (A/B/C sheets, tips and video, adjustable load and reps, automatic rest, end summary with rating), Progress (weight, waist, body fat; 3 or 6 months), Schedule, Payment (Pix), Chat with quick replies.
- Other: landing page, sign in (I'm a trainer / I'm a student), trainer sign-up, invite acceptance, brand manual (`brand/`).
- Stack is fixed: plain HTML, CSS and JavaScript ES modules, no libraries, no build step; Python server (`server.py`, SQLite). Installable PWA, offline after first visit. Hosted on GitHub Pages (showcase, data only on device) and PythonAnywhere (real accounts).
- Dark and light themes both required.
- Health data (weight, measures, photos, pain) is sensitive under LGPD.

## Brand Commitments

- Product name **Pump** is fixed.
- The user approved replacing the whole visual identity, including the logo, the black and lime palette, and the tagline treatment. The previous identity (heartbeat symbol, slanted heavy PUMP wordmark, lime #D4FF3A on black, Inter + Space Grotesk) is evidence only, not a constraint.
- Voice: Portuguese, direct and friendly, no jargon.

## Evidence on Hand

- No real customers, testimonials, metrics or pricing yet. Never invent them. Demo data uses example names marked as examples.
- Previous brand files in `brand/` (to be replaced).

## Product Principles

1. The trainer's day comes first: scanning who, when and what is owed beats decoration.
2. WhatsApp notifies, Pump organizes.
3. Zero friction for students: a link, no store, works offline.
4. One shared truth: what the student logs appears for the trainer at once.
5. Handle health data with care and restraint.

## Accessibility & Inclusion

- WCAG AA contrast in both themes; touch targets at least 44 px; respect reduced motion; readable numbers at arm's length during a workout.
