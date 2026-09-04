-- ============================================================
-- Demor Hair Space — Database Schema (Supabase / PostgreSQL)
-- ============================================================
-- Run this in the Supabase SQL Editor for your project.

-- ---------- SERVICES (haircut styles) ----------
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- AVAILABILITY ----------
-- The barber sets which days/hours they're open.
-- One row per date, with an open/close time. If a date has no row,
-- the site falls back to the recurring weekly_hours table.
create table weekly_hours (
  day_of_week int not null unique check (day_of_week between 0 and 6), -- 0=Sunday
  is_open boolean not null default true,
  open_time time not null default '07:00',
  close_extended_time time not null default '22:00', -- covers normal + extended
  normal_close_time time not null default '18:00'    -- where the 20% surcharge begins
);

create table date_overrides (
  date date primary key,
  is_open boolean not null default true, -- set false for a day off
  open_time time,
  normal_close_time time,
  close_extended_time time,
  note text
);

-- ---------- BOOKINGS ----------
create type booking_status as enum (
  'pending_payment',   -- customer chose online pay, awaiting admin verification
  'confirmed',         -- verified / pay-in-person accepted
  'completed',
  'cancelled'
);

create type payment_method as enum ('online_transfer', 'in_person');

create table bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id) not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null, -- always start_time + 45 min
  is_extended_hours boolean not null default false, -- true if in 7-10pm window
  price_charged numeric(10,2) not null, -- includes +20% if extended
  payment_method payment_method not null,
  payment_proof_url text, -- screenshot upload, only for online_transfer
  status booking_status not null default 'pending_payment',
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  -- prevent overlapping bookings on the same date
  constraint valid_time_range check (end_time > start_time)
);

-- Only one active (not cancelled) booking can occupy a given date+start_time
create unique index unique_active_slot
  on bookings (appointment_date, start_time)
  where status <> 'cancelled';

-- ---------- ADMIN ----------
-- Admin auth is handled by Supabase Auth directly (email/password).
-- No custom table needed — just create one user in the Supabase Auth
-- dashboard for the barber, and restrict the admin panel to that user.

-- ---------- ROW LEVEL SECURITY ----------
alter table services enable row level security;
alter table weekly_hours enable row level security;
alter table date_overrides enable row level security;
alter table bookings enable row level security;

-- Public can READ active services and hours
create policy "Public can view active services"
  on services for select using (is_active = true);

create policy "Public can view hours"
  on weekly_hours for select using (true);

create policy "Public can view date overrides"
  on date_overrides for select using (true);

-- Public can INSERT bookings (make a reservation) and SELECT their own
-- (matched by email — enforced in app logic, since there's no customer login)
create policy "Public can create bookings"
  on bookings for insert with check (true);

create policy "Public can view bookings for slot availability"
  on bookings for select using (true);

-- Public can update ONLY their own booking to cancel/reschedule
-- (app should verify email/phone match before allowing this via a
-- Supabase Edge Function rather than raw table access, for safety)

-- Admin (authenticated) has full access
create policy "Admin full access services"
  on services for all using (auth.role() = 'authenticated');

create policy "Admin full access hours"
  on weekly_hours for all using (auth.role() = 'authenticated');

create policy "Admin full access overrides"
  on date_overrides for all using (auth.role() = 'authenticated');

create policy "Admin full access bookings"
  on bookings for all using (auth.role() = 'authenticated');

-- ---------- SEED DATA: default weekly hours ----------
insert into weekly_hours (day_of_week, is_open, open_time, normal_close_time, close_extended_time) values
  (0, true, '07:00', '18:00', '22:00'), -- Sunday
  (1, true, '07:00', '18:00', '22:00'), -- Monday
  (2, true, '07:00', '18:00', '22:00'), -- Tuesday
  (3, true, '07:00', '18:00', '22:00'), -- Wednesday
  (4, true, '07:00', '18:00', '22:00'), -- Thursday
  (5, true, '07:00', '18:00', '22:00'), -- Friday
  (6, true, '07:00', '18:00', '22:00'); -- Saturday
-- Edit is_open to false for any day you're normally closed, via the admin panel.
