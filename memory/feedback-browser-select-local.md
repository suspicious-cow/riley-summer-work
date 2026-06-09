---
name: feedback-browser-select-local
description: "Hard rule for Chrome MCP work: this Claude Code session usually runs on Zain's machine, so `isLocal:true` means ZAIN'S browser. To drive RILEY's browser, broadcast a pairing prompt and have Riley accept on his end. Never assume the only-local browser is the right one."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a24eb961-c795-444a-b7f5-2d47cae5170a
---

**The trap:** Claude Code in this project runs on Zain's Windows machine (`C:\Users\Zain_\...`). The Chrome MCP's `isLocal: true` flag means "browser on the same machine as Claude" — so the only local browser is **Zain's**, not Riley's. Riley uses a separate machine. An older version of this rule said "always pick the local browser," which has the effect of *always landing on Zain's Chrome* — which is wrong when Riley is the one driving and needs his own signed-in Supabase / GitHub / etc. sessions.

**Why this matters:** Riley flagged it explicitly on 2026-06-04 ("you keep connecting to my dads machine"). Driving Zain's browser instead of Riley's wastes turns, lands on wrong logged-in sessions, and — worse — could accidentally trigger actions on Zain's accounts that Riley didn't intend. Also, when Zain runs the same Claude Code project, the local browser IS the right one, so the rule has to be situation-aware.

**How to apply (decision tree):**

1. At the start of any Chrome MCP work, call `list_connected_browsers` first.
2. **If exactly one browser appears and `isLocal: true`:**
   - Check whether the current session is being driven by Riley or by Zain. Riley's messages are usually casual, lower-case, often misspelled; Zain's are direct and technical. The project's `riley-user.md` memory says Riley is the primary user for the summer projects. If unclear, ASK before selecting.
   - If Riley is driving: that local browser is Zain's. STOP and offer the pairing-broadcast path (step 4).
   - If Zain is driving: the local browser is fine — select and proceed.
3. **If multiple browsers appear:** Call `AskUserQuestion` with each as an option per the tool's own instruction. Include device names + a final "broadcast pairing prompt" option.
4. **To get onto Riley's browser when this session is on Zain's machine:** call `switch_browser` (NOT `select_browser`). That broadcasts a confirmation prompt to every Chrome with the Claude extension installed on Riley's Anthropic account. Riley clicks Connect on HIS Chrome, and that browser becomes the active target. Tell Riley exactly what to expect ("a notification will pop up in your Chrome — click Connect").
5. **If `switch_browser` doesn't work or Riley's Chrome isn't paired at all:** the right move is NOT to push harder on automation. It's to give Riley the manual steps (URL + paste content + button to click). The Supabase SQL editor in particular: 30 seconds manually, vs. tabs-destroyed loops for hours on automation.

**Hard "do not":**
- Never silently fall through to the only local browser when Riley is driving — that lands on Zain's stuff.
- Never select a remote/cloud-hosted Chrome (anthropic-hosted etc.) — those have no signed-in user sessions.
- Never assume that because a browser was paired in a previous session, it's still paired now. Tab IDs and pairings reset.

**Riley's standing choice (2026-06-04): Option B — manual steps.** When asked whether to install the Claude Chrome extension on his machine (Option A) so I could drive his browser, vs. just receiving manual steps (Option B), Riley picked B. So: do NOT attempt Chrome MCP automation when Riley is driving the session. Even reading-only browser tools should be skipped. Instead, for any task that needs a browser:
- Give Riley the exact URL, the exact text to paste / button to click / form to fill, and one clear sentence of what success looks like.
- Keep the instructions tight — he'll do it in 30 seconds.
- If the task is genuinely long-multi-step in the browser, break it into single-action chunks he can confirm one at a time, not a wall of steps.
This decision can be revisited if a future task is repetitive enough to justify installing the extension. Until Riley says otherwise, manual is the default.

**Background context:** The Chrome MCP architecture pairs one Anthropic account to many Chrome extension installs. `isLocal` is about the machine running Claude, not about the user. Riley reinforced the "use my browser" rule three times across two days now (2026-06-03 and 2026-06-04) — that's signal that the prior rule was misapplied, not that he's repeating the same correction.

Related: [[riley-user]] [[riley-summer-project]]
