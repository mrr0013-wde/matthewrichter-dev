# BetzGames — College Football Pick'em PRD

**Version:** 1.0
**Date:** 2026-08-13
**Author:** Matt Richter (drafted with Claude)
**Audience:** Engineers building the CFB Pick'em game into the BetzGames platform (`mrr0013-wde/betzgames`)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Decision Log](#3-decision-log)
4. [User Roles](#4-user-roles)
5. [Feature Specs](#5-feature-specs)
   - 5.1 Accounts & Google Sign-In
   - 5.2 Leagues & Membership
   - 5.3 The Tuesday Lines Agent
   - 5.4 Slate Builder (Admin)
   - 5.5 Making Picks
   - 5.6 Scoring Engine
   - 5.7 Results Agent (Auto-Grading)
   - 5.8 Standings, History & Charts
   - 5.9 Money Tracking
   - 5.10 Notifications
   - 5.11 Admin Dashboard
6. [Architecture](#6-architecture)
7. [Data Model](#7-data-model)
8. [API Routes & Crons](#8-api-routes--crons)
9. [Scoring Rules (Precise Spec)](#9-scoring-rules-precise-spec)
10. [Open Questions](#10-open-questions)
11. [Phasing](#11-phasing)
12. [Environment Variables](#12-environment-variables)

---

## 1. Overview

CFB Pick'em is a weekly college football pool built into the BetzGames platform
(alongside BetzGolf and the 2026 World Cup game). Every Tuesday morning during
the regular season, an automated agent pulls the week's Top 25 games and their
point spreads from a single consistent source, snaps every spread to a
**half-point value** (no pushes, ever), and freezes them for the week. The
commissioner curates a slate from that board, publishes it, and league members
pick games against those frozen lines. Games lock individually at kickoff,
scores are graded automatically off final results, and season-long standings
accumulate toward weekly and end-of-season payouts.

This digitizes the league Matt has run in Google Sheets since 2019
("College Pick em '19", "CFB Pick em '20/'21", the 2022/2023 Google Forms
format) — same spirit, no more manual spreadsheet grading.

### Weekly Lifecycle

```
Tue 8:00am CT: Agent pulls Top 25 games + spreads → freezes half-point lines
    → Commissioner curates slate (suggested default provided) → Publish
    → Members pick (each game open until its own kickoff)
    → Games lock at kickoff; picks become visible to the league
    → Sat night + Sun morning: Results agent grades picks from final scores
    → Standings update; weekly winner recorded
```

---

## 2. Goals & Non-Goals

### Goals

- **Zero-maintenance weekly setup**: the Tuesday agent does the data work; the
  commissioner only curates and clicks Publish.
- **Half-point lines only** — every spread is a `x.5` number so every pick has
  a binary outcome. Lines are frozen at pull time and never move after publish.
- **Flexible week formats**: the slate builder can express any structure the
  league has used — straight-up sections, spread sections, a combined
  spread + over/under "Game of the Week", and "here are 15 games, pick any 10."
- **Player boosts**: each member flags 2 of their picks per week to be worth
  triple points (wrong boosted picks just score 0 — upside only).
- **Per-game locks**: every game locks at its own kickoff; picks stay hidden
  from other members until the game locks.
- **Automated grading** with commissioner override.
- **Multi-league ready**: private/invite-only this season, but leagues are a
  first-class table so more leagues (or a public future) need no schema change.
- **Money tracked, not processed**: buy-ins, pot, weekly winner payouts, and
  season payout split are displayed; actual money moves on Venmo outside the app.

### Non-Goals (v1)

- **No postseason.** Phase 1 covers the regular season only — no bowl games,
  no conference championships beyond the regular-season calendar, no CFP.
- **No payment processing.** Venmo happens outside the app (QR display only,
  same as the World Cup game).
- **No season-long extras** from prior years: no Triple-Up week, no
  drop-lowest-week, no Champion/Heisman props, no weekly bonus questions, no
  ghost players (Vegas/Underdog auto-entries). All are candidates for Phase 2.
- **No live in-game scores.** Grading happens after games go final; this is not
  a live-tracker product (avoids the polling load that bit BetzGolf).
- **No native app / push notifications.** Responsive web only.

---

## 3. Decision Log

Decisions made by Matt on 2026-08-13. These are settled — do not relitigate
during build; anything genuinely open is in [§10](#10-open-questions).

| # | Topic | Decision |
|---|-------|----------|
| 1 | Audience | Private/invite this season; schema is multi-league ready |
| 2 | Auth | Reuse BetzGames accounts **and add Google OAuth platform-wide** |
| 3 | Money | Track only (paid flags, pot, payout math); Venmo outside app |
| 4 | Line source | One consistent provider all season; ESPN-first, odds-API fallback; source labeled in admin |
| 5 | Rankings | AP Top 25; switch to CFP committee rankings once released |
| 6 | Half-point rule | Round **toward the favorite** (−7 → −7.5) |
| 7 | Agent schedule | Tuesdays 8:00am CT, automatic; lines frozen at pull |
| 8 | Safety valves | Manual line entry, void canceled games, pre-publish re-pull; Week 0/postseason are out of scope for Phase 1 |
| 9 | Week format | Fully flexible slate builder: all section types + "choose N of M" |
| 10 | Boosts | Player boosts 2 picks per week at 3×; wrong boosted picks score 0 (never negative) |
| 11 | Season ATS team | Points-per-cover variant, wanted, but design deferred (Phase 1.1 — see §10) |
| 12 | Deadlines | Per-game locks at each kickoff; unpicked games score 0 |
| 13 | Season extras | None in v1 |
| 14 | Ties | Weekly ties = co-winners; season ties broken by boosted-pick record; **weekly payout to the top scorer** (amount TBD) |
| 15 | Admin flow | Curate → explicit Publish; reminder nag Wednesday noon if unpublished; nothing auto-publishes |
| 16 | Grading | Auto score sync + admin override |
| 17 | Pick visibility | Hidden until each game locks, then visible |
| 18 | Home | BetzGames repo, `betzgames.com/cfb` |
| 19 | Notifications | Build templates for all four types; channel/enable decisions later |
| 20 | Standings | Full history + charts |

---

## 4. User Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| **Member** | A player in a league | Join via invite link, make/edit picks until each game locks, choose 2 boosts per week, view standings/history/charts, see others' picks after lock |
| **Commissioner** | Runs a league (Matt, for league #1) | All member capabilities + curate/publish weekly slates, manual line entry, void games, override results, mark members paid, configure league settings |
| **Platform admin** | `profiles.is_admin` (existing global flag) | Everything, across leagues |

> **Note for engineers:** BetzGames today only has the global `is_admin` flag.
> CFB Pick'em introduces *league-scoped* roles via `cfb_league_members.role`
> so a future second league doesn't require platform-admin rights to run.

---

## 5. Feature Specs

### 5.1 Accounts & Google Sign-In

- Reuse existing Supabase Auth accounts (`profiles` table) — one BetzGames
  login across golf, World Cup, and CFB Pick'em.
- **New platform work:** add **Google OAuth** as a sign-in method for the whole
  platform (Supabase Auth Google provider), alongside existing email+password.
  Account linking: same email = same account (Supabase default behavior;
  confirm `email_confirmed` handling for existing users).
- Signup remains open — anyone can create an account; league membership is
  what's gated (by invite).

### 5.2 Leagues & Membership

- `cfb_leagues`: name, season year, commissioner, settings (JSONB: boost count,
  boost multiplier, buy-in amount, weekly payout amount, season payout split).
- Invite link: league has a rotating invite code; visiting
  `/cfb/join/[code]` while signed in adds you as a member. Commissioner can
  regenerate the code or remove members.
- One league per member entry; a user can belong to multiple leagues (each with
  its own picks — pick rows are keyed by league membership, not just user).
- V1 ships with a single league (Matt's crew) but nothing is hardcoded to it.

### 5.3 The Tuesday Lines Agent

The heart of the product. Runs automatically every **Tuesday 8:00am CT**
during the regular season (Vercel cron, `0 13 * * 2` UTC — note this drifts to
7:00am CST after DST ends in November; acceptable).

**What it does, in order:**

1. **Fetch rankings** — AP Top 25 from ESPN's rankings endpoint
   (`site.api.espn.com/.../college-football/rankings`). Once CFP committee
   rankings exist (~week 10), use those instead. The active poll is recorded on
   the week row.
2. **Fetch the week's schedule + odds** — ESPN scoreboard endpoint for the
   current CFB week (FBS, `groups=80`), which includes kickoff times and odds
   (provider, spread, over/under) per game.
3. **Select games** — every game where **at least one team is ranked** in the
   active Top 25. Ranked-vs-ranked appears once. Store each with kickoff time,
   home/away, both teams' ranks (nullable).
4. **Freeze half-point lines** — apply the half-point rule (§9.1) to the market
   spread and store it as `frozen_spread`. Same for the over/under total
   (needed for Game-of-the-Week sections). Record the raw market line and the
   named source (`spread_source`, e.g. `"ESPN BET"`) for the audit trail.
5. **Create the week** in `draft` status with a **suggested slate** (see §5.4)
   and notify the commissioner that the board is ready.

**Source consistency rule:** the provider chosen in week 1 is *the* provider
for the season. ESPN's odds feed is the default; if it proves unreliable in
preseason testing, swap to a dedicated odds API (e.g. The Odds API) **before
the season starts** — never mid-season. The admin board always displays which
source each line came from.

**Safety valves (all admin-only, all pre-publish unless noted):**

- **Manual line entry** — if a wanted game has no line (or the pull failed for
  it), the commissioner types a half-point spread; flagged `manual` in the UI
  and audit trail.
- **Re-pull** — re-run the agent before publish (e.g. feed was down at 8am).
  Re-pull replaces unpublished data only. **Published lines are immutable.**
- **Void game** (works post-publish) — a canceled/postponed game is voided:
  every pick on it scores 0, it drops out of the week's max total, and
  "choose N of M" requirements shrink by one if needed.

**Precedent in repo:** the World Cup score sync
(`src/app/api/wc/sync-scores/route.ts`) already ingests ESPN's free API and
documents the home/away-orientation bug class — reuse its pattern of storing
results keyed by team, in our orientation, never by ESPN's home/away flags.

### 5.4 Slate Builder (Admin)

The commissioner composes each week from the pulled board. A week is a list of
**sections**; each section has:

| Field | Meaning |
|-------|---------|
| `type` | `spread` \| `straight_up` \| `spread_ou_combo` (Game of the Week) |
| `points_per_pick` | Base points for a correct pick (combo type: all-or-nothing for both legs) |
| `picks_required` | How many games the member must pick from this section ("choose 10 of 15"). Equal to game count = pick them all |
| `games[]` | Ordered game IDs from the week's board |

This expresses every historical format:

- **2023 format**: three sections — 3 straight-up @ 1pt, 7 spread @ 2pt,
  1 combo @ 4pt (21 pts/week).
- **Flat slate**: one spread section, 10 games @ 1pt.
- **"15 games, pick 10"**: one spread section, 15 games, `picks_required: 10`.

**Suggested default slate:** the agent pre-builds a draft using spreads —
e.g. the 3 tightest lines as straight-up, the next 7 as spread, and the
marquee ranked-vs-ranked game as Game of the Week. The commissioner can accept,
reorder, swap games, add manual-line games, or restructure sections entirely.

**Publish flow:** slate stays in `draft` (invisible to members) until the
commissioner hits **Publish**. If still unpublished **Wednesday noon CT**, the
commissioner gets a reminder (nag repeats daily). Nothing ever auto-publishes.
Published slates are structurally frozen: lines can't change; the only
post-publish mutations are *void game* and result overrides.

### 5.5 Making Picks

- Members see the published slate with frozen lines, kickoff times (displayed
  in the member's local timezone, stored UTC), and team ranks.
- **Per-game locks:** each pick is editable until *that game's* kickoff.
  Thursday-night game locks Thursday; the Saturday slate stays open through
  Saturday morning. Lock time = stored kickoff timestamp; enforce server-side
  on every write (never trust the client clock).
- **Missed picks score 0.** No mercy rule, no lowest-score default.
- **Boosts:** each member flags up to 2 of their picks per week as boosted
  (count and multiplier are league settings; default 2 × 3×). A boost can be
  added/moved/removed until its game locks. Boosts on combo (GOTW) sections
  are allowed unless the league setting excludes them (setting default: allowed).
- **Visibility:** before a game locks, members see only their own pick and a
  league-wide "picked / not picked" indicator per member. At lock, everyone's
  pick for that game (and its boost flag) becomes visible.
- **Pick states** to design for: no pick (0 pts), pick on a voided game
  (0 pts, doesn't count against `picks_required`), pick in an over-subscribed
  section (client prevents picking more than `picks_required`; server rejects).

### 5.6 Scoring Engine

Deterministic, idempotent function of `(frozen lines, final scores, picks,
boosts, voids)` — safe to re-run any time (results are recomputed, not
incremented, so admin overrides just trigger a re-grade). Full rules in §9.

### 5.7 Results Agent (Auto-Grading)

- **Schedule:** Saturday 11:00pm CT and Sunday 8:00am CT sweeps (Vercel cron),
  plus on-demand "Sync scores now" button in admin. The Sunday sweep catches
  late Pac-side kickoffs and any Friday games; a Tuesday-morning pre-pull check
  re-grades anything still unresolved.
- Pulls final scores from the **same ESPN scoreboard source**, matches games by
  stored ESPN event ID (never by team-name matching — see WC lessons), marks
  games `final`, and runs the scoring engine.
- **Admin override:** commissioner can edit any game's final score or manually
  set a pick outcome; a re-grade runs automatically. Overrides are flagged in
  the audit trail.
- Week reaches `graded` status when all non-voided slate games are final;
  weekly winner(s) recorded at that moment.

### 5.8 Standings, History & Charts

**Pages:**

- **Season leaderboard** — total points, weekly wins, boosted-pick record
  (the season tiebreaker), paid status.
- **Week view** — per-member scores for the week, weekly winner + payout badge,
  and the full pick grid (member × game) revealed per-game as locks pass —
  the live version of the Sheets "Summary" tab.
- **Member history** — every pick a member has made, week by week, with
  results and boost outcomes.

**Tiebreakers:** weekly ties are co-winners (split the weekly payout). Season
ties are broken by boosted-pick record (most correct boosted picks; still tied
→ split the season payout).

**Charts (suggested — pick favorites during build):**

1. **Season race line chart** — cumulative points per member by week (the
   classic "who's pulling away" chart from the old Sheets).
2. **Weekly heatmap grid** — member × week matrix colored by points scored;
   instantly shows hot streaks and dead weeks.
3. **ATS personality radar/split** — each member's favorite-vs-underdog pick
   rate and home-vs-away rate, with cover % for each. Answers "who's a dog
   bettor at heart."
4. **Boost report** — boosted-pick hit rate per member, points gained from
   boosts vs. points left on the table.
5. **Lone Wolf board** — picks where one member went against the entire
   league, and how those turned out.
6. **Consensus tracker** — each week's most/least agreed-upon games and
   whether the crowd was right (running "wisdom of the league" cover %).
7. **What-if Vegas line** *(cheap ghost-player substitute)* — overlay on the
   race chart showing what always-pick-the-favorite would have scored. Display
   only; not a leaderboard entry.

### 5.9 Money Tracking

- League settings: buy-in amount, weekly winner payout (amount **TBD** — build
  the field, leave configurable), season payout split (default 75/25 for
  1st/2nd, configurable), optional pot adjustments.
- Commissioner marks members paid (date + note). Standings show paid status.
- Pot math displayed: total collected, weekly payouts committed so far,
  remaining season pot, projected 1st/2nd amounts.
- Venmo QR / handle display on the league page (same approach as the World Cup
  game). **No payment processing.**

### 5.10 Notifications

Build **templates and send-infrastructure for all four**, each behind a
per-league toggle, **all defaulting to OFF** — Matt decides channels/enabling
later:

| Event | Default content |
|-------|-----------------|
| **Week published** | "Week N is live — X games, picks lock starting [first kickoff]. [link]" |
| **Deadline reminder** | Sent to members with unpicked games ~24h and ~2h before the first unlocked kickoff |
| **Weekly recap** | Weekly winner, member's score/rank, standings movement |
| **Commissioner nag** | Wednesday-noon unpublished-slate reminder (this one defaults ON — it's operational, not social) |

Channels: SMS via existing Twilio integration; email requires adding a
provider (Resend suggested) — flagged in §10. Template copy lives in code,
channel-agnostic (short-form renders for SMS, long-form for email).

### 5.11 Admin Dashboard

`/cfb/admin` (league-scoped, commissioner-only):

- **Board view** — Tuesday pull results: all Top 25 games, market vs. frozen
  lines, source labels, manual-entry affordance, re-pull button, pull health
  (when it last ran, errors).
- **Slate builder** — §5.4 UI with the suggested default pre-loaded.
- **Week control** — publish, void game, sync scores now, override results,
  week status timeline.
- **League management** — members, roles, invite code, paid tracking, league
  settings (boost config, payouts, notification toggles).
- **Audit trail** — every manual action (line entry, void, override, re-pull)
  with who/when/what.

---

## 6. Architecture

Follows BetzGames conventions (Next.js 14 App Router + Supabase + Vercel in
the `betzgames` repo):

- **Routes:** `src/app/cfb/*` (member pages), `src/app/cfb/admin/*`
  (commissioner), `src/app/api/cfb/*` (route handlers), mirroring how
  `/2026WC` and `/golf` are organized.
- **Crons:** Vercel cron for the Tuesday pull and results sweeps (see §8).
  Low-frequency only — nothing like live polling.
- **Auth/middleware:** keep the existing pure cookie-check middleware — **no
  network calls in middleware** (the Edge 504 lesson from BetzGolf is
  documented on the portfolio site and in repo history).
- **Client data discipline:** standings and slates are server-rendered reads;
  no client polling loops (the BetzGolf Supabase connection-saturation lesson).
  Everything is effectively static between grading runs.
- **Timezones:** all timestamps stored UTC; kickoff display localized;
  league-operational times (Tuesday pull, Wednesday nag) defined in CT.

---

## 7. Data Model

New tables are prefixed `cfb_` and live alongside the existing schema
(`profiles` is reused, not duplicated).

```sql
create table public.cfb_leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  season_year int not null,
  commissioner_id uuid not null references public.profiles(id),
  invite_code text not null unique,
  settings jsonb not null default '{
    "boost_count": 2,
    "boost_multiplier": 3,
    "boosts_allowed_on_combo": true,
    "buy_in": null,
    "weekly_payout": null,
    "season_payout_split": [0.75, 0.25],
    "notifications": {"week_published": false, "deadline_reminder": false,
                      "weekly_recap": false, "commissioner_nag": true}
  }'::jsonb,
  created_at timestamptz not null default now()
);

create table public.cfb_league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.cfb_leagues(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  role text not null default 'member' check (role in ('member','commissioner')),
  paid_at timestamptz,
  paid_note text,
  joined_at timestamptz not null default now(),
  unique (league_id, profile_id)
);

create table public.cfb_weeks (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.cfb_leagues(id) on delete cascade,
  week_number int not null,              -- CFB calendar week
  poll_used text not null,               -- 'AP' | 'CFP'
  status text not null default 'draft'
    check (status in ('draft','published','graded')),
  pulled_at timestamptz,
  published_at timestamptz,
  graded_at timestamptz,
  unique (league_id, week_number)
);

create table public.cfb_games (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.cfb_weeks(id) on delete cascade,
  espn_event_id text,                    -- null for fully manual games
  home_team text not null,
  away_team text not null,
  home_rank int,                         -- rank in the active poll, nullable
  away_rank int,
  kickoff_at timestamptz not null,       -- the per-game lock time
  market_spread numeric,                 -- raw provider line (audit)
  frozen_spread numeric not null,        -- half-point, negative = home favored
  frozen_total numeric,                  -- half-point O/U (combo sections)
  spread_source text not null,           -- 'ESPN BET' | 'manual' | ...
  status text not null default 'scheduled'
    check (status in ('scheduled','final','voided')),
  home_score int,
  away_score int,
  result_overridden boolean not null default false
);

create table public.cfb_slate_sections (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.cfb_weeks(id) on delete cascade,
  position int not null,
  type text not null check (type in ('spread','straight_up','spread_ou_combo')),
  points_per_pick int not null,
  picks_required int not null            -- = game count for "pick them all"
);

create table public.cfb_slate_games (
  section_id uuid not null references public.cfb_slate_sections(id) on delete cascade,
  game_id uuid not null references public.cfb_games(id) on delete cascade,
  position int not null,
  primary key (section_id, game_id)
);

create table public.cfb_picks (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.cfb_league_members(id) on delete cascade,
  section_id uuid not null references public.cfb_slate_sections(id) on delete cascade,
  game_id uuid not null references public.cfb_games(id) on delete cascade,
  side text not null check (side in ('home','away')),
  total_side text check (total_side in ('over','under')),  -- combo sections only
  boosted boolean not null default false,
  points_awarded numeric,                -- set by grading; null = ungraded
  outcome_overridden boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (member_id, game_id)
);

create table public.cfb_audit_log (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.cfb_leagues(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  action text not null,                  -- 'manual_line','void_game','override_result','repull','publish',...
  detail jsonb not null,
  created_at timestamptz not null default now()
);
```

Weekly/season standings are computed views (or a small materialized summary
refreshed at grading time) over `cfb_picks` — not incrementally maintained
counters, so re-grades are always safe.

**Enforced invariants (DB or server layer):**

- Pick writes rejected when `now() >= kickoff_at` or the game is voided.
- `frozen_spread`/`frozen_total` must end in `.5`.
- Boosted picks per member per week ≤ `settings.boost_count`.
- Picks per member per section ≤ `picks_required`.
- No line/slate mutation on a `published` week except void + result override.
- RLS: members read only their league's data; other members' pick rows
  invisible until the pick's game has locked (kickoff passed).

---

## 8. API Routes & Crons

| Route | Method | Purpose | Trigger |
|-------|--------|---------|---------|
| `/api/cfb/pull-lines` | POST | Tuesday agent: rankings + schedule + odds → frozen board + suggested slate | Vercel cron `0 13 * * 2` (Tue 8am CT) + admin re-pull button |
| `/api/cfb/sync-scores` | POST | Fetch finals, grade completed games | Vercel cron `0 4 * * 0` (Sat 11pm CT) and `0 13 * * 0` (Sun 8am CT) + admin button |
| `/api/cfb/nag` | POST | Wednesday unpublished-slate reminder | Vercel cron `0 17 * * 3` (Wed noon CT) |
| `/api/cfb/picks` | POST | Create/update a pick or boost (server-side lock check) | Member UI |
| `/api/cfb/admin/*` | POST | Publish, void, override, manual line, league settings | Admin UI |

Cron endpoints authenticate via `CRON_SECRET` header check, matching the
existing `api/cron/*` pattern in the repo. Crons run year-round but the
handlers self-gate to the configured season window (the WC sync's
"do nothing off-hours" pattern).

---

## 9. Scoring Rules (Precise Spec)

### 9.1 Half-Point Line Freezing

- Spread already ends in `.5` → keep as-is.
- Whole-number spread → **round toward the favorite** (increase the
  magnitude): −7 → −7.5. The favorite must win by *more*.
- Pick'em / even (spread 0): freeze as **home −0.5** and flag for commissioner
  review (this is the one case with no favorite to round toward).
- Over/under totals: whole number → **round up** (48 → 48.5); admin-editable
  pre-publish.

### 9.2 Grading

For each non-voided, final game, for each pick:

| Section type | Correct when | Points |
|---|---|---|
| `spread` | Chosen team covers `frozen_spread` (half-point ⇒ never a push) | `points_per_pick` |
| `straight_up` | Chosen team wins outright (FBS games can't tie) | `points_per_pick` |
| `spread_ou_combo` | Spread leg **and** total leg both correct | `points_per_pick` (all-or-nothing) |

- Incorrect pick, missing pick, or pick on a voided game: **0 points.**
  Nothing ever scores negative.
- **Boost:** correct boosted pick scores `points_per_pick × boost_multiplier`
  (default 3×). Incorrect boosted pick: 0.
- Weekly score = sum over the member's graded picks. Weekly winner(s) = top
  score; ties are co-winners and split the weekly payout.
- Season score = sum of weekly scores. Season ties broken by boosted-pick
  record (correct boosted picks count), then split.

---

## 10. Open Questions

Tracked here so the build doesn't stall on them; none block Phase 1 scaffolding.

1. **Season ATS team (Phase 1.1).** Direction chosen: each member picks one
   power-conference team preseason and earns points per cover, with some
   under-50%-ATS penalty — but the exact rules (points per cover, wipe vs.
   reduced penalty, lock date, duplicate team picks allowed?, which
   conferences count as "big") need a design pass with Matt before building.
2. **Weekly payout amount** — field exists, value TBD.
3. **Notification channels** — templates for all four are built; Matt decides
   which are enabled and whether SMS (Twilio, exists) or email (needs a
   provider — suggest Resend) or both.
4. **Boost interaction with "choose N of M" and combo sections** — default
   spec says boosts apply anywhere; confirm during slate-builder build.
5. **Week 1 provider bake-off** — validate ESPN odds coverage across a full
   Top 25 board in preseason; if coverage is spotty, commit to The Odds API
   before kickoff (Decision #4 requires choosing once, before the season).
6. **Brand spelling** — "BetzGames" per the platform; confirm the pick'em's
   display name (e.g. "Betz CFB Pick'em").

---

## 11. Phasing

| Phase | Scope |
|-------|-------|
| **1 (MVP, this season)** | Google OAuth platform-wide; leagues + invites; Tuesday agent; slate builder + publish flow; picks with per-game locks + boosts; auto-grading + overrides; standings + week grid + race chart + heatmap; money tracking; notification templates (off); admin dashboard + audit trail. Regular season only. |
| **1.1 (mid-season ok)** | Season ATS team (after design pass); remaining charts (ATS personality, boost report, lone wolf, consensus, Vegas overlay); enabled notifications per Matt's channel decision. |
| **2 (next season)** | Postseason support (bowls/CFP slates, manual mode); season extras (Triple-Up, drop-lowest, props, ghost players as real leaderboard entries); public league creation if desired. |

---

## 12. Environment Variables

New (beyond existing Supabase/Twilio/Vercel vars already in the repo):

| Var | Purpose |
|-----|---------|
| `CRON_SECRET` | Already exists — reuse for `/api/cfb/*` cron auth |
| `ODDS_API_KEY` | Only if the Week-1 bake-off selects The Odds API over ESPN |
| `RESEND_API_KEY` | Only if email notifications are enabled |
| Google OAuth client ID/secret | Configured in Supabase Auth dashboard, not app env |

---

*Prior art referenced: "College Pick em '19", "CFB Pick em '20/'21",
"!!!!! 2021_CFB Pick em", "CFB Pick 'Em 2022", "CFB Pick 'Em 2023" (Google
Drive); BetzGames World Cup 2026 game and BetzGolf (platform patterns and
production lessons).*
