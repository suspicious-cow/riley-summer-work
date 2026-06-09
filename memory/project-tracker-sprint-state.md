---
name: project-tracker-sprint-state
description: "Rolling state of the punt tracker sprint. Through sprint Day 5 (all on 2026-06-02). Read this for current feature set, locked decisions, what's still pending. Supersedes project-tracker-day-1 for current state."
metadata: 
  node_type: memory
  type: project
  originSessionId: a24eb961-c795-444a-b7f5-2d47cae5170a
---

**Sprint pace:** all five "sprint days" so far happened on **2026-06-02** (one calendar day). Riley + Claude are shipping at ~2× the plan's pace.

**Live URLs:**
- Tracker: https://suspicious-cow.github.io/riley-summer-work/training/
- Recruiting site: https://suspicious-cow.github.io/riley-summer-work/
- Repo: https://github.com/suspicious-cow/riley-summer-work (PUBLIC)

**Latest commit:** `60749f3` "feat: export/import backup so data moves between browsers"

## Sprint days recap (all 2026-06-02)

- **Day 1** — see [[project-tracker-day-1]] for full detail. Field picker, SVG football field, 9-zone lateral classification, drag-and-drop football, edit/delete kicks, stats sidebar.
- **Day 2** — Sessions concept (kicks belong to sessions, start/finish session flow), std deviation per session, expandable past sessions with full edit/delete inside, per-kick field summary line (LOS → landing → hash).
- **Day 3** — Tap-tap hangtime stopwatch. `performance.now()` + `requestAnimationFrame`. Big button, three states (idle/running/done), auto-fills the hangtime number input.
- **Day 4** — Two trend charts (Chart.js via CDN, no build step). Distance trend (gold line) + hangtime trend (green line). Each shows finished sessions only. Below the chart: session delete button with confirm. Auto-prune of empty finished sessions (on load and after kick deletion).
- **Day 5** — PB badges (current all-time best only, not historical record chain — Riley insisted), PWA conversion (manifest, service worker, SVG football icon, Apple meta tags so the install hides Safari chrome), Export/Import JSON backup so data moves between browsers.

## Files in `/training/`

