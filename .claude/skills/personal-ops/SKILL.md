---
name: personal-ops
description: Runbook for the /personal tools on matthewrichter.dev — the daily job-scan pg_cron job, the Gmail Apps Script sync, Google sign-in, and the five personal_* tables in the shared Supabase project. Use when new job leads stop appearing, Gmail events stop landing in the tracker, sign-in to /personal fails, before touching app/api/personal or lib/personal, or before running any SQL against a personal_* table.
---

# /personal operations

Everything under `/personal` is one person's real data (job applications, recruiter
contacts, LinkedIn connections). Read the "never" list at the bottom before doing anything
that writes.

## The moving parts

| Piece | Where | Runs | Auth |
|---|---|---|---|
| Job scan | `app/api/personal/job-scan/route.ts` | Supabase **pg_cron** job `personal-job-scan` (jobid 15), `0 11 * * *` UTC, `POST https://matthewrichter.dev/api/personal/job-scan` | header `x-internal-secret` = `private_config.personal_cron_secret`; the route compares it to the Vercel env `CRON_SECRET`, so those two values must be identical |
| Gmail sync | `scripts/gmail-job-sync.gs` (runs in your Google account) → `app/api/personal/gmail-sync/route.ts` | Apps Script time trigger, daily 7–8am, last 2 days of mail | same header; the script's `SECRET` property = `CRON_SECRET` |
| Sign-in | `app/api/personal/auth/{login,callback}/route.ts`, `lib/personal/auth.ts` | on demand | Google OAuth (`GOOGLE_CLIENT_ID/SECRET`), callback accepts only `matthew.r.richter@gmail.com`, then sets cookie `personal_auth` = HMAC of `PERSONAL_PASSWORD`, 60 days |
| Pages + actions | `app/(personal)/personal/**` | on demand | every server action calls `isAuthed()` first |
| Database | `lib/personal/db.ts`, service role over PostgREST | | bypasses RLS; the `personal_*` tables have RLS on and **no policies**, so the service role is the only reader or writer |

The pg_cron job lives in the shared Supabase project `xvsgqxkvnuxgxnovyzfv` (betzgames'
project). Its verbatim definition is in the betzgames repo at
`supabase/cron/jobs-as-found-2026-09-04.sql`; the table split and ownership rules are in
`supabase/schema/90-external.sql` and `supabase/OWNERSHIP.md` there.

## Where each table's rows come from

| Table | Written by | Read by |
|---|---|---|
| `personal_ats_boards` | you, by hand (SQL editor). One row per company: `ats` ∈ greenhouse, lever, ashby, workday; `board_slug` is the board id (for workday it is `tenant\|host\|site`); `active=false` pauses a board | job-scan |
| `personal_job_leads` | job-scan inserts (`on_conflict=url`, duplicates ignored). UI `dismissLead` sets `dismissed`; `addApplicationFromLead` copies one into applications | job-hunting page (`dismissed=false`, top 100) |
| `personal_applications` | gmail-sync (creates or patches by fuzzy company match), UI actions (status, archive, add-from-lead). Unique on `lower(company), lower(role)` | job-hunting page |
| `personal_todos` | UI actions (add, follow-up, complete, snooze) | job-hunting page |
| `personal_connections` | nothing in this repo. It is a LinkedIn connections export loaded by hand; `connection_count` on boards and leads is derived from it | job-hunting page |

## Health checks

Job scan (run in the Supabase SQL editor):

```sql
select jobid, status, start_time, end_time, left(return_message, 120)
  from cron.job_run_details where jobid = 15 order by start_time desc limit 7;
select id, status_code, left(content, 200), created
  from net._http_response order by created desc limit 20;   -- short retention
select max(found_at), count(*) filter (where found_at > now() - interval '1 day')
  from personal_job_leads;
```

`succeeded` in `job_run_details` only means the HTTP request was queued. The route's real
answer is the `net._http_response` row: `200` with `{"boards_scanned":N,"matches_found":M,
"new_leads":K}`. `401` means `personal_cron_secret` and Vercel `CRON_SECRET` have drifted.
`new_leads: 0` on a weekday is normal; `boards_scanned: 0` means every board is `active=false`
or the query failed.

Gmail sync: open the Apps Script project → Executions. A failed `dailySync` is usually the
Gmail permission needing re-grant (run `dailySync` once by hand) or the `SECRET` property
being stale after a `CRON_SECRET` rotation. On the app side the tracker shows the event as
a `[date] subject` line in the application's notes.

Sign-in: `/personal?auth_error=<why>` in the URL after the redirect says what failed.
`wrong_account` is a different Google account; `not_configured` is a missing
`GOOGLE_CLIENT_*` env; `bad_state` is a stale or blocked cookie, retry once. The redirect URI
registered in Google Cloud must be exactly `https://matthewrichter.dev/api/personal/auth/callback`.

## Re-run a scan by hand

```bash
curl -s -X POST https://matthewrichter.dev/api/personal/job-scan \
  -H "x-internal-secret: $CRON_SECRET" -d '{}'
```

`CRON_SECRET` comes from `vercel env pull .env.local` in this repo. Safe to run any number of
times: leads dedupe on `url`.

## Rotating a secret

- `CRON_SECRET`: change the Vercel env, then `update private_config set value = '…' where
  key = 'personal_cron_secret'`, then the Apps Script `SECRET` property. All three or the
  next tick 401s.
- `PERSONAL_PASSWORD`: changing it invalidates every `personal_auth` cookie (the cookie is an
  HMAC of it). Sign in again.
- `GOOGLE_CLIENT_SECRET`: Vercel env only.

## Never

- Never delete from `personal_applications` or `personal_connections`. They are the only
  copies. Fix rows with `update`, and take `pg_dump --data-only -t <table>` first if the
  change touches more than a handful.
- Never log, print, or paste rows from any `personal_*` table into a PR, issue, or chat.
  Report counts and ids, not contents.
- Never add an RLS policy to a `personal_*` table. No policies means service-role only, which
  is the intended state.
- Never create, alter, or drop a table from this repo other than the five above. `personal_bets`
  is betzgames' table despite the prefix.
- Never change the cron schedule without recording the new definition in the betzgames repo
  (`supabase/cron/`), which is where the scheduler is documented.

## Output contract

Report which piece was checked (job scan, Gmail sync, sign-in), the `job_run_details` and
`net._http_response` rows for the last run (status and counts only), what you changed and
where (env, `private_config`, Apps Script property, code), and whether the next scheduled
run still needs to be confirmed.
