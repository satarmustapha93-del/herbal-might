# Herbal Might backend

This project uses **Supabase as its backend** (Postgres database, authentication, row-level security, storage, and Edge Functions). It does not use a separate FastAPI server.

The deployable Supabase source stays in the repository's `supabase/` folder so the Supabase CLI can find it:

- `../supabase/schema.sql` — tables, signup trigger, RLS and storage policies, and the transactional order function.
- `../supabase/seed.sql` — sample herb catalog.
- `../supabase/functions/send-order-confirmation/index.ts` — Mailgun order confirmation Edge Function.

Follow the setup and deployment steps in the root `README.md`. In particular, run the schema in the Supabase SQL Editor and deploy the Edge Function from the project root with `npx supabase functions deploy send-order-confirmation`.
