---
name: project-day-1-recap
description: "Day 1 progress recap — recruiting site went from zero to live + deployed on GitHub Pages. State for tomorrow's pickup."
metadata: 
  node_type: memory
  type: project
  originSessionId: a24eb961-c795-444a-b7f5-2d47cae5170a
---

**Day 1: 2026-06-01.** Riley built and deployed v1 of his personal recruiting site.

**Live URL:** https://suspicious-cow.github.io/riley-summer-work/
**Repo:** https://github.com/suspicious-cow/riley-summer-work (PUBLIC)
**Local path:** C:\Users\Zain_\Downloads\riley-summer-work

**Stack:** plain HTML + CSS, no build step, hosted on GitHub Pages. Python http.server (in conda env `riley-summer-work`) used for local preview.

**Sections shipped on the live site:**
- Hero (name, class, position, school, HT/WT/foot/GPA, photo from Hudl)
- Process Over Hype (personal pitch paragraph)
- 2026 Spring Training (4 stats with target/PR context tags, black-bar compact card)
- Highlight Reel (link to Hudl profile)
- Academics (GPA, SAT/ACT status, intended major)
- Contact (Riley email + phone, head coach, special teams coach)

**Commits:** 8 (last pushed: 0456d37 "feat: add hero photo").

**UNCOMMITTED local changes pending tomorrow:**
- index.html and styles.css have an "Upcoming Games · 2026 Season" section added (between Highlight Reel and Academics), showing one game: Aug 20 vs Lake Creek (away, 7:00 PM).
- I pulled this from MaxPreps via WebFetch but it's single-source and unverified. The auto-mode classifier rightly blocked the push.
- **Before pushing tomorrow: Riley must confirm with his coach that Conroe opens 2026 against Lake Creek on Aug 20.** If confirmed, commit + push the existing local changes. If wrong, edit the section to match reality (or revert with `git checkout -- index.html styles.css`).

**Open items (Riley's call which to do next):**
1. ~~Start v1 of the punt training tracker~~ — DONE 2026-06-02, see [[project-tracker-day-1]] for recap. Way more than v1 shipped.
2. ~~Verify + push the schedule section~~ — Riley said "dont even worry about gamedays right now" 2026-06-02. The local edits are stashed in git (not committed). Pick this back up if/when he gets coach confirmation.
3. Custom domain (~$12/yr) — current URL has dad's GH username which feels off for coach emails
4. Swap action shot for a cleaner headshot
5. Add more schedule games as coaches release them
6. Add coach contact details (emails/phone) once Riley has them

**Why:** Riley's the driver. Future sessions should ask which item he wants and let him direct in his own words. Avoid passive multiple-choice when possible.

**How to apply:**
- When tomorrow's session opens, summarize this state briefly and ask Riley which open item he wants to tackle first.
- Continue using inline-code formatting for all lines directed at Riley (see [[feedback-formatting-for-riley]]).
- Keep Python work in the `riley-summer-work` conda env (see [[feedback-python-conda]]).
- No games; serious tools only (see [[feedback-no-games]]).
