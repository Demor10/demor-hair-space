# Demor Hair Space — Reservation & Business Website

A full-featured booking platform for a mobile/in-store barbing business: real-time
reservations with no double-booking, a complete admin control center, an AI chat
assistant with automatic 3-provider fallback, and a growing set of content
features (customer stories, reviews, a product/tips blog, and more).

Live stack: **GitHub Pages/Vercel** (static hosting) + **Supabase** (database,
auth, storage, edge functions) + **Claude / Gemini / OpenRouter** (AI, with
automatic fallback) + **Resend** (transactional email — pending domain setup).

---

## Features

### Public site
- **Homepage** — video-backed hero, scheduled announcement ticker, live top-3
  services preview, gliding customer-story carousel with reactions, star-rated
  reviews section
- **Services** — full catalog with admin-controlled ordering and multi-photo
  albums per style
- **Gallery** — browse-only photo wall, organized by style category
- **Booking flow** — pick a style photo → choose Physical Store or Home Service
  (+30%, extended hours auto-restricted) → real available time slots only →
  details + terms consent → pay online (bank transfer + proof upload) or in
  person — all inside a popup so a long photo list never forces scrolling
- **My Bookings** — customers look themselves up (email + phone) to
  cancel/reschedule (30-min cutoff enforced server-side), leave a review after
  a completed visit, and see the reason if an appointment was cancelled by the
  business
- **Blog & Tips** — admin-authored posts (text, image, video, or combined) for
  product reviews and haircut explainers
- **About, Privacy, Terms** — NDPA-aligned privacy policy, clear cancellation
  and payment terms
- **AI chat assistant** — floating widget, grounded in real business info
- **Mobile** — app-like bottom nav bar, swipeable service cards, dedicated
  mobile hero layout, simplified header

### Admin panel (`/admin`)
- **Bookings** — verify payments, confirm, mark complete, cancel (with a
  customer-visible reason)
- **Services & Prices** — add/edit services, manage photo albums (reorder,
  delete, set cover), drag order up/down to control the homepage's top-3
- **Hours & Availability** — weekly schedule + one-off date overrides
- **AI Insights** — on-demand scheduling suggestions from real booking data
- **Customer Stories** / **Reviews** — moderation queues (approve/reject)
- **Announcements** — schedulable banner messages with optional image
- **Homepage Video** — manage the hero background video playlist
- **Blog & Tips** — write/edit/publish posts

### Security & compliance
- Row-Level Security on every table; public access goes through narrow views
  or `security definer` functions — never open table reads
- Customer self-service (lookup/cancel/reschedule/review) is authenticated by
  matching email + phone via secure Postgres functions, not open queries
- NDPA-aligned privacy policy; booking requires explicit Terms + Privacy
  consent, timestamped and stored

---

## Tech stack

| Layer | Choice |
|---|---|
| Hosting | GitHub Pages or Vercel (static; no build step) |
| Database / Auth / Storage | Supabase |
| Server-side logic | Supabase Edge Functions (Deno) |
| AI | Claude → Gemini → OpenRouter, automatic fallback chain |
| Email (pending) | Resend — needs a verified domain to email real customers |
| Frontend | Plain HTML/CSS/JS, no framework or build step |

---

## Project structure

```
├── index.html, services.html, book.html, my-bookings.html,
│   gallery.html, about.html, blog.html, privacy.html, terms.html
├── css/            → one stylesheet per feature area, style.css holds shared tokens
├── js/             → one script per feature area
├── assets/images/  → logo
├── admin/          → password-protected admin panel (its own html/js/admin.css)
└── supabase/
    ├── schema.sql              → base schema, run first
    ├── migration-*.sql         → run in order, see below
    └── functions/ai-router/    → the AI fallback Edge Function
```

---

## Setup

### 1. Supabase
1. Create a free project at supabase.com
2. In the SQL Editor, run `schema.sql`, then every `migration-*.sql` file **in
   this order** (each one builds on the last):

   | # | File | Adds |
   |---|---|---|
   | 1 | `migration-service-images.sql` | Multi-photo albums per service |
   | 2 | `migration-selected-image.sql` | Customer's chosen style photo on a booking |
   | 3 | `migration-secure-bookings-and-selfservice.sql` | Locks down public table access; adds secure lookup/cancel/reschedule functions |
   | 4 | `migration-service-display-order.sql` | Manual reordering of services (controls homepage top-3) |
   | 5 | `migration-customer-stories.sql` | Customer stories + moderation |
   | 6 | `migration-story-reactions.sql` | Like/Laugh reactions on stories |
   | 7 | `migration-toggleable-reactions.sql` | Makes reactions toggleable (un-react) |
   | 8 | `migration-announcements.sql` | Admin announcement banner |
   | 9 | `migration-scheduled-announcements-and-location.sql` | Scheduled announcements; Home Service booking location + pricing |
   | 10 | `migration-hero-videos.sql` | Homepage background video playlist |
   | 11 | `migration-terms-consent.sql` | Booking consent capture |
   | 12 | `migration-reviews.sql` | Post-completion customer reviews |
   | 13 | `migration-cancellation-reason.sql` | Admin cancellation reason, shown to customer |
   | 14 | `migration-blog-posts.sql` | Blog & Tips posts |

3. Under **Authentication → Users**, create your admin login (confirm the
   email manually if the confirmation link ever points somewhere unreachable)
4. Under **Storage**, create these buckets (all Public), then run the storage
   policy statements included near the top of the relevant migration files:
   - `service-photos` — service albums, announcement images, blog images
   - `payment-proofs` — customer bank transfer screenshots
   - `hero-videos` — homepage video playlist **and** blog videos
5. Under **Project Settings → API**, copy the **Project URL** and **anon
   public key** into `js/config.js`

### 2. AI Edge Function
1. In **Edge Functions**, create a function named exactly `ai-router` and
   paste in `supabase/functions/ai-router/index.ts`
2. Turn **off** "Enforce JWT verification" for this function (it's a public
   chatbot/insights endpoint, not a database-touching one)
3. Add secrets: `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`
   — the router tries them in that order and falls back automatically

### 3. Email (Resend) — pending
Resend can't send to real customers without a verified domain (Gmail/GitHub
subdomains don't qualify). Once a custom domain is bought and pointed at both
GitHub Pages/Vercel and Resend, wire up booking-confirmation emails as the
next step.

### 4. Hosting
- **GitHub Pages**: push to a repo, enable Pages in Settings (root of `main`)
- **Vercel**: import the same GitHub repo, framework preset "Other", no build
  command — deploys automatically on every push

### 5. Payment details shown at checkout
- Bank: OPay · Account name: Adebulu Patrick A · Account number: 9029122629

---

## Business rules encoded in the system
- 45-minute appointment slots; a database constraint makes double-booking
  physically impossible
- Standard hours 7:00 AM–6:00 PM; extended hours 7:00–10:00 PM add 20%
- Home Service adds 30% and is unavailable during extended hours
- Self-service cancel/reschedule up to 30 minutes before the appointment
- Full payment required — online (bank transfer, manually verified) or in
  person
- A review can only be left once, only by the customer on their own
  **completed** booking

## Known gaps / next steps
- Booking confirmation emails (built, waiting on a verified domain for Resend)
- Payment gateway (currently manual bank-transfer verification by design)
