---
name: project-tracker-day-1
description: "Punt tracker Sprint Day 1 (2026-06-02). Built a much richer v1+ than planned — field picker, drag-and-drop football, edit/delete, 9 lateral zones, auto-derived result/distance. Live, deployed."
metadata: 
  node_type: memory
  type: project
  originSessionId: a24eb961-c795-444a-b7f5-2d47cae5170a
---

**Sprint Day 1: 2026-06-02.** Riley built the bulk of the punt tracker's capture experience in a single session — way past the planned v1 ("just a single form").

**Live URL:** https://suspicious-cow.github.io/riley-summer-work/training/
**Recruiting site (with Training Log link):** https://suspicious-cow.github.io/riley-summer-work/
**Latest commit:** `e3b000a` "feat: punt tracker v2 — interactive field picker..."

## What shipped today

- **`/training/` subpath** in the same repo. Static HTML/CSS/JS, no build step, deployed via GitHub Pages.
- **Form fields:** hangtime (typed), LOS (Own/Opp toggle + yard number), landing position (dragged football on SVG field), notes. Distance and result are derived, not typed.
- **SVG football field:** 100-yard field + 10-yard end zones, yard lines every 5, individual-yard hash ticks on both hash rows AND both sidelines, painted yard numbers in two rows near the sidelines. HS hash spacing (17.8 yd from each sideline).
- **Football icon:** brown ellipse + white stripe + 4 white laces. Defaults to LOS position (dimmed). Tracks the LOS until first drag. Once dragged: fully opaque, trajectory arrow appears from the punter (15 yd behind LOS) to the landing point. Draggable with pointer events; invisible 6-unit touch target for easy grabbing.
- **Auto-derived result:**
  - In opp end zone → Touchback
  - On opp 20 or closer (not end zone) → Inside 20
  - Otherwise → Normal
- **9 lateral zones** (punter's-eye view, top-to-bottom in the SVG):
  1. left outside hash
  2. left numbers
  3. between numbers and left hash
  4. left hash (narrow band at the top hash row, ~1.4 units tall = half football height)
  5. middle (between the two hash rows)
  6. right hash (narrow band at the bottom hash row)
  7. between numbers and right hash
  8. right numbers
  9. right outside hash
- **Stats sidebar (desktop):** Best Punt (max distance + hangtime + date), Best Daily Average, Inside 20 vs Touchback counts (green/red).
- **Edit / delete** on every kick row. Edit reloads the saved position into the field picker; Update Kick overwrites; Cancel exits.
- **Two-column layout** on desktop (stats sidebar on left, form on right). Stacks on mobile.
- **Recruiting site nav:** new "Training Log" card on the recruiting site links to the tracker.

## Files (in `/training/`)

- `index.html` — layout, form structure, full SVG field markup
- `tracker.css` — all styling including field, football, picker zones, stats sidebar, two-column layout
- `tracker.js` — main app: form handler, list rendering, edit/delete, stats glue
- `storage.js` — localStorage wrapper: `getAllKicks`, `saveKick`, `updateKick`, `deleteKick`
- `stats.js` — pure functions: `bestKick`, `bestDailyAverage`, `touchbackCounts`
- `field.js` — field picker module: SVG interaction, drag, zone classification, position → yard math, result derivation

## Key technical decisions baked in

- **Single source of truth for distance and result:** both come from the field picker. No typed-distance field, no result radio buttons. The field IS the input.
- **localStorage data shape:** kicks have `{id, date, timestamp, distance, hangtime, result, notes, position}` where `position = {los: {yard, side}, landing: {yard, side, hash, inEndZone, x, y}, distance, result}`. Raw x/y are stored so edit mode can restore exact football placement.
- **landingTouched flag:** tracks whether the user has actually placed the football, vs the football just sitting at its LOS default. Save requires landingTouched=true.
- **SVG visibility:** `setSvgVisible(el, visible)` helper toggles the `display="none"` attribute. The HTML `hidden` attribute doesn't reliably work on SVG elements across browsers, so we use SVG's native display attribute.
- **Football-icon drag pattern:** invisible larger circle (`landing-touch`, r=6) on top of the visible football for an easy hit target. Pointer events on the touch target; the football itself has `pointer-events: none`.

## Riley's locked preferences (don't relitigate)

- **Real football terminology** matters to him. Zones must use the right names:
  - "left hash" and "right hash" = the actual hash MARK rows (narrow bands)
  - "outside hash" = narrow band against the sideline
  - "between numbers and left/right hash" = the gap between the painted numbers and the hash row
  - "middle" = the area between the two hash rows
- **Numbers zone** is tight (~3 units, matching the painted-number height), NOT the whole half of the field.
- **Field representation must look real** — proper hash marks, sideline ticks, two rows of yard numbers, neutral end zones, no team labels.
- **15-yard punter offset** — the trajectory arrow originates from where the punter actually stands (15 yd behind LOS), not from the LOS line itself.
- **Drag-and-drop > tap-to-place.** The football is always visible at a default, drag it to where it landed.
- **No team labels in the end zones.** No "YOU"/"OPP".

## What's still in the plan but NOT done

The original 3-week sprint plan (see [[project-tracker-plan]]) had us at "v1: single-form logger" today. We blew past that. Still to come (sprint days 2-15):

- **Sessions concept** (Day 3 of plan): group kicks by date, "Start/Finish Session" flow, session summary card.
- **Tap-tap hangtime stopwatch** (Day 4): right now Riley types hangtime; the stopwatch would let him tap at foot-meets-ball + tap at landing.
- **Vitest setup + first /code-review pass** (Day 5).
- **Chart.js trends** (Days 6-7): distance/hangtime over time, personal-best detection, consistency chart.
- **Python data analysis** (Day 10): pandas reads CSV export, generates weekly report. Uses conda env `riley-summer-work`.
- **PWA conversion** (Days 11-13): manifest, service worker, CSV export, shareable session URLs.
- **Cross-app integration** (Day 14): tracker writes `public-stats.json`, recruiting site Training card reads it.

## Outstanding state

- **Stashed:** the Aug 20 vs Lake Creek schedule edit from Day 1 of the summer is still in `git stash` ("schedule section: Aug 20 vs Lake Creek (unverified, pending coach confirm)"). Riley said "dont even worry about gamedays right now" — leave it stashed.
- **Background HTTP server:** stopped (was running on port 8765 via conda env `riley-summer-work`).
- **Browser tool:** the MCP Chrome connector is connected to "Browser 1" on this Windows machine (deviceId `2abc0dd0-a453-4738-9892-135a86f2c73f`, isLocal). Riley confirmed this is the right one.

## How to apply

- Next session: pick up the planned arc. **Sessions + hangtime stopwatch (sprint days 3-4)** are the natural next chunk. Sessions group kicks by day, then the stopwatch replaces typed hangtime.
- Riley iterates on the capture UX **constantly**. Expect more refinements to the field picker (zone boundaries, visual polish, new derived stats) as he uses it in real practice. Treat each refinement as a small commit.
- Run local preview via `conda run -n riley-summer-work --no-capture-output python -m http.server 8765` then open `http://localhost:8765/training/`. Riley confirms changes locally before each commit.
- Continue inline-code formatting for all Riley-facing lines (see [[feedback-formatting-for-riley]]).
- Related: [[project-tracker-plan]] [[project-day-1-recap]] [[riley-summer-project]]
