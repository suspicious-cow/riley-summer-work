---
name: project-tracker-plan
description: "Project #2 for Riley's summer — punt training tracker app. Approved by Zain 2026-06-02. Replaces 'add more cards to the static site' as the real summer build."
metadata: 
  node_type: memory
  type: project
  originSessionId: a24eb961-c795-444a-b7f5-2d47cae5170a
---

**Project #2: Punt Training Tracker.** A mobile-first web app Riley uses on the practice field to log every kick (distance, hangtime, ball type, drop quality, direction, conditions), see trends, and turn a summer of disciplined logging into a documented improvement curve. Auto-publishes summary data to the recruiting site's Training card (per-session privacy toggle).

**Why:** The static recruiting site's coding ceiling is too low (markup, not software) and its recruiting weight is low (coaches discover specialists via camps/rankings, not personal sites). The tracker hits both goals — Riley genuinely improves as a punter via reflection, AND learns real JS / data modeling / persistence / charts / PWA / cross-app integration. Recruiting story becomes "here's the tool I built to track my summer" — second-order signal of discipline, not headline.

**Full plan file:** `C:\Users\Zain_\.claude\plans\merry-roaming-tulip.md` (read this first if planning further work)

## Design calls baked in (approved by Zain)
- **Same repo** as recruiting site: `riley-summer-work`, new subpath `/training/` (confirmed 2026-06-02)
- **v6 cross-app integration is in scope** — tracker auto-publishes to the recruiting site's Training card (confirmed 2026-06-02)
- **Budget: 3-week intensive sprint at 7 hrs/day** (confirmed 2026-06-02). ~15 work days × 7 hrs = ~105 hrs of build time, with ~40 hr buffer if pushing weekends. Then Riley USES the tool through the rest of summer practice — that's where the punter-improvement value lives. The build is a sprint, not a marathon.
- **Vibe: job-like with structured free-work** (confirmed 2026-06-02). Set hours, daily standup, weekly Friday demos to Zain, real deliverables. But Riley owns HOW he solves problems and picks the v7 stretch goal himself. Code review as a daily practice.
- **Vanilla JS + CDN libraries**, no build step (can revisit at v5 if PWA work demands it)
- **localStorage** for v1–v4; JSON file in repo for v5+ public publishing
- **Phone-first responsive**, desktop works for dev
- **Per-session privacy toggle**, default private — Riley decides what auto-publishes to the recruiting site
- **Conventional commits**, one Claude Code session per feature, deploy on every merge

## Day-by-day sprint plan (15 work days, ~3 calendar weeks)

**Week 1 — Core CRUD + sessions + testing**
- Day 1: v1 part 1 — single-form kick logger, localStorage wrapper, mobile-first CSS
- Day 2: v1 part 2 — today's kicks list, delete, edit, conventional-commits-per-feature
- Day 3: v2 part 1 — sessions data model + refactor + session summary stats
- Day 4: v2 part 2 — tap-tap hangtime stopwatch (requestAnimationFrame)
- Day 5: v2 part 3 — Vitest setup + first real tests + first /code-review pass + Friday demo

**Week 2 — Charts + analysis + Python pivot**
- Day 6: v3 part 1 — Chart.js setup, distance trend chart
- Day 7: v3 part 2 — hangtime chart, personal-best detection, consistency chart
- Day 8: v4 part 1 — direction picker (SVG field diagram), intent-vs-actual
- Day 9: v4 part 2 — wind/weather/surface inputs, conditions analysis view
- Day 10: Python pivot — pandas reads CSV export, generates weekly training report; Friday demo

**Week 3 — PWA + integration + polish**
- Day 11: v5 part 1 — PWA manifest, install to iPhone home screen
- Day 12: v5 part 2 — service worker, offline support
- Day 13: v5 part 3 — CSV export, shareable session URLs
- Day 14: v6 — cross-app integration, recruiting site fetches `public-stats.json`
- Day 15: v7 stretch (Riley picks: video clip / goal tracker / pre-camp PDF) + polish + final demo

**Days 16-21 buffer / weekends:** CV experiment (phone video → hangtime detection), extra polish, additional stretch goals.

**Post-sprint (rest of summer):** Riley LOGS every punt session through the app. One short weekly Claude Code session for bugfixes/small features as gaps emerge. By Aug 20: months of documented data, live tool, real story for coach emails.

## Day 1 concrete scope (first sprint day, when Riley sits down)
1. Create `/training/` directory
2. `training/index.html` — single form: distance, hangtime, notes, Save
3. `training/tracker.css` — mobile-first, big touch targets
4. `training/storage.js` — `saveKick(kick)` / `getAllKicks()`, localStorage-backed
5. `training/tracker.js` — submit handler + render today's kicks below
6. Link from recruiting site nav to `/training/`
7. Commit each file individually (Riley sees the diffs)
8. Push, verify on live URL, Riley uses it at next practice

## Daily rhythm (job-like with structure)
- **Morning standup (15 min):** what's on today, what we learned yesterday
- **Build block 1 (~3 hrs):** main new feature, hard new concept
- **Break / lunch (~1 hr)**
- **Build block 2 (~2.5 hrs):** finish/polish/test, lower-intensity work
- **Wrap (~15 min):** commit, deploy to live URL
- **Friday: weekly demo to Zain** — Riley walks through what shipped that week

## Honest recruiting framing (so Riley isn't misled)
The tracker is NOT what drives specialist recruiting attention. Camps (Kohl's/Sailer/Prokick), verified measurables, game film, and HS coach calls are. The tracker is a second-order signal — attached to cold emails, not the headline. Tell Riley this when he asks "will coaches care?"

## How to apply
- When tomorrow's session opens, Riley's two real options are: (a) verify Lake Creek schedule game with coach then commit/push the existing local edits, (b) start v1 of the tracker. Let him pick.
- v1 is a single Claude Code session of work. Don't pre-build it — Riley needs to drive each step in his own words to learn.
- All design calls above are approved; don't relitigate them unless Riley or Zain raises a concern.
- Keep Python work in conda env `riley-summer-work` (see [[feedback-python-conda]]).
- Continue inline-code formatting for all Riley-facing lines (see [[feedback-formatting-for-riley]]).
- Related: [[project-day-1-recap]] [[riley-summer-project]] [[riley-recruiting-profile]]
