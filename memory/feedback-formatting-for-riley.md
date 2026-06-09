---
name: feedback-formatting-for-riley
description: "When writing for Riley, visually differentiate \"read this\" content from connecting prose using markdown affordances that render in distinct colors."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a24eb961-c795-444a-b7f5-2d47cae5170a
---

**When writing messages for Riley, use heavy markdown formatting so key content stands apart from connecting prose.**

**Why:** Zain pointed out that a plain prose response looked like a "wall of text" to Riley and he couldn't tell what to focus on. Riley is new and needs visual cues to navigate a message.

**How to apply:**
- Wrap **every line/sentence directed at Riley in inline code spans** (`` ` `` backticks). Inline code renders in a distinct accent color in the Claude Code terminal — this is the strongest "different colored font" available to me without ANSI passthrough.
- Keep prose addressed to Zain (the dad) plain — that's the contrast.
- Section titles for Riley still use `## headers`.
- Inside backticks I lose nested bold/italic — that's fine; color is what Zain wants.
- Do this for EVERY future message addressed to Riley unless Zain redirects.
- Zain explicitly picked this format ("option 2") after I explained I cannot inject ANSI color codes directly.
- Zain confirmed the rendering is "acceptable" after seeing the first message in this format — this is the validated approach.
- Related: [[riley-user]] [[riley-summer-project]] [[feedback-no-games]]
