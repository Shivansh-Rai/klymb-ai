<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/brand/klymb-logo-white.svg">
    <img src="public/brand/klymb-logo.svg" alt="Klymb.ai" width="360">
  </picture>
</p>

# Klymb.ai — 30-Day Job Readiness Program

Frontend for Klymb.ai: a 30-day job-readiness program with five career tracks (QA Engineer, L1/L2 Support, Project Manager, Junior Developer, Reporting Analyst). Each track has daily practical problems, weekly assessments after Days 7/14/21/28, role-specific projects, interview preparation and mock interviews on Days 29–30.

> Data lives in the **`course` schema of the Neon database that also runs
> [app.klymb.ai](https://app.klymb.ai)** — one user base, so a learner here is the
> same person as the platform user with that address (`course.learners.user_id`
> references `public."User"`). Schema in `db/migrations/`, applied with
> `npm run db:migrate`. Supabase remains only as the message bus for the live
> device-switch sign-out; `supabase/migrations/` is the retired schema, kept as
> history and applied nowhere.

## Setup

Requires Node.js 20.9+.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npm run lint
```

Copy `.env.example` to `.env.local` (git-ignored) and set the same values in
Vercel → Project Settings → Environment Variables. Never commit secrets.
`DATABASE_URL` is the one the app cannot work without: see [`db/README.md`](db/README.md)
for how the schema and its role are set up.

## Security

| Control | Where |
| --- | --- |
| Identity is a Google-verified email, compared with exact equality | `src/auth.ts`, `src/lib/email.ts` |
| Admin status read from `admin_users` on every request, never from env or a token | `src/lib/admin/auth.ts` |
| Every query runs server-side; the browser holds no database credential | `src/lib/db/client.ts` |
| The app connects as `klymb_course`, which may only read and write the `course` schema, and may read just `(id, email)` of the platform's users | `db/migrations/0002_grants.sql` |
| Values are always bound parameters — the query tag has no way to inline a string as SQL | `src/lib/db/client.ts` |
| Registration throttle, keyed by a salted hash of the caller's IP | `src/lib/rate-limit.ts`, `src/lib/fingerprint.ts` |
| Server-side allowlists and length caps on every submitted field | `src/lib/validation.ts` |
| CSP, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors | `next.config.ts` |
| The voice provider's API key stays on the server; the browser is handed no credential at all, not even a short-lived one | `src/lib/coach/realtime.ts`, `src/app/api/coach/session` |
| LinkedIn tokens are sealed (AES-256-GCM, bound to the learner's email) and never reach the browser; the OAuth state is signed, expiring and tied to the signed-in learner | `src/lib/linkedin/oauth.ts`, `db/migrations/0008_linkedin.sql` |

**Content Security Policy.** These hosts must stay allowlisted or something breaks:
`www.googletagmanager.com` (analytics script), `www.google-analytics.com` and `*.analytics.google.com`
(measurement), `accounts.google.com` (sign-in redirect and form post), `*.supabase.co` (live device-switch channel),
`i.ytimg.com` (day-page thumbnails), `*.googleusercontent.com` (Google profile images).
`script-src` keeps `'unsafe-inline'` because Next.js inlines its bootstrap; `'unsafe-eval'` is added in
development only, for React Refresh.

**Verify everything:** `npm run verify` (types, lint, tests, production build).

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New → Project** and import the repo. The Next.js preset is detected automatically (build command `npm run build`).
3. Set the environment variables from `.env.example` — at minimum `DATABASE_URL`,
   `AUTH_SECRET`, `AUTH_URL` and the Google OAuth pair, plus the LinkedIn pair for
   one-tap posting (see [LinkedIn posting](#linkedin-posting)) — then deploy.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage (story, tracks, how it works, journey, outcomes, pricing, FAQ, registration) |
| `/tracks` | All tracks + comparison table |
| `/tracks/[slug]` | Track detail page (same layout for all five tracks) |
| `/program` | Program structure and pricing |
| `/register?track=slug` | Registration form, optionally pre-selecting a track |
| `/system-design` | System Design offer: the price and the claim form. Claiming signs in with Google, then opens Razorpay |
| `/learn/system-design` | System Design course. Day 0 is free; everything else needs a seat |
| `/dashboard?track=slug` | Learner progress dashboard (demo data) |
| `/daily-challenge?track=slug&day=n` | Daily problem view (demo) |
| `/weekly-assessment?track=slug&week=n` | Weekly assessment view (demo) |
| `/mock-interview?track=slug` | Mock interview preparation (demo) |
| `/contact`, `/privacy`, `/terms`, `/refund-policy` | Placeholders |

## Where to edit content

| File | What it controls |
| --- | --- |
| `src/data/config.ts` | **Prices, cohort start date, enrolment deadline, cohort capacity, contact email** |
| `src/data/tracks.ts` | All five tracks: skills, 4 weeks of daily challenges, assessments, projects, outcomes, interview topics and questions |
| `src/data/program.ts` | Homepage copy, sourced statistics, how-it-works steps, week phases, outcomes, FAQs, nav and footer links |
| `src/data/demo.ts` | Sample learner progress and placeholder rubric |
| `src/types/program.ts` | TypeScript data model |

### Before launch — verify

- [ ] `launchPrice` (₹14,999) and `referenceValue` (₹50,000) in `config.ts`. The reference value must reflect a genuine value breakdown; set `showReferenceValue: false` if it cannot be justified.
- [ ] `enrollmentDeadline` and `cohortCapacity` are **placeholders** — replace them and set the `...IsPlaceholder` flags to `false`.
- [ ] Re-check every statistic and its source link in `program.ts` (`evidence`).
- [ ] Final FAQ answers for track changes and refunds.
- [ ] Privacy Policy, Terms and Refund Policy pages..

Ethical guardrails used throughout: no fake testimonials, learner counts, seat counters or countdowns, and no guaranteed-job claims.

## Voice coach

`/learn/coach` is a five-minute spoken placement check on one topic, over
OpenAI's Realtime API. Speech to speech, so there is no transcribe → think →
speak chain in the middle: that chain is where the seconds go, and a
conversation that pauses for two seconds after every sentence is not one.
Set `OPENAI_API_KEY` to switch it on; without it the page says so and the rest
of the course is unaffected.

| Piece | Where |
| --- | --- |
| Topics, openers and the skills each session covers | `src/lib/coach/topics.ts` |
| What the coach is told, its two tools, and the session handed to the provider | `src/lib/coach/prompt.ts` |
| The provider call. The API key lives here and nowhere else | `src/lib/coach/realtime.ts` |
| Opens a call: authorises, records the session, relays the WebRTC offer | `src/app/api/coach/session` |
| Writes what the coach recorded while it was talking | `src/app/api/coach/evidence` |
| The WebRTC session in the browser: connection, barge-in, captions, levels | `src/components/coach/useVoiceSession.ts` |
| The orb, driven by the real audio levels | `src/components/coach/Orb.tsx` |
| Tables for the sessions and their evidence | `db/migrations/0006_coach.sql` |

**No credential reaches the browser.** OpenAI documents two routes: mint a
short-lived client secret for the browser, or relay the SDP server-side. This
takes the second, because the session's instructions carry the learner's name,
track and what an earlier session found — binding those to a credential a
browser holds means handing over both. It is the shape `/api/video` already
uses for the course videos: the signing key stays on the server, and the
browser only ever gets what it produced.

**Grading is kept off the conversational path.** The coach calls
`record_skill_evidence` as it talks and is acknowledged immediately, with the
database write happening behind that; the next question is asked while the row
is being written. Nothing it records unlocks a day, releases a fee or decides a
placement — it is a model's judgement relayed by the learner's own browser, so
it is evidence a reviewer reads next to the deliverables and nothing more.

**Nothing is recorded.** The captions are on screen only, and no migration
adds a column for a transcript. A recording of someone practising for
interviews is a liability with no reader.

**The microphone had to be allowed.** `Permissions-Policy` shipped
`microphone=()`, which blocks `getUserMedia` outright; it is now
`microphone=(self)`. It cannot be scoped to the one path — a second
`Permissions-Policy` header is intersected with the first, not replaced — so
what stands between a script and the microphone is the browser's own prompt,
`frame-ancestors 'none'` and a `script-src` with no third parties on it.

**First reply is measured, not promised.** The browser times the gap between
the learner finishing and the first word back and stores it on the session
(`first_reply_ms`); the target is one to two seconds. It is on the screen under
the orb and on each row of the learner's history, so the claim can be checked
rather than assumed.

## LinkedIn posting

Learners share a 1080×1350 image and a caption when they finish a lesson or earn a
badge. Without setup, **Post on LinkedIn** uses the phone's share sheet, or on a
computer opens a prefilled LinkedIn post with the image on the clipboard. With a
LinkedIn developer app connected, a signed-in learner taps **Post in one tap:
connect LinkedIn** once; after that, **Post on LinkedIn** shows the image and text
(editable), and one tap on **Post** publishes both to their feed through LinkedIn's
API. If the API fails, the same step offers the share sheet / prefilled post instead.

| Piece | Where |
| --- | --- |
| OAuth URL, code exchange, Images API upload, Posts API, text escaping | `src/lib/linkedin/api.ts` |
| Signed state cookie (CSRF), token sealing, redirect URI | `src/lib/linkedin/oauth.ts` |
| The stored connection | `src/lib/linkedin/store.ts`, `db/migrations/0008_linkedin.sql` |
| Status and disconnect, connect, callback, post (10 an hour per learner) | `src/app/api/linkedin/` |
| The button behaviour and the confirm step | `src/components/share/LinkedInPost.tsx`, `src/lib/linkedin-share.ts` |

### Setting up the LinkedIn app (by hand, once)

1. **Create the app** at [linkedin.com/developers/apps](https://www.linkedin.com/developers/apps/new),
   signed in as someone who administers the Klymb.ai LinkedIn Page. Name it *Klymb.ai*,
   pick the Klymb.ai Page, set the privacy policy URL to `https://klymb.ai/privacy`
   and upload the logo (learners see both on LinkedIn's consent screen).
2. **Verify the app**: *Settings → Verify*, and have a Page admin approve the link.
3. **Add the products**: on the *Products* tab, request **Sign In with LinkedIn using
   OpenID Connect** and **Share on LinkedIn**. Both are self-serve and are granted at
   once. The *Auth* tab should then list the scopes `openid`, `profile` and
   `w_member_social`, which is all the app asks for.
4. **Add the redirect URLs** on the *Auth* tab, exactly:
   `https://klymb.ai/api/linkedin/callback` and, for local work,
   `http://localhost:3000/api/linkedin/callback`. The URL is built from `AUTH_URL`
   when it is set, so it must match that origin. Preview deployments have their own
   hosts and are not registered, so connecting doesn't work on them.
5. **Copy the credentials** from the *Auth* tab into Vercel (and `.env.local`):
   `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` (the primary client secret). Redeploy.
6. **Apply the migration**: `npm run db:migrate` adds `course.linkedin_connections`.
7. **Check it**: sign in on the System Design course, finish a lesson, tap the connect
   link, approve on LinkedIn, and post. The post appears on your own feed.

**Keep in mind**

- Tokens last **60 days**. LinkedIn gives refresh tokens to approved partners only, so
  after that the learner taps connect again (LinkedIn skips the consent screen if they're
  still signed in there). The hourly `course.maintenance()` deletes expired connections.
- `LINKEDIN_API_VERSION` (YYYYMM, default in `src/lib/linkedin/api.ts`) must be a version
  LinkedIn still serves; each lasts about a year. Bump it before the current one is sunset.
- Tokens are sealed with a key derived from `AUTH_SECRET`. Rotating that secret makes every
  stored token unreadable: learners just connect again.
- LinkedIn documents no way for an app to revoke a member's token. **Disconnect** deletes
  ours; a learner can remove Klymb.ai entirely in LinkedIn's *permitted services* settings.

## Selling System Design

`/system-design` sells the course, and anyone can read it. Tapping Claim is what
signs them in with Google, which is where the email comes from: the form waits in
`sessionStorage`, and they come back to it and go straight on to Razorpay, so the
account that pays is the one that learns. ₹499 runs to the end of 8 November 2026 (IST), then ₹1,999; both live in
`src/lib/sd-offer.ts`, and the page's countdown and the order's amount read the
same values, so when the clock reaches zero the price really changes. Someone who
claimed during the offer keeps its price.

| Piece | Where |
| --- | --- |
| The offer's rules: price, deadline, form checks | `src/lib/sd-offer.ts` |
| The page: price card, form, the trip to Google | `src/app/(course)/system-design`, `src/components/system-design-offer` |
| Creates the Razorpay order, signed-in only | `src/app/api/sd/order` |
| Records a payment and opens the course, from checkout or webhook | `src/lib/payments.ts` |
| Who may open the course, and server-graded lesson checks | `course.enrollments`, `course.lesson_checks` (`db/migrations/0020_enrollments.sql`) |
| What of the course reaches a browser | `src/lib/sd-lessons.ts` |
| Grades a lesson check | `src/app/api/sd/check` |
| The refund terms | `sdRefund` in `src/data/legal.ts`, shown on `/refund-policy` and `/terms` |

**The lock is on the server.** Lesson content lives in
`src/data/system-design/lessons.ts`, and `/learn/system-design` passes the app only
the lessons its viewer may open, with the check answers taken out. Paid videos are
served from R2 only, through `/api/video`, which checks for a seat; never put one
back in `public/`. `tests/sd-lessons.test.ts` fails if anything a browser loads
imports a lesson.

**Refunds.** "100% back on finishing" rests on `course.lesson_checks`, which only
the server writes. The final assessment is still graded in the browser and has to
move to the server before lesson 22 ships, because finishing needs it. Refunds are
paid by hand from the admin Payments tab after a reviewer has checked the record.

**Deploying.** Run `npm run db:migrate` before the code goes live. Until it has run
nobody can buy: the order route stops rather than take money it can't record a seat
for. To give someone free access:

```sql
insert into course.enrollments (email, course, source) values ('name@gmail.com', 'system-design', 'grant');
```

## Project structure

```
src/
├── app/                 Routes (see table above)
├── components/
│   ├── home/            Homepage sections + registration form
│   ├── track/           TrackCard, TrackGrid, TrackDetail, TrackCurriculum
│   ├── learn/           Dashboard/learning UI: TrackSwitcher, ProgressBar, WorkSubmission, InterviewPractice
│   ├── layout/          AnnouncementBar, Header, Footer, Wordmark
│   └── ui/              Button, Container, Eyebrow, SectionHeader, Tag, Reveal, FormField, PageHeader, SourceLink, DemoNotice
├── data/                All editable content and config
├── lib/                 Validation, formatting, 30-day helpers
└── types/               Data model
```

## TODO — next integrations

- [x] **Database** — registrations, learners, submissions, progress and payments, on the shared Neon instance
- [ ] **Razorpay** — payment step after registration (server-side order creation and signature verification; never trust client-side success)
- [x] **Authentication** — learner sign-in with Google, the verified email as the identity
- [ ] **Real learner dashboard** — replace `src/data/demo.ts` with the signed-in learner's data
- [ ] **Assessment scoring** — reviewer workflow, rubric scores and feedback
- [ ] **Email or WhatsApp notifications** — registration confirmation, daily challenge reminders, assessment feedback
- [ ] **Admin dashboard** — manage cohorts, tracks, content, learners and reviews..

## Brand assets

Logo files live in [`public/brand/`](public/brand) and are served from the site too (`https://www.klymb.ai/brand/<file>`):

| File | Use |
| --- | --- |
| `klymb-logo.svg` / `.png` | Wordmark on light backgrounds |
| `klymb-logo-white.svg` / `.png` | Wordmark on dark backgrounds |
| `klymb-logo-on-maroon.png` | Wordmark on the brand maroon, ready for social banners |
| `public/icons/icon-512.png` | Square app icon (K) |
| `profile-*.png` | Profile pictures for email and social accounts |

Wordmark: Archivo Black (900), letter-spacing −0.035em; "KLYMB" in ink `#201E1D`, ".AI" in brand red `#83050B` (`#F0868B` on dark).
