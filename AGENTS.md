<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# matthewrichter.dev

Next 16 App Router, React 19, Tailwind 4, Node 24, deployed on Vercel. **Push to `main`
is a production deploy.** Two apps live in this one repo:

| Area | What | Code |
|---|---|---|
| Public site | matthewrichter.dev homepage / portfolio | `app/(site)/page.tsx`; root `app/layout.tsx` is shared |
| `/personal` | Google-sign-in-gated personal tools: job-hunting tracker (Gmail sync, job scan, connections, ATS boards, todos) and family finance | `app/(personal)/personal/**`, `app/api/personal/**`, `lib/personal/{auth,db}.ts`, `scripts/gmail-job-sync.gs` |

`(site)` and `(personal)` are route groups: they keep the two apps visibly separate in the
tree without changing any URL. The realm homepage (PRD-realm) lands in `app/(site)/`,
`realm/`, and `app/api/realm/`; nothing of it goes under `(personal)`.

## Commands

- `npm run dev` — :3000
- `npm run build`
- `vercel env pull .env.local` — see `.env.example` for every variable and its purpose

## Database (shared, read this)

`lib/personal/db.ts` uses the service role against Supabase project
`xvsgqxkvnuxgxnovyzfv`, which is **the same project that backs betzgames, dou-dizhu and a
relay word game**. This repo owns **only** the job-hunt tables
(`personal_applications`, `personal_ats_boards`, `personal_connections`,
`personal_job_leads`, `personal_todos`). `personal_bets` is NOT ours despite the prefix:
it is written by betzgames' `/betstracker` grade route. Do not touch any other table
from here. The full as-found schema with owners is in the betzgames repo at
`supabase/schema/`; migrations are applied through the Supabase connector or dashboard
and recorded remotely, and the applied-version list lives in that repo's
`supabase/migrations/README.md`.

## Scheduling

Supabase **pg_cron** job `personal-job-scan` (jobid 15) POSTs `https://matthewrichter.dev/api/personal/job-scan`
daily at 11:00 UTC with header `x-internal-secret` = `private_config.personal_cron_secret`
(a row in the shared database). The route checks that header against the Vercel env
`CRON_SECRET`, so the two values must match. The Gmail sync is a Google Apps Script
(`scripts/gmail-job-sync.gs`) on a daily trigger in your own account, posting to
`api/personal/gmail-sync` with the same secret. There are no Vercel crons. Job definitions
are dumped in the betzgames repo at `supabase/cron/`. Runbook: `.claude/skills/personal-ops`.

## Product docs

PRDs live in `docs/prds/`. `PRD-realm.md` specifies the planned 3D-realm homepage for this
site; its Decision Log is settled (don't relitigate), and it needs a small read-only status
route on betzgames first (its M0). The CFB Pick'em PRD moved to the betzgames repo, next
to the code it describes.

## Runbooks

- `.claude/skills/personal-ops/SKILL.md` — job-scan cron health, Gmail sync, sign-in, where
  each `personal_*` table's rows come from, secret rotation, the never-delete list. Read it
  before touching `app/api/personal`, `lib/personal`, or any `personal_*` table.

## House rules

- Don't commit or deploy unless asked.
- `/personal` holds real personal data (job applications, contacts, bets). Never log it,
  never paste rows into issues, never widen its RLS.
