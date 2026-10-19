# Nasrullah Javed Clinic — MVP

A database-backed clinic MVP with three roles:

- `super_admin`: creates, edits, deactivates, and deletes Doctor/Assistant accounts.
- `doctor`: views patients and records consultation history and prescriptions.
- `assistant`: registers patients, books appointments, saves receipts, and prints receipt slips.

All MVP records are stored in Supabase. Browser local storage is used only by the Supabase SDK for its authenticated session.

## Supabase setup

1. Create a free Supabase project.
2. Run the complete [MVP migration](supabase/migrations/001_mvp.sql) in the Supabase SQL Editor.
3. Create the first Super Admin in **Authentication > Users**.
4. Copy its UUID and run the final commented `profiles` insert from the migration with your real values.

Passwords belong only to Supabase Auth and must never be stored in `profiles`.

## Local development

Copy `.env.example` to `.env.local`, fill in all four values, then run:

```bash
npm install
npm run dev
```

`npm run dev` also provides a server-only local version of the account-management endpoint, so Super Admin can create Doctor and Assistant accounts without logging in to the Vercel CLI. Production uses the equivalent Vercel Function in `api/admin-users.ts`.

## Free Vercel deployment

1. Push the project to a personal GitHub repository and import it into Vercel.
2. Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` in Vercel Environment Variables.
3. Deploy using the Vite preset. Vercel supplies a free `your-project.vercel.app` HTTPS address.

Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or commit `.env.local`.

The first MVP intentionally excludes labs, messaging, advanced billing, inventory, and analytics.

## Clinic workflow verification

Run `node scripts/verify-clinic-flows.mjs` with the local Supabase environment configured.
This integration check creates temporary Doctor/Assistant accounts and a test patient, checks
registration, booking validation, appointment status, prescriptions, history reload, receipt
reprints, and empty-screen rendering, then removes its test data. Existing users are preserved.
It starts a temporary Vite server and tests the local API over HTTP. It does not verify browser
layout, keyboard interaction, or the operating system print dialog.

Prescription saving and appointment status changes use server-only endpoints in `api/`.
Restart `npm run dev` after updating these endpoints or the Vite configuration.
