# BetzGames — College Football Pick'em PRD

**Version:** 1.3
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
   - 5.8 Live Leaderboard (Game Days)
   - 5.9 Standings, History & Charts
   - 5.10 Season ATS Team
   - 5.11 Money Tracking
   - 5.12 Notifications
   - 5.13 Admin Dashboard
6. [Architecture](#6-architecture)
7. [Data Model](#7-data-model)
8. [API Routes & Crons](#8-api-routes--crons)
9. [Scoring Rules (Precise Spec)](#9-scoring-rules-precise-spec)
10. [Open Questions](#10-open-questions)
11. [Phasing](#11-phasing)
12. [Environment Variables](#12-environment-variables)

---

## 1. Overview

**Betz CFB Pick'em** is a weekly college football pool built into the BetzGames platform
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
    → Game days: live leaderboard (5-min score sync, projected standings)
    → Games grade as they go final; Sunday + Tuesday backstop sweeps
    → Standings update; weekly winner recorded; recap sent when week grades
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
- **Player boosts**: each member flags 2 of their **spread-section** picks per
  week to be worth triple points (wrong boosted picks just score 0 — upside
  only). Straight-up and Game-of-the-Week picks cannot be boosted.
- **Live game-day leaderboard**: scores for slate games sync every ~5 minutes
  during game windows; the leaderboard shows in-progress results, projected
  "if it ended now" standings, and who picked what on every locked game.
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
- **No native app / push notifications.** Responsive web only; SMS via the
  platform's SheetSMS bridge is the notification channel.

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
| 10 | Boosts | Player boosts 2 picks per week at 3×; wrong boosted picks score 0 (never negative) *(refined by #26: spread sections only)* |
| 11 | Season ATS team | Points-per-cover variant, wanted, but design deferred (Phase 1.1 — see §10) |
| 12 | Deadlines | Per-game locks at each kickoff; unpicked games score 0 |
| 13 | Season extras | None in v1 |
| 14 | Ties | Weekly ties = co-winners; season ties broken by boosted-pick record; **weekly payout to the top scorer** (amount TBD) |
| 15 | Admin flow | Curate → explicit Publish; reminder nag Wednesday noon if unpublished; nothing auto-publishes |
| 16 | Grading | Auto score sync + admin override |
| 17 | Pick visibility | Hidden until each game locks, then visible |
| 18 | Home | BetzGames repo, `betzgames.com/cfb` |
| 19 | Notifications | Build templates for all four types; channel/enable decisions later *(superseded by #24–25)* |
| 20 | Standings | Full history + charts |

Second round, also 2026-08-13:

| # | Topic | Decision |
|---|-------|----------|
| 21 | Season ATS scoring | +2 pts per cover; **all wiped** if the team finishes the regular season under 50% ATS |
| 22 | Season ATS eligibility | Power 4 (SEC, Big Ten, Big 12, ACC) + Notre Dame; **duplicates allowed**; locks at Week 1 first kickoff; awarded as a **season-end lump sum** |
| 23 | Weekly payout amount | Configurable field; Matt sets the number before Week 1 |
| 24 | Notification channel | **SMS via the existing platform integration** — *v1.3 correction: that integration is the SheetSMS bridge (`src/lib/sms.ts`), NOT Twilio; the repo's `twilio` package is a legacy leftover the codebase guidance says not to build on* |
| 25 | Notifications ON at launch | Week published, deadline reminder, weekly recap — recap sends only after the week fully grades (early-season weeks can include Monday games, so recap may land Tuesday morning those weeks) |
| 26 | Boost eligibility | **Spread sections only** (the 2-pt games). Straight-up and GOTW picks cannot be boosted |
| 27 | Brand | **Betz CFB Pick'em** |
| 28 | Live leaderboard | Yes — in-progress scores for slate games synced every ~5 min during game windows, live projected standings, who-picked-what on locked games |

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
  Supabase automatically links verified identities with matching email
  addresses.
- **Profile completion (required for OAuth):** `profiles.username` is
  `NOT NULL`, and signup also collects phone and emoji — none of which Google
  OAuth supplies. OAuth-created accounts land on a profile-completion step
  (username, emoji, phone for SMS) before proceeding. An invite URL must
  survive the OAuth round-trip (carried in the redirect state) so joining
  resumes after completion.
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
- **Boosts:** each member flags up to 2 of their **spread-section** picks per
  week as boosted (count and multiplier are league settings; default 2 × 3×,
  so a 2-pt spread pick pays 6). Straight-up and GOTW picks are not
  boost-eligible. A boost can be added/moved/removed until its game locks.
- **Visibility:** before a game locks, members see only their own pick and a
  league-wide "picked / not picked" indicator per member. At lock, everyone's
  pick for that game (and its boost flag) becomes visible.
- **Pick states** to design for: no pick (0 pts), pick on a voided game
  (0 pts, doesn't count against `picks_required`), pick in an over-subscribed
  section (client prevents picking more than `picks_required`; server rejects).

### 5.6 Scoring Engine

Deterministic, idempotent function of `(frozen lines, final scores, picks,
boosts, voids, the week's rules snapshot)` — safe to re-run any time (results
are recomputed, not incremented, so admin overrides just trigger a re-grade).

**Rules snapshot:** at publish, the week copies the league settings it will be
graded under (`boost_count`, `boost_multiplier`, boost-eligible section types,
weekly payout amount) into `cfb_weeks.rules_snapshot`. Grading reads the
snapshot, never live league settings — changing a league setting mid-season
affects only future weeks and can never silently re-score history. Full rules
in §9.

### 5.7 Results Agent (Auto-Grading)

- **Primary path:** the live-score sync (§5.8) already ingests scores every
  ~5 minutes during game windows; when it sees a slate game go final, it marks
  it `final` and runs the scoring engine for that game immediately. Grading is
  therefore near-real-time as games end.
- **Backstop sweeps:** Sunday 8:00am CT (catches anything the live sync
  missed) and a Tuesday-morning pre-pull check that re-grades anything still
  unresolved — including early-season Monday games. On-demand "Sync scores
  now" button in admin.
- Scores come from the **same ESPN scoreboard source**, matched by stored ESPN
  event ID (never by team-name matching — see WC lessons).
- **Admin override:** commissioner can edit any game's final score or manually
  set a pick outcome; a re-grade runs automatically. Overrides are flagged in
  the audit trail.
- Week reaches `graded` status when all non-voided slate games are final;
  weekly winner(s) and the payout amount (from the rules snapshot) are
  persisted to `cfb_week_results` at that moment — the durable record the
  money tracker and recap SMS read from.

### 5.8 Live Leaderboard (Game Days)

The game-day experience: while slate games are being played, the leaderboard
goes live.

- **Live score sync:** a cron polls the ESPN scoreboard every **5 minutes**,
  self-gated to actual game windows — it computes the day's window from the
  slate's kickoff times and does nothing (and hits no API) outside it. This is
  the exact pattern of the World Cup sync
  (`src/app/api/wc/sync-scores/route.ts`, driven by Supabase pg_cron): reuse
  it, including the "store scores in our orientation, keyed by event ID"
  discipline.
- **What members see:**
  - Every slate game with live score, period/clock, and the frozen line —
    with a live "covering / not covering" indicator per game.
  - **Projected standings** — each member's week score *if all current results
    held*, clearly badged as projected. In-progress games grade provisionally
    (spread vs. frozen line on the live score); final games grade for real.
  - **Who picked what** — for every locked game, each member's pick (and boost
    flag) inline, so you can watch the league sweat in real time. Unlocked
    games still show only pick counts.
- **Client discipline (BetzGolf lesson):** the server sync owns freshness.
  Clients revalidate on a modest interval (~60s) against cached server data —
  no per-client Supabase polling loops, no realtime channels needed for v1.
- Nothing about live data affects the record: official grading only happens on
  `final` status, and the §5.7 backstops reconcile anything the live sync got
  wrong.

### 5.9 Standings, History & Charts

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

### 5.10 Season ATS Team

Fully specified (Decisions #21–22); builds in Phase 1.1 since points only land
at season end, but the **team selection UI must ship before Week 1** because
picks lock at the Week 1 first kickoff.

- Before Week 1, each member picks **one team** from the Power 4 (SEC,
  Big Ten, Big 12, ACC) **plus Notre Dame**. Duplicates allowed — any number
  of members can ride the same team.
- Pick locks at the first kickoff of Week 1. Members who don't pick simply
  have no ATS team (0 bonus).
- **Scoring: +2 points per regular-season game the team covers** — against the
  **same Tuesday-frozen half-point line** used everywhere else (the Tuesday
  agent records each ATS team's line weekly; there is no separate closing-line
  system) — but if the team finishes the regular season **under 50% ATS, the
  entire bonus is wiped to 0** (exactly 50% is safe).
- **Week 0 games are excluded from ATS results.** Selections don't lock until
  Week 1's first kickoff, so counting Week 0 covers would let members pick
  with the result already known. ATS tracking starts at Week 1, matching
  Phase 1's Week 1 start.
- Points are **not** mixed into weekly standings. A dedicated ATS-team board
  shows each team's running ATS record and the at-risk bonus all season; the
  lump sum lands in season totals after the final regular-season week grades.
- The team's weekly ATS results use the same source/half-point rules as
  everything else; games the team plays that aren't on any slate are still
  tracked (the agent records the team's line and result each week).

### 5.11 Money Tracking

- League settings: buy-in amount, weekly winner payout (amount **TBD** — build
  the field, leave configurable), season payout split (default 75/25 for
  1st/2nd, configurable), optional pot adjustments.
- Commissioner marks members paid (date + note). Standings show paid status.
- Pot math displayed: total collected, weekly payouts committed so far,
  remaining season pot, projected 1st/2nd amounts.
- Venmo QR / handle display on the league page (same approach as the World Cup
  game). **No payment processing.**

### 5.12 Notifications

**Channel: SMS via the platform's existing SheetSMS bridge** (Decision #24 as
corrected in v1.3) — `sendSms()` in `src/lib/sms.ts`, which posts to a Google
Apps Script webhook (`SHEET_SMS_WEBHOOK_URL`/`SHEET_SMS_SECRET`). Do **not**
build on the legacy `twilio` package. All four notification types ship
**enabled by default** (Decision #25), each behind a per-league toggle:

| Event | Timing | Default content |
|-------|--------|-----------------|
| **Week published** | On publish | "Week N is live — X games, picks lock starting [first kickoff]. [link]" |
| **Deadline reminder** | ~24h and ~2h before the member's first unlocked, unpicked kickoff | Sent only to members with unpicked games |
| **Weekly recap** | **When the week fully grades** — not a fixed day. Usually Sunday; early-season weeks with Monday games recap Tuesday morning | Weekly winner, member's score/rank, standings movement |
| **Commissioner nag** | Wednesday noon CT if unpublished, daily until published | Operational reminder to Matt |

Template copy lives in code, channel-agnostic, so email (e.g. Resend) can be
added later without redesign.

**Idempotency:** every send is recorded in `cfb_notifications` with a unique
deduplication key (`league/member/type/reference`, e.g.
`week:<id>:recap:member:<id>`). A send only happens if inserting the delivery
row succeeds, so cron retries and overlapping runs can never double-text
anyone.

### 5.13 Admin Dashboard

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
- **Crons:** Vercel cron for scheduled operations (Tuesday pull, daily nag,
  hourly reminders, Sunday sweep); **Supabase pg_cron** for the 5-minute live score sync,
  self-gated to game windows so it's idle the other ~6 days a week (see §8).
- **Auth/middleware:** keep the existing pure cookie-check middleware — **no
  network calls in middleware** (the Edge 504 lesson from BetzGolf is
  documented on the portfolio site and in repo history).
- **Client data discipline:** standings and slates are server-rendered reads;
  no client polling loops (the BetzGolf Supabase connection-saturation lesson).
  Off game days everything is effectively static; on game days the live
  leaderboard revalidates against cached server data on a ~60s interval —
  freshness is owned by the single server-side sync, never by per-client
  queries.
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
    "boost_eligible_section_types": ["spread"],
    "buy_in": null,
    "weekly_payout": null,
    "season_payout_split": [0.75, 0.25],
    "ats_points_per_cover": 2,
    "notifications": {"week_published": true, "deadline_reminder": true,
                      "weekly_recap": true, "commissioner_nag": true}
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
  rules_snapshot jsonb,                  -- league settings copied at publish;
                                         -- grading reads THIS, never live settings
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
  frozen_spread numeric,                 -- half-point, negative = home favored;
                                         -- NULLABLE in draft (line missing, awaiting
                                         -- manual entry); publish validation requires
                                         -- it for every game in a published section
  frozen_total numeric,                  -- half-point O/U (combo sections)
  spread_source text not null,           -- 'ESPN BET' | 'manual' | ...
  status text not null default 'scheduled'
    check (status in ('scheduled','in_progress','final','voided')),
  home_score int,                        -- live-updated during in_progress
  away_score int,
  game_clock text,                       -- display only, e.g. 'Q3 8:42'
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
  primary key (section_id, game_id),
  unique (game_id)                       -- a game sits in at most ONE section
);

create table public.cfb_picks (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.cfb_league_members(id) on delete cascade,
  section_id uuid not null,
  game_id uuid not null,
  -- composite FK guarantees the pick's game actually belongs to its section:
  foreign key (section_id, game_id)
    references public.cfb_slate_games(section_id, game_id) on delete cascade,
  side text not null check (side in ('home','away')),
  total_side text check (total_side in ('over','under')),  -- combo sections only
  boosted boolean not null default false,
  points_awarded numeric,                -- set by grading; null = ungraded
  override_outcome text
    check (override_outcome in ('correct','incorrect')),   -- null = graded normally
  override_points numeric,               -- points to award when overridden
  override_reason text,
  overridden_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (member_id, game_id)
);
-- Cross-league integrity (member's league == section's week's league) can't be
-- expressed as a plain FK; enforce it in a BEFORE INSERT/UPDATE trigger (or by
-- routing all pick writes through one SECURITY DEFINER function that checks it
-- atomically alongside the lock check).

create table public.cfb_week_results (   -- durable weekly winner/payout record
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.cfb_weeks(id) on delete cascade,
  member_id uuid not null references public.cfb_league_members(id) on delete cascade,
  points numeric not null,
  is_winner boolean not null default false,
  payout_amount numeric,                 -- from the week's rules_snapshot; split on ties
  payout_paid_at timestamptz,
  unique (week_id, member_id)
);

create table public.cfb_notifications (  -- SMS delivery log = idempotency guard
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.cfb_leagues(id) on delete cascade,
  member_id uuid references public.cfb_league_members(id) on delete cascade,
  type text not null,                    -- 'week_published','deadline_reminder',...
  dedupe_key text not null unique,       -- e.g. 'week:<id>:recap:member:<id>'
  sent_at timestamptz not null default now(),
  ok boolean not null,
  error text
);

create table public.cfb_ats_teams (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.cfb_league_members(id) on delete cascade,
  team text not null,                    -- Power 4 + Notre Dame, validated in app
  locked_at timestamptz,                 -- set at Week 1 first kickoff
  unique (member_id)
);

create table public.cfb_ats_results (    -- one row per ATS team per week
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.cfb_leagues(id) on delete cascade,
  team text not null,
  week_number int not null,
  frozen_spread numeric,                 -- team's line that week (half-point)
  covered boolean,                       -- null = bye/void
  unique (league_id, team, week_number)
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
- Publish validation: every game in a published section has a non-null
  `frozen_spread` ending in `.5` (and `frozen_total` for combo sections);
  drafts may hold line-less games awaiting manual entry.
- Boosted picks per member per week ≤ the week's `rules_snapshot.boost_count`,
  and only in boost-eligible section types.
- Picks per member per section ≤ `picks_required`.
- No line/slate mutation on a `published` week except void + result override.
- Pick writes verify member.league == week.league (trigger or single atomic
  write function — see DDL comment).
- RLS: members read only their league's data; other members' pick rows
  invisible until the pick's game has locked (kickoff passed).
- **Migrations include explicit Data API grants alongside RLS policies.**
  Supabase applies grants-required-by-default to existing projects on
  **2026-10-30** — mid-season for us — after which new tables (e.g. the
  Phase 1.1 ATS tables) are invisible to the Data API without explicit
  `grant` statements. Make grants part of every table's migration from day
  one.

---

## 8. API Routes & Crons

| Route | Method | Purpose | Trigger |
|-------|--------|---------|---------|
| `/api/cfb/pull-lines` | GET (cron) / POST (admin) | Tuesday agent: rankings + schedule + odds → frozen board + suggested slate; also records ATS teams' weekly lines | Vercel cron `0 13 * * 2` (Tue 8am CT) + admin re-pull button |
| `/api/cfb/sync-scores` | POST | Live score ingestion + grade games as they go final; sends weekly recap when the week fully grades | **Supabase pg_cron every 5 min**, self-gated to slate game windows (WC pattern) + admin button |
| `/api/cfb/sweep` | GET (cron) / POST (admin) | Backstop: reconcile any missed finals/re-grades | Vercel cron `0 13 * * 0` (Sun 8am CT) + Tuesday pre-pull check |
| `/api/cfb/nag` | GET | Unpublished-slate reminder to commissioner | **Daily** Vercel cron `0 17 * * *` (noon CT); handler self-gates — sends only from Wednesday onward while the week is unpublished |
| `/api/cfb/remind` | GET | Deadline reminders (~24h and ~2h before a member's first unlocked, unpicked kickoff) | Hourly Vercel cron, self-gated to published weeks with upcoming kickoffs |
| `/api/cfb/picks` | POST | Create/update a pick or boost (server-side lock check) | Member UI |
| `/api/cfb/admin/*` | POST | Publish, void, override, manual line, league settings | Admin UI |

**Cron mechanics (match the repo's existing patterns exactly):** Vercel cron
invokes routes with **GET** and an `Authorization: Bearer ${CRON_SECRET}`
header — so cron-triggered routes export a `GET` handler (and a `POST` for
the equivalent admin button), as `api/cron/auto-start-drafts` and
`api/datagolf/sync` already do. The pg_cron-driven `sync-scores` route uses
**POST** with the `x-internal-secret` header, matching `api/wc/*`; its
schedule lives in the Supabase `cron.job` table, not in `vercel.json`. Crons
run year-round but handlers self-gate to the configured season window (the WC
sync's "do nothing off-hours" pattern). All sends are deduplicated through
`cfb_notifications` (§5.12), so overlapping or retried cron runs are
harmless.

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
- **Boost:** only spread-section picks are boost-eligible. A correct boosted
  pick scores `points_per_pick × boost_multiplier` (default 2 × 3 = 6).
  Incorrect boosted pick: 0. Boost count/multiplier come from the week's
  `rules_snapshot`, never live league settings.
- **Overrides:** a pick with `override_outcome` set scores `override_points`
  and is skipped by normal grading; everything else re-grades normally.
- **Season ATS team (graded at season end):** +2 per weekly cover, summed;
  wiped to 0 if the team's final regular-season ATS record is under 50%
  (exactly 50% keeps the points). Added to season totals only, never weekly.
- Weekly score = sum over the member's graded picks. Weekly winner(s) = top
  score; ties are co-winners and split the weekly payout.
- Season score = sum of weekly scores. Season ties broken by boosted-pick
  record (correct boosted picks count), then split.

---

## 10. Open Questions

Tracked here so the build doesn't stall on them; none block Phase 1 scaffolding.

1. **Weekly payout amount** — field exists; Matt sets the value before Week 1
   (Decision #23).
2. **Week 1 provider bake-off** — validate ESPN odds coverage across a full
   Top 25 board in preseason; if coverage is spotty, commit to The Odds API
   before kickoff (Decision #4 requires choosing once, before the season).

---

## 11. Phasing

| Phase | Scope |
|-------|-------|
| **1 (MVP, this season)** | Google OAuth platform-wide **with profile-completion flow** (username/emoji/phone; invite URL survives the OAuth round-trip); leagues + invites; Tuesday agent; slate builder + publish flow (with rules snapshot); picks with per-game locks + spread-only boosts; **live game-day leaderboard** (5-min score sync, projected standings, who-picked-what); auto-grading + overrides; standings + week grid + race chart + heatmap; money tracking (incl. `cfb_week_results`); SheetSMS notifications on (published/reminder/recap) with delivery-log dedupe; admin dashboard + audit trail; **ATS team selection UI** (must exist before Week 1 lock); **automated tests for the scoring engine** (the platform has no test suite — this feature's game/money logic is where one starts: half-point freezing, grading per section type, boosts, voids, overrides, snapshots). Regular season only. |
| **1.1 (mid-season ok)** | Season ATS team tracking board + season-end scoring (rules settled — Decisions #21–22; only the lump-sum grading must exist by season end); remaining charts (ATS personality, boost report, lone wolf, consensus, Vegas overlay). |
| **2 (next season)** | Postseason support (bowls/CFP slates, manual mode); season extras (Triple-Up, drop-lowest, props, ghost players as real leaderboard entries); public league creation if desired. |

---

## 12. Environment Variables

New (beyond existing Supabase/SheetSMS/Vercel vars already in the repo):

| Var | Purpose |
|-----|---------|
| `CRON_SECRET` | Already exists — reuse for `/api/cfb/*` cron auth (Bearer on GET) |
| `SHEET_SMS_WEBHOOK_URL` / `SHEET_SMS_SECRET` | Already exist — the SheetSMS bridge used for all SMS |
| `ODDS_API_KEY` | Only if the Week-1 bake-off selects The Odds API over ESPN |
| `RESEND_API_KEY` | Only if email notifications are added later |
| Google OAuth client ID/secret | Configured in Supabase Auth dashboard, not app env |

---

## Revision History

| Version | Changes |
|---------|---------|
| 1.0 | Initial PRD from Matt's first-round Q&A (Decisions #1–20) |
| 1.1 | Second-round decisions (#21–28): ATS team rules, SheetSMS-era notification choices, spread-only boosts, brand, live game-day leaderboard |
| 1.2 | Internal QC: live-leaderboard consistency, dedicated reminder cron, version/cross-ref fixes |
| 1.3 | External QC (verified against the betzgames codebase): ATS uses Tuesday-frozen lines + Week 0 excluded; **SMS corrected from Twilio to the SheetSMS bridge**; Vercel crons use GET + Bearer auth; nag cron made daily/self-gated; per-week `rules_snapshot`; pick-schema integrity (one-section-per-game, composite FK, league-consistency check); structured override fields; nullable draft lines with publish validation; `cfb_week_results` + `cfb_notifications` idempotency tables; OAuth profile-completion flow; scoring test suite in Phase 1; explicit Supabase Data API grants in migrations (2026-10-30 platform change) |

---

*Prior art referenced: "College Pick em '19", "CFB Pick em '20/'21",
"!!!!! 2021_CFB Pick em", "CFB Pick 'Em 2022", "CFB Pick 'Em 2023" (Google
Drive); BetzGames World Cup 2026 game and BetzGolf (platform patterns and
production lessons).*
