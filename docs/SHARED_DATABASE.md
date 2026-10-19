# Shared database setup

The app runs without a database (CMS falls back to `data/cms/store.json` / repo fixtures,
and `/admin` uses the single shared `ADMIN_PASSWORD`). Setting `DATABASE_URL` switches on
real per-user admin accounts with roles (`admin` / `editor` / `centre_staff`), the leads
CRM and the audit log. This is how two developers work against the same data.

## One-time setup (whoever owns the Vercel project)

1. Vercel dashboard -> project `jetking-panel` -> **Storage** -> **Create Database** -> Postgres
   (Neon or Vercel Postgres). Connect it to the project for **Preview** and **Production**.
2. Copy the connection string (`postgres://...`). Treat it like a password.
3. Add to your local `.env.local` (never committed — it is gitignored):
   ```
   DATABASE_URL=postgres://user:password@host/dbname
   DATABASE_SSL=true
   ADMIN_SESSION_SECRET=<openssl rand -hex 32>
   ```
4. Create the tables, then the first admin (run once, by one person):
   ```
   npm run db:migrate
   npm run create:admin -- --name "Your Name" --email you@example.com --password "..."
   ```
5. Restart `npm run dev`, open `/admin/login`, sign in with the email + password
   (not `ADMIN_PASSWORD`). Add teammates from **Team & Access**.

## Onboarding the second developer

1. Send them the `DATABASE_URL` through a password manager or another secure channel.
   Never paste it in chat, a commit, an issue or a PR.
2. They copy `.env.example` -> `.env.local`, add `DATABASE_URL`, `DATABASE_SSL=true`
   and their own `ADMIN_SESSION_SECRET`.
3. They do **not** run `create:admin`. You invite them from **Team & Access**, then they
   sign in and change their password.
4. Migrations are already applied. After pulling new commits, run `npm run db:migrate`
   again in case a migration landed.

## Isolation (recommended)

Two developers on one database share every row, so a test lead or a deleted CMS entry is
visible to both. If you use Neon, give each developer their own **branch** of the database
(copy-on-write, free) and keep the main branch for preview/production. Each developer then
has their own `DATABASE_URL`.

## Rules

- `.env.local` and connection strings are never committed. Rotate the DB password
  (Neon/Vercel dashboard) if one is ever exposed.
- Schema changes: edit `src/lib/db/schema.ts`, run `npm run db:generate`, commit the new
  file in `drizzle/migrations/`, and tell the other developer to run `npm run db:migrate`.
- Production and preview get `DATABASE_URL` from Vercel's project env vars, not from files.
