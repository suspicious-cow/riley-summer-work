---
name: project-tracker-critique-day6
description: 2026-06-05 — 5-reviewer critique of punt-tracker app done; agreed fix list and open decisions for next session.
metadata: 
  node_type: memory
  type: project
  originSessionId: a24eb961-c795-444a-b7f5-2d47cae5170a
---

# Punt Tracker — 5-reviewer critique (2026-06-05)

End of Day 6 (Sprint Day 6). Riley asked for outside critique of the tracker (https://suspicious-cow.github.io/punt-tracker/) after Phase 9b shipped. Five agents independently reviewed: HS punter peer, HS coach, mobile-UX designer, product PM, sports data scientist.

**Why:** Before Riley starts the next phase, he wanted to hear what's broken/missing from perspectives other than his and mine. He explicitly chose tracker (not recruiting site) as the target.

**How to apply:** When Riley returns tomorrow, lead with the Top 5 fix list below in this order. Don't restart from scratch — the synthesis is done.

## What all 5 reviewers converged on

1. **Sign-up wall is the biggest funnel killer.** Email confirm + role + position picker before first kick. Product PM estimates 50-70% bounce. Anonymous mode infrastructure already exists (`setAuthState(null)` UI works, migration modal handles sign-up-later).
2. **Drag-and-drop field is the differentiator AND the bottleneck on the field.** Tap target r=6 in SVG → ~36px diameter on phone (Apple wants 44+).
3. **App is a charting app, not yet an analytics app.** No screen says "do X next."

## Top 5 fixes (priority order, ship in this order)

1. **Anonymous-first onboarding** (1-2 hr) — "Just log a kick (no account)" button on login. Banner offers to save by signing up. Migration modal already exists.
2. **Scroll stopwatch into view after Save + drop hangtime auto-focus** (5 min) — `tracker.js:692`, `kicker.js:389`. Replace `hangtimeInput.focus()` with `document.getElementById('stopwatch-btn').scrollIntoView({behavior:'smooth',block:'center'})`. Same in kicker.js.
3. **Sticky LOS between kicks** (30 min) — `tracker.js:689`. Snapshot `fieldState.losSide/losYard` before `form.reset()`, restore after. Pattern already exists for kicker mode sticky kick type at `kicker.js:243-245`.
4. **Bump landing tap target r=6 → r=10** (2 min) — `index.html:559` (punter) and `index.html:390` (kickoff). ~60px diameter.
5. **Per-player trend sparkline on coach card** (1-2 hr) — `coach.js`. Chart code already exists in `charts.js`. Coach view today is leaderboard-only; sparkline turns "who's improving?" from impossible to 5-second glance.

#2+#3+#4 combined are under an hour and cut realistic logging time roughly in half.

## Open decisions (don't unilaterally implement — Riley needs to weigh in)

- **In-practice vs post-practice positioning.** Peer's deepest point: this is shaped like a post-practice review tool but priced like during-practice. Two valid paths: (a) build "Quick Log" mode (3 taps + Save, hide conditions/notes/field), or (b) explicitly reposition as the locker-room/after-practice tool. Different roadmaps.
- **Conditions analysis math fixes.** Data scientist: gate `n ≥ 10` per bucket, kill "best bucket" highlight at small N, show "need more data" state. ~60 lines in `conditions-analysis.js`. Right now it misleads — highlights "best" with n=1.
- **Hang-per-yard ratio (HYR)** = `hangtime / (distance / 10)`. Single biggest insight unlock available. Below 0.9 = outkicking coverage; above 1.1 = weapon. One line in `stats.js`.
- **"Hide from team" toggle disagreement.** Peer loved it ("clever teenage psychology"). Data scientist warned it's a self-deception trap. Compromise: personal stats always include hidden kicks; only team aggregates respect the flag.
- **Kickoff inside Kicker mode.** Product PM wants to cut — kickoff is mechanically a punt with a fixed LOS. Could simplify by routing kickoffs through Punter mode (or renaming modes "Distance" vs "Accuracy"). Riley shipped kickoff yesterday — emotional cost to cut. His call.

## What's already solid (don't break)

- Field SVG drag-and-drop — every reviewer called it the wow moment
- Session-as-first-class object + conditions on session (not on kick)
- Realtime coach sync + tamper-locked `kicked_at` timestamps
- PWA + offline shell + sync-queue
- Stopwatch button (72px, single-purpose, color-coded states)
- Schema is clean enough that analytics is "one weekend away" (data scientist's words)

## Other findings worth a look later (not in top 5)

- Stale `training/` folder in **recruiting-site repo** (`riley-summer-work`) — UX flagged. Old single-user tracker, never deleted after spin-out. `git rm -r training/`. (Note: this is the recruiting-site repo, NOT the punt-tracker repo.)
- PWA install prompt missing — manifest is correct but no in-app `beforeinstallprompt` handler. Riley's PWA is invisible-to-install for most users.
- Stopwatch fat-finger guards — `stopwatch.js:47-52` should reject `elapsed < 0.5 || elapsed > 12` instead of silently logging.
- Edit/delete buttons in kick list are 32×32px (`tracker.css:761-762`) — below 44pt minimum.
- `tension: 0.3` on the trend charts (`charts.js:32`) smooths between session points and visually invents trends. Use `tension: 0`.
- Yard-number SVG text at 55% opacity / 3.5px (`tracker.css:514`) disappears in sun.

## Related memory

- [[project-tracker-sprint-state]] — current build state before this critique
- [[project-tracker-multiuser-plan]] — Phase 9b just shipped (kicker mode polish)
- [[project-punt-tracker-public]] — repo split + URL structure
- [[feedback-formatting-for-riley]] — format for any reply to Riley about this

## Day 6 status

No code changes today. Critique-only day. Riley signed off after the synthesis with "save and commit what you need to memory and ill be done for today" — meaning **don't start implementing yet**. Next session: confirm priority order with Riley, then start on #1 (anonymous-first onboarding) unless he redirects.