- `index.html` — layout, form, session controls, stats sidebar, both chart cards, past sessions, export/import buttons, PWA meta tags, service worker registration
- `tracker.css` — all styling
- `tracker.js` — main app: form, edit/delete, session flow, stats glue, PB tagging, export/import
- `storage.js` — kicks + sessions localStorage wrappers, migration, cleanup of empty finished sessions
- `stats.js` — `bestKick`, `average`, `standardDeviation`, `sessionSummary`, `allTimeStats`, `touchbackCounts`, `computePersonalBests`
- `field.js` — SVG field picker, drag, zone classification, position → yard math, result derivation
- `stopwatch.js` — `setupStopwatch`, performance.now()-based timing
- `charts.js` — `renderDistanceChart`, `renderHangtimeChart`, `renderTrendCharts` (shared config builder)
- `sw.js` — service worker (CACHE_NAME = `riley-tracker-v2`, cache-first with network fallback)
- `manifest.json` — PWA manifest (start_url ./, scope ./, display standalone, theme #1a1a1a)
- `icon.svg` — black square + brown football icon

## Files at repo root

- `public-stats.js` — recruiting-site script that reads tracker localStorage and updates the stats card with LIVE pill. Falls back to fetching `public-stats.json` if no localStorage data (e.g. coach's browser).
- `public-stats.json` — **not currently in repo.** The publish-to-recruiting-site flow was added then removed at Riley's request. Coaches see hardcoded stats in `index.html` until/unless someone writes this file.

## Locked decisions (don't relitigate)

- **PB badges = single current record-holder.** When Riley first saw the historical-chain version, he said "I only want the best kick of all to have the PB record not previous ones." Distance PB (gold) and Hangtime PB (green) badges live on whichever kicks currently hold each record. If one kick holds both, it gets both badges.
- **No publish-to-recruiting-site button.** Riley removed it. Coaches see hardcoded numbers on the recruiting site unless someone manually authors `public-stats.json`.
- **Empty finished sessions auto-delete.** Three layers: on load cleanup, after-last-kick-deleted cleanup, render-time count > 0 filter as safety net.
- **Export/Import is the cross-device data flow.** No backend, no auto-sync. Riley exports JSON on one browser, imports on another. Replace OR Merge (skipping duplicates by id).
- **PWA service worker uses cache-first with version-bump invalidation.** Every deploy that changes the app shell must bump `CACHE_NAME` in `sw.js`. Currently at `riley-tracker-v2`. Otherwise installed PWAs keep serving stale code.
- All earlier locked decisions from [[project-tracker-day-1]] (real football terminology, 15-yard punter offset, drag-and-drop > tap-to-place, etc.) still apply.

## Stats sidebar (current state)

- **Best Punt** — best single kick distance + its hangtime + date
- **All-Time Avg** — average distance across every kick from every session ever (renamed from "Best Session Avg" at Riley's request)
- **Inside 20 vs TB** — split count of inside-20 kicks vs touchbacks

## What's still in the original plan but NOT done

See [[project-tracker-plan]] for the full arc. Remaining:

- **Tests + first /code-review pass** (plan-Day 5) — offered three times, Riley picked visible features each time. Still unblocked when he wants it.
- **Consistency chart** (part of plan-Day 7) — std dev over time as a third trend chart. Std dev is computed per-session already; would just need a third chart card.
- **Conditions inputs** (plan-Day 9) — wind speed, weather, surface (turf/grass/wet) per kick or per session, plus a conditions analysis view ("hangtime drops X in Y wind").
- **Python weekly report** (plan-Day 10) — pandas reads exported CSV, generates "this week vs last" report. Use conda env `riley-summer-work` (see [[feedback-python-conda]]).
- **Full PWA polish** — current SVG icon may look poor on iOS home screen (iOS prefers PNG). If reported, generate proper PNG icons. Service worker strategy is currently cache-first with manual cache-bump; could move to network-first for HTML/JS to auto-update without bumping.
- **Cross-app integration via public-stats.json** (plan-Day 14) — only half done. Recruiting site reader exists in `public-stats.js`. The publisher button was removed. Could be re-added or done as a Claude-Code-side script.
- **Pre-camp PDF report, video clip per kick, goal tracker** (plan-Day 15 stretch goals).

## Outstanding state notes for next session

- **Stashed:** the original Aug 20 vs Lake Creek schedule edit from before the tracker work is still in `git stash` (see [[project-day-1-recap]]). Untouched.
- **Background HTTP server:** running on port 8765 via `conda run -n riley-summer-work --no-capture-output python -m http.server 8765 --directory C:\Users\Zain_\Downloads\riley-summer-work` (task ID was b6hq85o7x). If the session resumes and the port is busy, that's why.
- **Riley's iPhone install:** reinstalled fresh today at the `?v=2` cache-buster URL, sees the latest UI. He has not yet imported his desktop data — said "I'll leave that again." Future-self: when he wants to log practice, walk him through Export on desktop → AirDrop/email file → Import on iPhone.
- **PB badge edge case:** ties go to the first kick encountered (`>` not `>=`). Riley hasn't asked about this.
- **Data drift handled defensively:** the count > 0 render filter and load-time cleanup mean orphan/mismatched data gets surfaced and pruned, not silently dropped. Root cause (if it ever resurfaces) was never traced — could be related to the localStorage clear → re-migrate sequence.

## How to apply

- Next session, ask Riley which item he wants to tackle. Most natural next chunks: tests, conditions inputs, or Python weekly report.
- Keep inline-code formatting for all Riley-facing lines (see [[feedback-formatting-for-riley]]).
- Conda env `riley-summer-work` for any Python work (see [[feedback-python-conda]]).
- No games (see [[feedback-no-games]]).
- Treat each refinement as its own small commit. Riley iterates on UX constantly.
- Related: [[project-tracker-plan]] [[project-tracker-day-1]] [[project-day-1-recap]] [[riley-summer-project]]
