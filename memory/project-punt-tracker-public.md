---
name: project-punt-tracker-public
description: "Punt tracker has been spun out into its own standalone product at github.com/suspicious-cow/punt-tracker, live at suspicious-cow.github.io/punt-tracker/. Recruiting site (riley-summer-work) now links to it as 'try the tool I built' and reads its localStorage. Two distinct products from 2026-06-02 onward."
metadata: 
  node_type: memory
  type: project
  originSessionId: a24eb961-c795-444a-b7f5-2d47cae5170a
---

**Date of split:** 2026-06-02 (still the same calendar day as the original tracker sprint — see [[project-tracker-sprint-state]]).

**Also shipped same day after the split:** always-visible LOS yard stepper buttons (commit `c12c900`). Native `<input type="number">` spinners are hover/focus-only in most browsers, so we built custom stacked ▲/▼ buttons attached to the right of the LOS input. CSS hides native spinners cross-browser. SW cache bumped to `punt-tracker-v2`.

**Next phase (starts 2026-06-03):** multi-user backend via Supabase. See [[project-tracker-multiuser-plan]] for the full plan. The single-user localStorage-only architecture documented below is the CURRENT state; it changes as Phase 1-2 of the multi-user plan land.

**Why Riley split it:** he wanted the tracker to be a real product other punters could use, while keeping his recruiting site as his personal page. His exact words: "id love to make the tracker its own app for other people but id like to keep my home page for my stuff."

## The two products now

| Product | Repo | URL |
|---|---|---|
| Recruiting site (personal) | `suspicious-cow/riley-summer-work` | `suspicious-cow.github.io/riley-summer-work/` |
| Punt tracker (public) | `suspicious-cow/punt-tracker` | `suspicious-cow.github.io/punt-tracker/` |

Both are GitHub Pages project sites under the same user, so they **share the `suspicious-cow.github.io` origin** — which is the load-bearing fact for the live-stats integration.

## Same-origin localStorage trick

Because the two sites share origin, the recruiting site's `public-stats.js` can read the tracker's localStorage directly in Riley's browser. No backend, no auto-publish, no cross-origin pain. The stats card on the recruiting site shows live data when viewed in any browser where Riley has logged kicks at the new tracker URL; coaches and strangers see hardcoded fallback numbers (or whatever's in `public-stats.json` if that ever gets authored).

## Storage key rename + migration

- Old keys (used by `/training/` in riley-summer-work and Riley's existing iPhone PWA install): `riley-punt-tracker-kicks-v1`, `riley-punt-tracker-sessions-v1`.
- New keys (used by the public tracker): `punt-tracker-kicks-v1`, `punt-tracker-sessions-v1`.
- `storage.js` in the new repo runs `migrateLegacyKeys()` on load: if new keys are empty AND legacy keys exist (same origin), it copies legacy → new. Idempotent and lossless. Riley's existing data follows him automatically the first time he opens the new URL on each browser.
- `public-stats.js` on the recruiting site reads new keys first, falls back to legacy. So the live stats card keeps working before AND after Riley does the new-app migration.

## What changed in each repo

**punt-tracker (new repo):**
- Files at repo root (no `/training/` subpath).
- All "Riley" branding stripped: page title is just "Punt Tracker", footer says "Open source · View on GitHub", manifest name is "Punt Tracker", SW cache name is `punt-tracker-v1`.
- Storage keys renamed + legacy migration added (above).
- Backup filename was already generic (`punt-tracker-backup-DATE.json`) — no change.

**riley-summer-work (recruiting site):**
- `index.html` training-link card: button now reads "Try the Punt Tracker →", target is the absolute URL `https://suspicious-cow.github.io/punt-tracker/`, opens in new tab. Paragraph re-framed as "I built a tracker; the stats above come from my log."
- `public-stats.js`: reads new keys first, legacy as fallback.
- `/training/` directory **was NOT deleted** in this change. Riley's existing iPhone PWA install still points there. Cleanup is a future decision.

## State of the OLD /training/ install

- Still in `riley-summer-work` repo, still served at `suspicious-cow.github.io/riley-summer-work/training/`.
- Riley's iPhone PWA from yesterday is still pointed at this URL.
- Going forward Riley should use the NEW URL for logging. If he logs in both, data diverges (each writes to its own key namespace and the migration only fires when the new keys are empty).
- Riley should: open new URL on iPhone → Safari share → Add to Home Screen → delete the old `/training/` PWA icon.
- The `/training/` directory in `riley-summer-work` can be deleted from the repo at some point — but only AFTER Riley has confirmed he's fully migrated. Don't do this proactively.

## Locked decisions (don't relitigate)

- **Both products stay under the `suspicious-cow.github.io` origin.** This is what makes the live-stats integration work without a backend. A custom domain or different GitHub org would break it.
- **Tracker is generic; recruiting site is Riley's.** The tracker repo has zero Riley/Conroe/jersey-number references. The recruiting site keeps all of that.
- **One canonical tracker URL.** Riley uses the new URL going forward. The old `/training/` install is being phased out, not maintained in parallel.
- **No backend.** Same architecture as before: localStorage only, JSON export/import for cross-device. The public tracker doesn't need accounts because each user's data is per-browser. Other punters who install it get their own private logs.

## How to apply

- Any future work on the tracker app itself goes in the `punt-tracker` repo at `C:\Users\Zain_\Downloads\punt-tracker`. The `riley-summer-work\training\` copy is legacy.
- Any tracker feature change that touches localStorage keys also needs an update in `public-stats.js` on the recruiting site (and possibly the legacy fallback handling).
- Any tracker feature change that touches the SW app shell needs `CACHE_NAME` bumped in `sw.js`. Currently `punt-tracker-v1`.
- For the recruiting site, only Riley-specific content lives there now. The training-log card is a teaser/link, not a copy of the app.
- Related: [[project-tracker-sprint-state]] [[project-tracker-plan]] [[riley-summer-project]]
