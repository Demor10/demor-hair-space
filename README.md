# Demor Hair Space — Reservation Website

## What's built so far (Stage 1)
- `index.html` + `css/style.css` — the homepage, styled to your brand (navy/gold from your logo)
- `supabase/schema.sql` — full database design: services, availability, bookings, and the rules that stop double-booking
- Folder structure ready for the rest of the build

## What's still to come (Stage 2+)
- `services.html` — real gallery pulled from Supabase, click-through to booking
- `book.html` — the booking flow (date → live available slots → details → payment choice → confirm)
- `my-bookings.html` — customer self-serve cancel/reschedule (30-min cutoff enforced)
- `admin/` — password-protected panel: manage hours, services/photos/prices, verify payments, view AI suggestions
- `js/` — Supabase client, booking logic, slot-availability engine, Resend email trigger
- AI router (Edge Function) — tries Claude, falls back to Gemini, then OpenRouter
- AI chatbot widget for browsing/booking help, powered by the router
- AI scheduling-suggestion logic in the admin panel, powered by the router

## Setup you'll need to do (once, before going live)

### 1. Supabase (database + admin login)
1. Create a free project at supabase.com
2. Open the SQL Editor, paste in `supabase/schema.sql`, and run it
3. Under Authentication → Users, create one user (your login) for the admin panel
4. Under Project Settings → API, copy your **Project URL** and **anon public key** — these go into `js/config.js` (added in Stage 2)

### 2. Resend (confirmation emails)
- You've already got an account. We'll need your **API key** (Resend dashboard → API Keys) and the sender email you've verified.
- Note: Resend's API should be called from a small server-side function (not directly from the browser, to keep your API key private) — Supabase Edge Functions handle this for free.

### 3. AI providers — Claude, Gemini, OpenRouter (fallback chain)
The chatbot and scheduling suggestions call a single server-side "AI router" function that tries providers in order, so the site keeps working if one hits a rate limit:
1. **Claude API** (console.anthropic.com) — primary
2. **Gemini API** (aistudio.google.com) — fallback
3. **OpenRouter** (openrouter.ai) — last resort, gives access to many backup models

Get an API key from each. All three are stored as server-side secrets (Supabase Edge Function environment variables) — never in frontend code, since anything in browser JS is publicly visible.

### 4. GitHub Pages (hosting)
1. Create a repo, e.g. `demor-hair-space`
2. Push these files to it
3. In repo Settings → Pages, set source to the `main` branch, root folder
4. Your site goes live at `https://yourusername.github.io/demor-hair-space/`

### 5. Bank details shown at checkout
Already noted for the booking flow build:
- Bank: OPay
- Account name: Adebulu Patrick A
- Account number: 9029122629

## Business rules encoded in the schema
- Every appointment is 45 minutes, no overlaps (`unique_active_slot` constraint)
- 7:00 AM–6:00 PM = normal price; 7:00 PM–10:00 PM = +20% surcharge
- Customers can cancel/reschedule up to 30 minutes before their slot (enforced in app logic, to be added in Stage 2)
- Payment is full amount, either online (manual bank transfer + admin verification) or in person

## Recommended next step
Open this folder in **Claude Code** and say "continue building Stage 2" — it can run the site locally, wire up Supabase live, and push directly to your GitHub repo as we go.
