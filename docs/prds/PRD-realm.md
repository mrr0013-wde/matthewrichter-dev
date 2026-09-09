# Aldenmoor — A Living Fantasy Map of Matt Richter's Projects (PRD)

**Version:** 1.0
**Date:** 2026-09-04
**Author:** Matt Richter
**Home:** `matthewrichter.dev` (repo `mrr0013-wde/matthewrichter-dev`), with one small
read-only API added to `betzgames`
**Status:** Draft for build. Decisions in §12 are settled; don't relitigate them.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Inspiration & What We Are Borrowing](#2-inspiration--what-we-are-borrowing)
3. [Goals & Non-Goals](#3-goals--non-goals)
4. [Audience](#4-audience)
5. [The Realm (Lore & Holdings)](#5-the-realm-lore--holdings)
6. [Living State Model](#6-living-state-model)
7. [Feature Specs](#7-feature-specs)
8. [Architecture](#8-architecture)
9. [Data Model & API Contracts](#9-data-model--api-contracts)
10. [Assets & Art Pipeline](#10-assets--art-pipeline)
11. [Performance Budget](#11-performance-budget)
12. [Decision Log](#12-decision-log)
13. [Milestones](#13-milestones)
14. [Testing](#14-testing)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Open Items](#16-open-items)

---

## 1. Overview

Aldenmoor is the new front page of matthewrichter.dev: a 3D medieval realm, viewed
from a Google-Earth-style camera, where every project Matt has built is a holding on
the map. A golf keep on a headland, a tourney ground that fills with tents in autumn,
a counting house, a tile hall, a card den. Each holding has a house, a sigil and a seat.

The realm is **alive** because it is driven by the real state of the projects. When a
golf tournament is in play the banners of House Fairway fly and crowds gather. When a
World Cup match is live, drums beat at the Worldsmoot. When a repo has had commits this
week, masons are up on scaffolding. When a project has gone quiet for a season, ivy
creeps up the walls and a single window stays lit. When a deploy is down, smoke rises
from the rubble and ravens circle.

Clicking a holding opens a card beside it: what the project really is, what it is
built with, its live status in plain language, and buttons to visit it or read the
code. The capital, Hearthkeep, is Matt himself: about, resume, contact.

The rule, borrowed from Bot Crossing: **everything visible means something.** A
villager sleeps because the project is dormant, not because sleeping looks nice.

---

## 2. Inspiration & What We Are Borrowing

[Bot Crossing](https://github.com/jarrenrocks/bot-crossing) (MIT, Jarren Rocks) turns a
Mac's Claude Code sessions into a 3D space colony: one sticky hex zone per repo, one
astronaut per session, animation as a strict function of the thread's state, a Google
Earth camera, one draw call for the whole crowd, KayKit CC0 art, and a thin server.

What transfers directly:

| Bot Crossing | Aldenmoor |
|---|---|
| Repo → hex zone | Project → holding (a group of hex tiles) |
| Session → astronaut + building | Project → seat (castle/hall) + a few villagers |
| Thread state (errored / working / waiting / merged / dormant) | Project state (§6): besieged / mustering / building / feasting / quiet / dormant / blighted |
| Layout is sticky, saved to `colony.json` | Layout is **authored** in `realm.config.ts`. It never moves at all. |
| Reads local harness files | Reads public HTTP: a betzgames status endpoint, GitHub, uptime pings |
| Click → deep link into the thread | Click → card → visit the live project |
| Three planets, day/night | One realm, day/night from the viewer's clock, seasons from the real calendar |
| Space Base Bits + Character Animations + Forest packs | KayKit Medieval Hexagon + Medieval Builder + Adventurers + Character Animations + Forest packs |

What does **not** transfer: anything that reads a machine's local files, the archive
write-back, the harness adapter system, and the macOS-only `open(1)` deep links. Aldenmoor
is a public website; it reads, never writes.

Bot Crossing ships a skill, `.claude/skills/agent-session-world/`, with four reference
docs (making it feel alive, rendering traps, harness adapters, asset pipeline). The
first, second and fourth are required reading before M1. Their specific lessons that
apply here are folded into §10 and §11.

---

## 3. Goals & Non-Goals

### Goals
- Replace the matthewrichter.dev homepage with the realm. Recruiter-safe on first
  glance, funny once you hover.
- Every project Matt ships has a place on the map, and adding a project is a data
  change (one entry in `realm.config.ts`), not a code change.
- The realm visibly reflects real state within ~60 seconds of it changing, with zero
  added load on the betzgames Supabase project beyond one cheap, edge-cached query set.
- Runs at 60 fps on a 2021 MacBook Air in Chrome and Safari at native resolution.
- Full content (project names, descriptions, links, resume) is present in server-rendered
  HTML, so crawlers and no-WebGL browsers still get a real portfolio.

### Non-Goals
- **No mobile support.** Desktop and laptop only. A phone gets the HTML sidebar and a
  static hero image, not the canvas. (Settled, §12.)
- No accounts, no login, no cookies beyond the settings a viewer changes.
- No writing to any system. The realm reads status; it never mutates a project.
- No websockets or realtime. Polling at 60 s is the design.
- No Game of Thrones, Lord of the Rings or Tolkien names, sigils, quotes or fonts. All
  lore is original (§5). Inspired-by is fine; recognisable is not.
- No sound by default. An optional ambient toggle is a stretch goal (M3).
- No new Vercel crons anywhere. The betzgames Vercel account is Hobby-tier and daily-only
  crons; anything more breaks production deploys from `main`.

---

## 4. Audience

| Who | What they need in the first 10 seconds | What they find if they stay |
|---|---|---|
| Recruiter / hiring manager | This person ships real products, and the site itself is a technical flex | Stack per project, links to code, resume at Hearthkeep |
| League friends (golf, CFB, WC) | Their game, live, one click away | The in-jokes in the tooltips; the drum beat when their match is on |
| Matt | A glance tells him what's live, what's stale, what's down | A dashboard he wants to leave open on a second monitor |

Tone: the sidebar and cards read straight (real names, real descriptions). The lore lives
in the map labels, banners and hover tooltips. A recruiter never has to decode a joke to
find the resume.

---

## 5. The Realm (Lore & Holdings)

### 5.1 The world

**Aldenmoor** is a small island realm: a wooded interior, a headland on the west coast,
a broad fairground in the south, a river running to a harbour town. The realm is ruled
from **Hearthkeep** at its centre, seat of **House Alden** (Matt's own house). House
Alden's sigil is a **compass rose over a chevron**, silver on midnight blue. Its words:
*"Measure, then wager."*

The land is a hex grid (KayKit Medieval Hexagon Pack). Each holding is a contiguous
group of 3–9 hexes with a **root tile**; the seat stands on the root, villagers and
props on the rest. Holdings are grouped into **regions** that share terrain dressing.

### 5.2 Holdings

| Holding | Region | House & sigil | Real project | URL |
|---|---|---|---|---|
| **Hearthkeep** (capital) | The Heartlands | House Alden — compass rose, silver on midnight | matthewrichter.dev itself: about, resume, contact, writing | `/` (the card is the about page) |
| **Fairway Keep** | The Betzmarch (west headland) | House Fairway — a golden pennant on a green field | betzgames **/golf**: fantasy golf draft league (drafts, rosters, live payouts, auctions, trades) | betzgames.com/golf |
| **Hollowfield Tourney Grounds** | The Betzmarch | House Hollowfield — two crossed lances, saffron on umber | betzgames **/cfb**: Betz CFB Pick'em (weekly spreads, boosts, grading) | betzgames.com/cfb |
| **The Worldsmoot** | The Betzmarch (south fairground) | The Moot — a ring of 48 small banners, no single house | betzgames **/2026WC**: World Cup bracket pool with live odds | betzgames.com/2026WC |
| **The Countinghouse** | The Betzmarch (harbour town) | House Ledger — a balanced scale, gold on black | betzgames **/betzdashboard** + **/betstracker**: bankroll and bets | betzgames.com/betzdashboard |
| **The Tile Hall** | The Harbour | House Tilewright — a green dragon tile | mahjong.consulting + betzgames **/mahjong** (Siamese) | mahjong.consulting |
| **The Landlord's Rest** (tavern) | The Harbour | No house — a landlord's key on a red door | dou-dizhu ("Fight the Landlord") card game | dou-dizhu-mrr.fly.dev |
| **The Millfield Games** (arena) | The Eastern Downs | House Millfield — a laurel over a millwheel | milympics | *(URL to confirm, §16)* |
| **The Painted Hall** (gallery) | The Heartlands, beside Hearthkeep | Lisa's mark — a brush and a leaf | lisa-richter-portfolio | *(URL to confirm, §16)* |

Each holding entry carries: `id`, `house`, `seat`, `sigil` (two colours + a glyph id),
`region`, `hexes` (axial coords, root first), `tier` (1–3, sets seat model and villager
count), `project` (real name, one-line description, stack tags), `links`
(visit, repo if public), and `signals` (which live sources apply, §6.3).

### 5.3 Naming rules

- Every name is original. A quick check against well-known fantasy IP is part of adding
  a holding.
- Real project names appear in the card title, in the sidebar, and in the HTML; the
  lore name appears on the map label and the banner. Never make a visitor guess.
- Tooltips may be funny. Cards are straight.

---

## 6. Living State Model

### 6.1 States

A holding is in exactly one state. It is resolved by a pure function
`resolveState(signals, now): HoldingState`, first match wins, the same strict precedence
Bot Crossing uses so that nothing is ever doing two things.

| # | State | Trigger | What you see | Badge |
|---|---|---|---|---|
| 1 | **Blighted** | Uptime ping to the holding's URL failed twice in a row (≥ 2 min) | Smoke from the seat, ravens, fault-red torch flicker | `!` |
| 2 | **Besieged** (live) | A live event is in progress now: golf round in play, WC match `in`, CFB game `in_progress`, an active draft with the clock running | Banners raised, crowd at the gates, drums (particles), torches lit regardless of hour | `⚔` |
| 3 | **Mustering** | An event is imminent or open for action: golf tournament `active` but no round live, CFB week `published` and not graded, WC match within 24 h | Tents up, riders arriving along the road, a herald at the gate | `⚑` |
| 4 | **Feasting** | A result settled in the last 48 h: payouts posted, week `graded`, match `final` | Lanterns strung, fireworks at night, cheering villagers | `✓` |
| 5 | **Building** | Commits to the repo in the last 7 days | Scaffolding on the seat, masons hammering, sparks | — |
| 6 | **Quiet** | Anything else with activity in the last 90 days | Villagers potter, chimney smoke, a dog | — |
| 7 | **Dormant** | No commits and no events for 90 days | Ivy on the walls, mist, one lit window, sheep on the green | — |

Only states 1–4 get a badge. With most of the realm quiet most of the year, a glyph on
every seat would bury the one that matters. Same rule for labels: a holding shows its
name only while besieged, mustering, feasting or blighted; everything else is nameless
until pointed at.

### 6.2 Seasons

The calendar dresses regions before the state does:

| Season (real dates) | Dressing |
|---|---|
| CFB season (late Aug – mid Jan) | Hollowfield has its lists and stands built; autumn foliage in the Betzmarch |
| Golf season (Jan – Aug, PGA calendar; peaks at majors) | Fairway Keep flies its full pennant string; greens are greener |
| World Cup summer (Jun – Jul 2026, then every 4 years) | The Worldsmoot fairground is fully tented. Off-years: an empty fairground with one caretaker and a locked gate |
| Winter (Dec – Feb) | Snow on the Downs and the Heartlands, none on the coast |

Day/night follows the viewer's local clock and is scrubbable (`L` cycles, as in Bot
Crossing). Night is when Feasting reads best, so Feasting also lights lanterns by day.

### 6.3 Signals

| Signal | Source | Cadence | Used by |
|---|---|---|---|
| Game status (golf, CFB, WC, mahjong active flag) | `GET betzgames.com/api/realm-status` (§9.2) | Edge-cached 60 s | Besieged, Mustering, Feasting |
| Recent commits | GitHub REST, server-side with a fine-grained read-only PAT (private repos included) | Cached 10 min | Building, Quiet, Dormant |
| Uptime | `HEAD` to each holding's URL with a 5 s timeout, from the matthewrichter.dev server route | Every 60 s (on request, cached) | Blighted |
| Deploy freshness (optional) | Vercel deployments API, read-only | Cached 10 min | Building (tie-breaker), card "last deployed" |

All signals flow through one aggregating route on matthewrichter.dev (`/api/realm`,
§9.1). The browser never talks to GitHub or betzgames directly.

---

## 7. Feature Specs

### 7.1 The map
- Hex terrain from the Medieval Hexagon Pack, displaced gently (±0.25 units), vertex
  coloured per region. Terrain and scatter (trees, rocks, fences) are static geometry,
  built once at load.
- Holdings are authored in `realm.config.ts` with explicit axial hex coordinates. There is
  no layout algorithm and nothing ever moves. This is the one place we deliberately
  diverge from Bot Crossing: with ~10 holdings, an authored map beats a sticky one.
- Roads connect every holding to Hearthkeep, drawn as a decal strip on the terrain.
- Water hexes around the island with a simple animated shader; a harbour with two boats.

### 7.2 Seats and villagers
- A seat is a **recipe**: a list of Medieval Builder Pack pieces at offsets, merged into one
  geometry per holding at load. Tiers: 1 = a great keep (Hearthkeep), 2 = a keep or hall,
  3 = a house with a yard. Recipes live next to the config.
- The house's sigil colour is applied by repainting one atlas swatch in the fragment
  shader (the KayKit gradient atlas trick from Bot Crossing), so banners, roof trim and
  door paint match without extra materials.
- Villagers: 2–6 per holding by tier, KayKit Adventurers bodies with the Character
  Animations clip set, baked to a bone-matrix texture and drawn as **one instanced,
  GPU-skinned mesh** for the whole realm. Behaviour → clip mapping:

| State | Villager clip |
|---|---|
| Blighted | `Hit_A` then `Idle` with fault-red eye glow |
| Besieged | Half `Cheering`, half `Hammering` (drummers) at the gate |
| Mustering | `Walking_A` along the road toward the seat, then `Waving` |
| Feasting | `Cheering`, and one `Sit_Floor` by the fire |
| Building | `Hammering` on the scaffold |
| Quiet | `Idle_A` / `Walking_A` pottering inside the holding |
| Dormant | `Sit_Floor_Down` → `Sit_Floor_Idle`, held |

- Villagers route with A* over a nav grid rasterised from the seats and props, with
  collision applied every step regardless of route (Bot Crossing's two independent
  guarantees). Clip selection follows distance actually covered, not intended velocity.

### 7.3 Camera
Google Earth's model, as specified in Bot Crossing and kept exactly:
drag grabs the ground and pins the point under the cursor; right-drag / ⌃ / ⇧ tilts and
rotates; scroll zooms **at the cursor**; two-finger pinch on trackpads; arrows and `+`/`−`
on the keyboard; `O` orbits slowly around whatever is centred; `0` resets.
On first load, a 4-second flyover from high over the sea down to Hearthkeep, skippable
by any input. `prefers-reduced-motion` skips it.

### 7.4 The panel (right side)
One panel, no top bar, no bottom strip. Server-rendered HTML so its content exists
without JavaScript.
- Realm name, House Alden sigil, a one-line "Matt Richter builds prediction games and
  tools for his friends" strapline.
- **Regions → holdings** list. Each row: sigil dot, real project name, lore name in
  small caps, status glyph if any. Clicking flies to and selects the holding.
- `N` flies to the next holding with a badge (something live or broken).
- `H` hides every panel; the realm still reads because badges live over the seats.

### 7.5 The card (beside the selected holding)
Parked next to the seat in screen space, following it as the camera moves (transform, not
`left`/`top`), flipping sides rather than sliding under the panel.
- Header: sigil, real project name, lore name.
- One line of live status in plain words, generated from state + signal details, e.g.
  *"Round 3 in progress — 6 owners contending, payouts updating."*,
  *"Week 2 picks open — locks Saturday noon."*, *"Quiet since June. Last commit 41 days
  ago."*, *"Unreachable for 4 minutes."*
- Description (2–3 sentences, straight), stack tags, "last deployed" if known.
- Buttons: **Visit** (accent), **Code** (if the repo is public), and for Hearthkeep:
  **Resume (PDF)**, **Email**, **GitHub**, **LinkedIn**.
- `Esc` steps outward: card → deselect.

### 7.6 Settings (`S`)
Five quality presets, Potato → Ultra, each knob individually adjustable with a dot when
moved off preset (render scale as a share of native device resolution, adaptive quality
governor, HDR + bloom, shadows, sky environment). Day/night mode: clock, scrub, or fixed.
Return-to-isometric on release: off by default. Persisted in `localStorage`.

### 7.7 Fallbacks
- No WebGL, or a viewport under 900 px wide: render the panel full-width over a static
  hero render of the realm (a PNG captured with `P`). Same content, same links.
- `/api/realm` unreachable: every holding renders **Quiet** and the card says "Status
  unavailable." Never a blank map, never a spinner over the whole page.
- The page must reach interactive with the terrain and seats visible before villagers
  and the environment map finish loading.

### 7.8 Sharing
- `P` captures a screenshot to a download.
- The Open Graph image is a pre-rendered dusk shot of the realm, regenerated by hand when
  the map changes (not at build time).

---

## 8. Architecture

Four layers, as in Bot Crossing's skill, kept strictly separate so the world is a pure
function of `RealmState` + `realm.config.ts`:

```
matthewrichter-dev (Next 16 App Router, React 19, Tailwind 4, Vercel)
├── app/
│   ├── page.tsx                      server component: panel HTML + <Realm/> client island
│   ├── api/realm/route.ts            aggregator: betzgames status + GitHub + uptime → RealmState
│   └── realm/                        (M1 only) staging route before promotion to /
├── realm/
│   ├── config/realm.config.ts        holdings, regions, hexes, recipes, links (the map)
│   ├── state/resolve.ts              resolveState(signals, now) — pure, tested
│   ├── state/copy.ts                 status sentence generator — pure, tested
│   ├── world/                        terrain, water, roads, hex plots, seats, scatter, sky
│   ├── folk/                         villager rig + bake, instanced crew, badges, particles
│   ├── camera/                       the Google Earth camera
│   ├── ui/                           card, settings, key handling
│   └── Realm.tsx                     the client component (dynamic import, ssr: false)
├── tools/build-assets.mjs            KayKit raw packs → 3 merged .glb (checked in)
└── public/assets/                    medieval.glb, folk.glb, nature.glb, hero.png, og.png

betzgames (Next 14, Supabase, Vercel Hobby)
└── src/app/api/realm-status/route.ts  public, read-only, edge-cached 60 s (§9.2)
```

Rendering: **three.js directly**, not react-three-fiber. The instancing, baked skinning,
shader swatch repaint and custom camera are all easier to reason about at the three level,
and Bot Crossing's reference code is written that way. React owns the panel, card and
settings; three owns the canvas; they talk through a small store (zustand or a plain
event emitter) carrying `RealmState`, selection and settings.

Data flow: the browser fetches `/api/realm` on load and every 60 s. That route is a Next
route handler with `revalidate = 60`, so concurrent viewers share one upstream fetch.
Upstream: `betzgames.com/api/realm-status` (itself edge-cached 60 s), GitHub (cached
600 s via `next: { revalidate: 600 }`), uptime `HEAD`s (parallel, 5 s timeout).

Secrets: `GITHUB_REALM_TOKEN` (fine-grained PAT, contents:read on the listed repos) and
optionally `VERCEL_REALM_TOKEN`, both server-only on matthewrichter.dev. betzgames'
status route needs **no secret** and exposes **no personal data** (§9.2).

---

## 9. Data Model & API Contracts

### 9.1 `RealmState` (served by matthewrichter.dev `/api/realm`)

```ts
type HoldingState =
  | "blighted" | "besieged" | "mustering" | "feasting"
  | "building" | "quiet" | "dormant";

interface HoldingSignals {
  live?: { kind: "golf_round" | "wc_match" | "cfb_game" | "draft"; detail: string };
  upcoming?: { kind: string; at: string; detail: string };         // ISO time
  settled?: { kind: string; at: string; detail: string };
  lastCommitAt?: string;
  commits7d?: number;
  lastDeployAt?: string;
  reachable?: boolean;                                            // undefined = not pinged
}

interface HoldingStatus {
  id: string;                 // matches realm.config.ts
  state: HoldingState;
  statusLine: string;         // the plain-words sentence for the card
  signals: HoldingSignals;
}

interface RealmState {
  generatedAt: string;
  season: "cfb" | "golf" | "worldcup" | "winter" | "none";
  holdings: HoldingStatus[];
}
```

`resolveState` and the sentence generator are pure functions with vitest coverage
(§14). Time is always passed in, never read from `Date.now()` inside them.

### 9.2 betzgames `GET /api/realm-status`

Public, unauthenticated, read-only. Response headers:
`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`. Uses
`createServiceRoleClient()` for a handful of indexed reads and **never touches
`draft_sessions.snake_order`** (the known Disk-IO hog). If any query fails, that
section is `null`; the route never 500s.

```ts
interface RealmStatusResponse {
  generatedAt: string;
  golf: {
    status: "upcoming" | "active" | "complete" | null;   // tournaments.status of the current one
    tournamentName: string | null;
    draftActive: boolean;                                 // draft_sessions.status === "active"
    roundLive: boolean;                                   // live_leaderboard updated in last 15 min AND field started
    ownerCount: number;                                   // count only, no names
    lastSettledAt: string | null;                         // most recent tournament complete
  } | null;
  cfb: {
    weekNumber: number | null;
    weekStatus: "draft" | "published" | "graded" | null;
    gamesInProgress: number;                              // competition_participants.status === "in_progress"
    nextKickoffAt: string | null;
    gradedAt: string | null;
  } | null;
  wc: {
    competitionStatus: "upcoming" | "active" | "complete" | null;
    matchesLive: number;                                  // status === "in"
    nextMatchAt: string | null;
    lastFinalAt: string | null;
    entryCount: number;
  } | null;
  games: { slug: string; isActive: boolean }[];          // from games table
}
```

Rules: counts and statuses only. No profile names, emails, phone numbers, money amounts,
picks or rosters. This is the one betzgames change the project needs; it ships first
(M0) and is tested with vitest against fixture rows like the cfb scoring engine is.

### 9.3 `realm.config.ts` (static)

```ts
interface Holding {
  id: string;                         // "fairway-keep"
  house: string;                      // "House Fairway"
  seat: string;                       // "Fairway Keep"
  words?: string;                     // house motto, tooltip only
  sigil: { glyph: string; primary: string; secondary: string };
  region: "heartlands" | "betzmarch" | "harbour" | "downs";
  hexes: [q: number, r: number][];    // root first
  tier: 1 | 2 | 3;
  recipe: string;                     // seat recipe id
  project: { name: string; description: string; stack: string[] };
  links: { visit: string; repo?: string };
  signals: { betz?: "golf" | "cfb" | "wc" | "mahjong"; github?: string /* owner/repo */; ping?: string };
}
```

---

## 10. Assets & Art Pipeline

All art is CC0 from **Kay Lousberg (KayKit)**, credited in the footer and the repo
README even though CC0 asks for nothing:

| Pack | Used for |
|---|---|
| KayKit Medieval Hexagon Pack | Every terrain hex, roads, rivers, coast |
| KayKit Medieval Builder Pack | Keeps, halls, houses, walls, towers, market stalls, tents, scaffolding |
| KayKit Adventurers (+ Skeletons for the Blighted state's ravens' company, optional) | Villager bodies |
| KayKit Character Animations | The clip set (Idle, Walk, Run, Hammering, Waving, Cheering, Sit, Hit) |
| KayKit Forest Nature Pack | Trees, bushes, rocks, grass |

`npm run assets` runs `tools/build-assets.mjs` (gltf-transform): merge each pack's
single-model files into one document with one material and one atlas texture, keep only
the models the recipes reference, and for the crew **retarget every animation channel
onto one skeleton** (the five-skeletons-named-`hips` trap from Bot Crossing). Raw packs
go in `assets-src/` (gitignored); the built `.glb`s are checked in.

Lessons carried over from Bot Crossing that apply on day one:
- Tilt the sun off zenith (~54° at noon) or every flat wall goes black.
- Closed kit solids render `FrontSide` only; stacked boxes share planes and flicker
  double-sided. Open procedural shells (bowls, bells) go double-sided with `BackSide`
  shadows.
- Hex cap UVs are a disc; reproject deck tops from world XZ.
- Badges and labels hold screen size, so author them for the closest zoom (128×256 glyph
  cells, 4× plates) and let mipmaps carry the far end.
- Bake the crew once into a bone-matrix texture; the 40th villager costs one float.
- The sky shader **is** the environment map (PMREM from a second sky dome), regenerated
  only when the sun moves.

---

## 11. Performance Budget

Measured on a 2021 MacBook Air (M1), Chrome, native retina resolution, Ultra preset:

| Metric | Budget |
|---|---|
| Frame time at rest | ≤ 12 ms (steady 60 fps with headroom) |
| Draw calls, full realm | ≤ 120 |
| Time to first terrain + seats visible | ≤ 2.5 s on a 50 Mbps connection |
| Time to villagers walking | ≤ 4 s |
| Total asset weight (3 glb + textures) | ≤ 6 MB gzipped |
| `/api/realm` p95 | ≤ 800 ms cold, ≤ 50 ms cached |
| betzgames `/api/realm-status` DB work | ≤ 6 indexed queries, ≤ 20 ms, once per 60 s realm-wide |
| Main-thread allocation during play | Zero per frame (typed arrays, swap-remove particles) |

Adaptive quality scales render scale under the chosen preset one step per second, floor
at half native. HDR off disposes float targets.

---

## 12. Decision Log

Settled on 2026-09-04. Do not reopen without a reason that isn't taste.

1. **Live + static, static first.** M1 ships a fully static realm; M2 wires the signals.
2. **3D in three.js.** Not a 2D parchment map. Mobile support is explicitly dropped to
   afford this.
3. **No mobile.** Desktop and laptop browsers only. Narrow viewports get the HTML panel
   and a hero image.
4. **Original lore only.** Realm name Aldenmoor, ruling House Alden, house and holding
   names as in §5.2. No third-party fantasy IP.
5. **It is the homepage.** Built at `/realm` for M1, promoted to `/` at M2. The current
   portfolio's content moves into Hearthkeep's card and the panel.
6. **Recruiter-safe tone.** Real names and descriptions in the panel and cards; lore in
   labels, banners, tooltips.
7. **Hover, click, day/night, seasons.** No walkable player character, no quests.
8. **betzgames exposes `/api/realm-status`.** Public, read-only, counts and statuses only,
   edge-cached 60 s, no `snake_order` reads, no new crons.
9. **Authored layout, not sticky layout.** Holdings have fixed hex coordinates in config.
10. **Raw three.js, not react-three-fiber.** React owns the chrome; three owns the canvas.
11. **All seven signals resolve through one strict precedence** (§6.1). A holding is never
    in two states.

---

## 13. Milestones

### M0 — Signals from betzgames (½ day)
- `src/app/api/realm-status/route.ts` per §9.2, with a pure `buildRealmStatus(rows, now)`
  under `src/lib/realm/` and vitest fixtures for: no active tournament, draft active, round
  live, CFB week published with a game in progress, WC match live, all-null fallbacks.
- Verify against production: `curl -s https://betzgames.com/api/realm-status | jq` while a
  CFB week is published. Confirm `Cache-Control` header. Confirm zero rows from
  `draft_sessions` in the query plan.

### M1 — The static realm (1–2 weekends)
- Asset pipeline and the three merged `.glb`s.
- Terrain, water, roads, regions, seasons dressing (static for now).
- `realm.config.ts` with all nine holdings and seat recipes.
- Google Earth camera, intro flyover, keys.
- Server-rendered panel, the card, Visit/Code/Resume links.
- Quality presets and adaptive governor. Hit the §11 budget.
- Ships at `matthewrichter.dev/realm`. No-WebGL fallback in place.

### M2 — The living realm (1 weekend)
- `/api/realm` aggregator: betzgames status + GitHub commits + uptime pings, `revalidate 60`.
- `resolveState` + `copy.ts`, fully tested.
- Villagers: baked crew, instancing, A* + collision, state → clip mapping, badges,
  banners, torches, scaffolding, ivy/mist, smoke/ravens.
- Day/night from the clock, `L` to scrub. Feasting fireworks at night.
- Promote `/realm` to `/`. Old homepage content lives in Hearthkeep.

### M3 — Polish (as time allows)
- Real-calendar seasons switching dressing automatically.
- Optional ambient sound toggle (off by default).
- Screenshot key, OG image, KayKit credits in footer and README.
- "Last deployed" from the Vercel API.
- Villager idle flourishes: the Countinghouse clerk counting coins, the Tile Hall's
  players at a table, a golfer swinging on the headland.

---

## 14. Testing

- **vitest** (both repos):
  - betzgames `buildRealmStatus(rows, now)`: every branch in §9.2, plus each section
    independently `null` on query failure.
  - matthewrichter-dev `resolveState(signals, now)`: a table test covering every row of
    §6.1 and every pair of competing signals (e.g. live + unreachable → blighted;
    settled 47 h ago + commits → feasting; settled 49 h ago + commits → building).
  - `statusLine(state, signals)`: snapshot the sentences.
  - Season resolution from a date.
- **Playwright** (desktop Chromium, pre-installed): page loads, panel HTML contains every
  project name and the resume link before hydration, canvas mounts, clicking a panel row
  selects a holding and shows its card with a Visit link, `/api/realm` returns a valid
  `RealmState` with a mocked upstream.
- **Manual before promotion to `/`:** the §11 budget on the M1 Air; Safari; a no-WebGL
  run (`--disable-gpu`); Lighthouse desktop ≥ 90 on Performance, Accessibility, SEO.

Note for betzgames: golf and WC scoring have no tests today. `/api/realm-status` reads
their tables but must not change them; the vitest fixtures are the guard.

---

## 15. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Added load on the betzgames Supabase project (Disk IO already flagged in `IMPROVEMENTS.md`) | One edge-cached route, ≤ 6 indexed reads per 60 s regardless of viewer count, no JSONB blob reads. Measure in Supabase Reports after M0. |
| GitHub PAT leaks or expires | Server-only env var, fine-grained, contents:read on listed repos only, 1-year expiry with a calendar reminder. Route degrades to "commits unknown" (Quiet). |
| Uptime pings mark a holding Blighted on a transient blip | Two consecutive failures required; the card says "unreachable for N minutes," never "down." |
| Asset weight blows the budget | Pack only referenced models (Bot Crossing packed 16 of 105 forest models); per-instance scale and tint for variety. |
| Fantasy-IP resemblance | Original names checked at authoring; no Tolkien/Martin fonts or phrases; sigils are simple geometric glyphs. |
| Scope creep into a game | Decision 7. Anything a viewer can *do* beyond look, hover, click and fly is out. |
| Vercel Hobby limits on either project | No new crons. Everything is request-driven with ISR caching. |
| WC route is production-hot through July 2026 | The realm-status route is read-only and touches `wc_*` tables via plain selects. Follow `.claude/skills/wc-ops` before merging M0 if the tournament is still live; as of this writing it is over. |

---

## 16. Open Items

- Confirm the live URLs for **milympics** and **lisa-richter-portfolio** and a one-line
  description of milympics (assumed: a friends/family olympics scoreboard) so the
  Millfield Games card is accurate.
- Confirm whether dou-dizhu and mahjong-consulting repos should show a **Code** button
  (they are private; default is no button).
- Pick the resume PDF path for Hearthkeep and which contact links to show.
- Decide whether the Painted Hall links out to Lisa's site directly or shows a short
  card first (default: card, then Visit).
- Check `matthewrichter.dev` deploy: the repo README points at `matthewrichter-dev.vercel.app`;
  confirm the custom domain is attached before promoting `/realm` to `/`.
