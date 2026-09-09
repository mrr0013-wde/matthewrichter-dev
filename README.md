# matthewrichter.dev

Next 16 App Router, React 19, Tailwind 4, Node 24, deployed on Vercel. **Push to `main` is
a production deploy.**

Two apps in one repo, kept apart by route groups (URLs unchanged):

| Route group | What | Code |
|---|---|---|
| `app/(site)/` | The public homepage / portfolio. The 3D realm from `docs/prds/PRD-realm.md` lands here later. | `app/(site)/page.tsx` |
| `app/(personal)/` | `/personal`: Google-sign-in-gated job-hunting tracker and family-finance stub | `app/(personal)/personal/**`, `app/api/personal/**`, `lib/personal/` |

## Run it

```bash
npm install
vercel env pull .env.local        # see .env.example for what each variable is
npm run dev                       # http://localhost:3000
npx tsc --noEmit                  # there are no tests yet; typecheck before pushing
```

## Data and scheduling

`lib/personal/db.ts` talks to Supabase project `xvsgqxkvnuxgxnovyzfv`, which is **shared
with betzgames and two other apps**. This repo owns only the five job-hunt `personal_*`
tables. The daily job scan is a pg_cron job in that project; the Gmail sync is an Apps
Script in the owner's Google account. Details, health checks and the never-delete list:
`.claude/skills/personal-ops/SKILL.md`. Table ownership and the cron dump live in the
betzgames repo under `supabase/`.

## Docs

- `AGENTS.md` (included by `CLAUDE.md`) — the map for AI-assisted sessions
- `docs/prds/PRD-realm.md` — the living-realm homepage spec
- `../betzgames/docs/REFACTOR-PLAN.md` — the cross-repo cleanup plan this layout comes from
