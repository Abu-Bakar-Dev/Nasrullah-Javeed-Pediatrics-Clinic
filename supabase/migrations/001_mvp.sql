-- Nasrullah Clinic MVP schema. Run this in the Supabase SQL editor.
create extension if not exists pgcrypto;

create type public.app_role as enum ('super_admin', 'doctor', 'assistant');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  role public.app_role not null,
  department text not null default '',
  phone text not null default '',
  status text not null default 'active' check (status in ('active','inactive')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  mrn text unique not null default ('P-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,8))),
  name text not null, phone text unique not null, age integer not null default 0,
  dob date, gender text not null default 'Other', blood_type text not null default 'Unknown',
  address text not null default '', allergies jsonb not null default '[]',
  active_conditions jsonb not null default '[]', vitals jsonb not null default '{}',
  last_visit text not null default 'Just registered', balance text not null default 'PKR 0',
  avatar_url text, registered_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patients(id),
  patient_name text not null, patient_phone text not null, patient_age integer,
  doctor_id uuid references public.profiles(id), doctor_name text not null, department text not null default '',
  reason text not null, date date not null, time text not null,
  status text not null default 'waiting', notes text not null default '',
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(), receipt_no text unique not null,
  appointment_id uuid unique not null references public.appointments(id) on delete cascade,
  patient_id uuid not null references public.patients(id), service_name text not null,
  amount_paid numeric(12,2) not null default 0, payment_method text not null default 'Cash',
  payment_status text not null default 'Paid', printed_by uuid references public.profiles(id),
  printed_at timestamptz not null default now()
);

create table public.patient_visits (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.profiles(id), doctor_name text not null,
  appointment_id uuid references public.appointments(id), diagnosis text not null,
  notes text not null default '', visit_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references public.patients(id) on delete cascade,
  patient_name text not null, patient_mrn text not null, patient_dob text,
  doctor_id uuid not null references public.profiles(id), doctor_name text not null,
  doctor_avatar text, date text not null, diagnosis text not null,
  medications jsonb not null default '[]', status text not null default 'active', notes text not null default '',
  visit_id uuid references public.patient_visits(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create or replace function public.current_role() returns public.app_role language sql stable security definer
set search_path = public as $$ select role from public.profiles where id = auth.uid() and status = 'active' $$;

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.receipts enable row level security;
alter table public.patient_visits enable row level security;
alter table public.prescriptions enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_admin_update on public.profiles for update to authenticated using (public.current_role()='super_admin') with check (public.current_role()='super_admin');
create policy patients_read on public.patients for select to authenticated using (true);
create policy patients_assistant_insert on public.patients for insert to authenticated with check (public.current_role() in ('assistant','super_admin'));
create policy appointments_read on public.appointments for select to authenticated using (true);
create policy appointments_assistant_write on public.appointments for all to authenticated using (public.current_role() in ('assistant','super_admin')) with check (public.current_role() in ('assistant','super_admin'));
create policy receipts_read on public.receipts for select to authenticated using (true);
create policy receipts_assistant_write on public.receipts for all to authenticated using (public.current_role() in ('assistant','super_admin')) with check (public.current_role() in ('assistant','super_admin'));
create policy visits_read on public.patient_visits for select to authenticated using (true);
create policy visits_doctor_insert on public.patient_visits for insert to authenticated with check (public.current_role()='doctor' and doctor_id=auth.uid());
create policy prescriptions_read on public.prescriptions for select to authenticated using (true);
create policy prescriptions_doctor_insert on public.prescriptions for insert to authenticated with check (public.current_role()='doctor' and doctor_id=auth.uid());

-- Create the first auth user in Supabase Dashboard, then promote it once:
-- insert into public.profiles(id,name,email,role,department)
-- values ('AUTH-USER-UUID','Super Admin','admin@example.com','super_admin','Administration');
