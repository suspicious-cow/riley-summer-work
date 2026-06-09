---
name: project-tracker-multiuser-plan
description: "Approved-in-principle plan (2026-06-02) for the punt tracker's next phase: Supabase-backed multi-user system with coach + player accounts and Discord-style team join codes. Riley starts on Supabase account setup 2026-06-03. Read before any backend work."
metadata: 
  node_type: memory
  type: project
  originSessionId: a24eb961-c795-444a-b7f5-2d47cae5170a
---

**Approved:** 2026-06-02. Work starts **2026-06-03** with Riley setting up the Supabase account.

**Status (2026-06-04): ALL SIX PHASES SHIPPED AND VERIFIED. Two follow-ups added the same day** (login page + per-user data isolation), the second of which caused a partial data-loss incident. Most recent commits:
- `1367345` feat(phase-6): polish — offline queue, hide-from-team, live indicator
- `b55cb70` feat: dedicated login page gates the app
- `73a8e3d` feat: per-user data isolation on sign-in/sign-out (CAUSED INCIDENT — see below)
- `65399ae` fix: don't clear local data when owner tag is missing (partial mitigation)

## Phase 1 status — DONE 2026-06-04

- Schema lives in `supabase/schema.sql` in the punt-tracker repo. Riley ran it in the Supabase SQL Editor.
- Anon key embedded in `supabase-client.js` (safe; it's the public client identifier and RLS gates everything).
- App still behaves exactly like v2 (localStorage-only). Cloud client is loaded but unused until Phase 2.
- Commit: `3bbf62b` "feat(phase-1): supabase schema, RLS, and client wiring".
- Verified via curl to PostgREST: all 5 tables return `HTTP 200 []` for anon (table exists, RLS filters to zero rows when auth.uid() is null), and the `join_team_by_code` RPC throws "invalid join code" from inside its own function body for a bogus code (proves the function is live and reachable).

### Phase 1 carried-forward notes (handle before they bite)

- **join_team_by_code is callable by anon.** Postgres default privileges in Supabase grant `execute` to both anon and authenticated, so my explicit `grant ... to authenticated` was redundant — it didn't restrict anon. With anon calling, `auth.uid()` is NULL, which trips the NOT NULL on `team_members.user_id` only after the team lookup succeeds. So anon can probe valid join codes by getting two different errors ("invalid join code" vs the NOT NULL violation). Not a Phase 1 problem but lock the function down in Phase 3 with an explicit `revoke execute on function public.join_team_by_code(text) from anon;` once we wire it up for real.
- **Table-existence check via REST works** without auth — no need to spin up a separate verification harness. Future schema migrations can be smoke-tested the same way (curl `/rest/v1/<table>?select=count` with anon, expect 200 `[]`).

## Phase 2 status — SHIPPED 2026-06-04

- Commit: `26ade39` "feat(phase-2): auth, signup/signin, cloud sync, first-time migration".
- New file: `auth.js` (auth state + sign-up/sign-in/sign-out + cloud sync + first-time migration UI). HTML modals + account chip live in `index.html`; styles in `tracker.css`. Cloud sync hooks added to every write function in `storage.js`. Service worker bumped to `punt-tracker-v4` and now short-circuits all `*.supabase.co` GETs out of the cache-first handler so user data never lands in the SW cache.
- **Anonymous use is preserved.** The app still loads to the kick-logging screen for unauthenticated visitors; localStorage-only behavior is unchanged. Auth is opt-in via the account chip in the top-right.
- **First-time migration:** the moment an authenticated user is detected with cloud-empty kicks AND localStorage with data, a modal prompts to upload. Upsert is idempotent (onConflict:'id') so a retry doesn't duplicate. After upload, normal cloud sync takes over.
- **Outgoing sync is fire-and-forget.** Local writes still complete synchronously; cloud upsert/delete runs in the background and only logs errors. There is NO offline retry queue yet — if a write happens while offline, the cloud falls behind the local copy and there is currently no way to resync short of manually re-triggering migration. Phase 6 is where realtime + offline-tolerance lands.
- **Supabase setting that affects UX:** Dashboard → Authentication → Providers → Email → "Confirm email". The code handles both modes:
  - ON (default): signUp returns a user but no session. Form shows "Account created. Check your email for a confirmation link." User confirms, comes back, signs in. On first sign-in, ensureProfile creates `user_profiles` row from `auth.users.user_metadata.{name, role}`.
  - OFF: signUp returns a session immediately. ensureProfile fires inline. User is in the app right away.
  Riley/Zain should pick whichever fits — for a small known team, OFF is lower friction; for any public-facing path, ON is the safer default.

### Phase 2 carried-forward notes

- **No offline retry queue.** Cloud sync errors are logged-only. If Riley loses signal mid-practice, the cloud falls behind. Acceptable for now because localStorage is still authoritative for the UI, but lock this down before "Phase 6 — polish" closes.
- **Profile-completion fallback.** If a returning user signs in and `user_metadata` is somehow missing (manual user-row creation in dashboard, etc.), `ensureProfile` silently warns and the account chip falls back to the email. A "complete your profile" modal would harden this — Phase 3 candidate if it comes up.
- **`renderAccountChip` uses innerHTML with the user's name** — escaped via `escapeHtml`. Don't switch to template literals without escaping; the name field is user-controlled and an XSS vector otherwise.
- **`role-option:has(input:checked)` CSS** uses `:has`, which is modern Chromium/Safari. Fine for the HS-team target audience (recent iOS/Android Chrome). If we ever broaden the audience, swap to a JS-driven class toggle.

## Forgot-password feature — SHIPPED 2026-06-04

- Commit: `f66925e` "feat: forgot-password link + reset flow + URL-recovery handler".
- "Forgot password?" link in the sign-in modal opens a reset-request modal (enter email → Supabase emails a recovery link). The recovery link bounces back to the app; supabase-js (`detectSessionInUrl: true`, `flowType: 'implicit'`) parses the hash, fires a `PASSWORD_RECOVERY` event, and the app pops a "Set a new password" modal. After `updateUser({password})`, `history.replaceState` strips the hash so a refresh doesn't re-trigger recovery.
- **Riley did not actually verify this end-to-end** because Supabase's free-tier email delivery blocked his test path. See the operational notes below — that section is the most important takeaway from today's session.

## Phase 2 operational notes — LESSONS FROM TESTING (read this before touching auth again)

This is the friction Riley actually hit during testing. Future-self: assume these are still true unless something says otherwise.

### Supabase free-tier email rate limit (~4 emails/hour)

The free tier rate-limits ALL outgoing emails (signup confirmations, password resets, magic links — they share one counter). Burns out fast during iterative testing. When it hits, the app shows "email rate limit exceeded" on the sign-up form and there is no client-side workaround. Two paths to keep working:

1. **Skip emails entirely.** Supabase Dashboard → Authentication → Providers → Email → toggle **Confirm email** OFF. Then signup creates the user + session immediately with no email. Riley's project currently has this set OFF — leave it off until you decide to take the app public.
2. **Dashboard "Add user".** Authentication → Users → Add user → tick **Auto Confirm User**. Creates a confirmed user with NO email sent. This is the escape hatch when even signup-without-confirmation is blocked.

### Dashboard-created users leave a user_profiles gap

The signUp form path puts `{name, role}` in `auth.users.user_metadata` and `ensureProfile` reads from there to create the `user_profiles` row. Dashboard-created users have empty user_metadata, so `ensureProfile` silently warns and the profile is never created. This breaks cloud sync (kicks.user_id REFERENCES user_profiles), the migration upload, and (when Phase 3 lands) team creation.

**Manual unblock for any dashboard-created user — paste in SQL editor:**

```sql
insert into public.user_profiles (id, name, role)
values ('<USER_UUID>', '<NAME>', 'coach' /* or 'player' */)
on conflict (id) do update set name = excluded.name, role = excluded.role;
```

(Get the UUID from Authentication → Users.)

**Code-level fix that should ship before any other real user signs up:** add a profile-completion modal that pops when `setAuthState` runs with a user but no profile and no user_metadata. Modal asks for name + role, inserts the row. This converts "you have to drop into SQL editor" into "the app asks you nicely." High-priority follow-up commit. Riley got past this once via manual SQL; the next user won't have SQL access or know what to do.

### Supabase URL configuration

The email recovery link needs Site URL + Redirect URLs configured at https://supabase.com/dashboard/project/adhbvmbtuuuhzrfeolkb/auth/url-configuration. Without it, reset emails redirect to localhost (the default) and 404 in the user's browser. Settings to set:

- **Site URL:** `https://suspicious-cow.github.io/punt-tracker/`
- **Redirect URLs:** `https://suspicious-cow.github.io/punt-tracker/**`

Riley's status on this is UNCERTAIN as of 2026-06-04 — we discussed it but he was deep in the rate-limit issue when the conversation ended. Verify before assuming the reset flow works.

### Workflow shortcut for "I just need to test the app, stop fighting auth"

Order of escalation when sign-up is broken:
1. Toggle Confirm email OFF, sign up via the form.
2. If still blocked, dashboard "Add user" → run the user_profiles upsert SQL → sign in.
3. If even THAT is broken, the bug is in the app code, not in Supabase.

## Phase 2 carried-forward notes (consolidated to-do for Phase 3 prep)

- **Profile-completion modal** — SHIPPED in Phase 3 (commit `0fc3caa`). `setAuthState` now opens a modal when `loadProfile` returns null; `completeProfile` upserts into `user_profiles` and runs `maybeMigrate` after.
- **`join_team_by_code` callable by anon** — FIXED in Phase 3 SQL migration (`revoke execute ... from anon` + a `profile must exist` guard inside the function body).
- **No offline retry queue** — Phase 2 carried this forward unchanged. Phase 6.
- **Supabase URL Configuration verification** — confirm settings on URL Configuration page before relying on any email-link flow (reset, magic link, etc.). Still NOT verified end-to-end.

## Phase 3 status — SHIPPED 2026-06-04, not yet verified by Riley

- Commit: `0fc3caa` "feat(phase-3): teams — coach creates, player joins via 10-char code".
- **Apply step Riley must run before the UI works:** open `supabase/migrations/phase-3.sql` and paste the whole file into the Supabase SQL editor at https://supabase.com/dashboard/project/adhbvmbtuuuhzrfeolkb/sql/new. Idempotent — safe to run twice. Until this runs, the Create team button will error with "function create_team does not exist".

### What's in the schema migration

- `create_team(p_name text)` RPC — generates a unique 10-char join code server-side (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — no 0/O/1/I/l for read-aloud clarity), validates `auth.uid()` exists + profile exists + `role = 'coach'` + name non-empty + ≤60 chars, then atomically `INSERT...RETURNING` into `teams`. Retries up to 20 times on `unique_violation`. Granted to `authenticated` only, revoked from `anon`/`public`.
- `join_team_by_code(code text)` RPC rewritten with `auth.uid()` check + profile-exists check before the team lookup. Revoked from `anon`/`public`, granted to `authenticated` only. Anon can no longer probe valid join codes via error-message differential.
- New RLS policy `read coaches of teams you are in` on `user_profiles` — without it, the player's "Coach: <name>" embed returned null because the coach is `owner_id` on teams, not a row in team_members, so neither the teammate nor the owned-team-member helper picked them up.

### What's in the UI

- **Account chip gains a Teams button** once `authState.profile` is non-null. Click → opens My Teams modal.
- **My Teams modal** lists owned teams (coach view, gold left border, copyable join code) and joined teams (player view, "Coach: <name>"). Footer buttons are role-gated — coaches see Create team, players see Join a team.
- **Create team modal** — text input + submit. On success, jumps to a "Team created" modal with the big bordered 10-char code + Copy button.
- **Join team modal** — single 10-char text input with `text-transform: uppercase`, `autocapitalize="characters"`, monospace font, letter-spacing. On success, toast + jump back to My Teams.
- **Profile-completion modal** — pops automatically when `setAuthState` detects user with no `user_profiles` row. Asks name + role. After save, runs `maybeMigrate`.
- **Clipboard copy** — `navigator.clipboard.writeText` with toast feedback. Falls back to showing the code in the toast if the API fails (insecure context, permissions, etc.).

### Phase 3 carried-forward notes

- **Phase 3 has NOT been verified end-to-end in Riley's hands.** Riley needs to: run the SQL migration; sign in (his account already has a profile from Phase 2 testing); create a team; copy the code; have a second account (or the coach's account, once recruited) sign up + join. Until that loop runs cleanly, treat Phase 3 as "shipped, untested in production-like usage".
- **Coach is NOT in `team_members` for their own teams** — they're `owner_id` on `teams`. This is the design (so `user_teammate_ids` doesn't return the coach to players, etc.) but every RLS helper has to handle this asymmetry explicitly. When wiring Phase 4 (coach dashboard), `user_owned_team_member_ids` is the lens to use — it iterates `team_members` of teams the user owns, which excludes the coach themselves.
- **`create_team` has no rate limit.** A signed-in coach can spam team creation. Not exploitable beyond filling up their own dashboard but consider a soft cap (e.g., 50 teams/owner) before opening signup to the public.
- **No "leave team" UI yet.** RLS allows DELETE on team_members for self or for owners of the team, so the API surface is ready. Probably wire into Phase 5 (player teammate view) since that's where players will think to remove themselves.
- **No "regenerate join code" UI yet.** Codes are stable for the team's life. If a coach wants to rotate after a code leaks, they currently have to drop into SQL editor. Cheap follow-up: `regenerate_join_code(team_id)` RPC + button on the owned-team row.
- **No "delete team" UI yet.** RLS allows owners to DELETE. Same cheap follow-up.
- **PostgREST nested embed in `loadMyTeams`** uses the explicit FK hint `teams_owner_id_fkey`. If that constraint ever gets renamed (e.g., by a future schema migration tool), the embed query breaks silently and players see "Coach: Coach" instead of the real name. Grep for the FK name before any teams-table schema change.

## Phase 4 status — SHIPPED 2026-06-04, untested

- Commit: `f3ea524` "feat(phase-4): live coach dashboard — team→players hierarchy".
- **Apply step Riley must run before live updates work:** open `supabase/migrations/phase-4.sql` and paste into the SQL editor. It adds `kicks`, `sessions`, `team_members` to the `supabase_realtime` publication. Without it, the dashboard loads once on sign-in but never updates live.

### What's in the UI

- New file `coach.js` — owns the dashboard rendering + Realtime subscription. Standalone (no shared state with auth.js besides reading `window.authState.user`). Exposes `window.coachDashboard.{activate, deactivate, refresh}` for auth.js to call from `setAuthState` based on `profile.role`.
- **Role-based UI swap.** `body.role-coach` flips visibility — `.player-only` (existing kick-logging UI, header, footer) hides and `.coach-only` (coach dashboard, coach header/footer) shows. Anon visitors and players see the original UI unchanged. Coaches never see the kick-logging form.
- **Dashboard layout.** Coach header ("Your Teams — Live data from every player. No refresh needed.") above a list of team blocks. Each team block has a gold top border, team name + player count, a join-code chip with Copy button. Below that, a responsive grid of player cards (auto-fill, min 240px). Each card shows player name + last-activity time + five stat blocks (Kicks, Best Dist, Best Hang, Avg Dist, Avg Hang). Empty teams show "No players have joined yet. Share the code above." Empty players (joined but no kicks) show "Waiting for their first kick."
- **Live updates via Realtime.** `coach.js` subscribes to `postgres_changes` on `kicks`, `sessions`, `team_members` via a single Supabase channel called `coach-live`. Any change debounces a 300ms refetch; an in-flight guard prevents overlapping refetches. RLS handles the security: a coach only receives events for rows their existing SELECT policies allow.
- **Time formatting:** "Last kick" shows the time of day for same-day, "Nd ago" for 1–6 days, and a short date thereafter. Pure client-side, no server roundtrip.

### Phase 4 carried-forward notes

- **NOT YET VERIFIED in Riley's hands.** The dashboard renders against any coach-role account, but Phase 4 needs a real end-to-end test: coach signs in → sees the team block → player on another account logs a kick → coach's dashboard updates within ~1 second without refresh. Until that runs cleanly, treat Phase 4 as "shipped, untested".
- **`removeChannel` is fire-and-forget** in `coach.js` deactivate — wrapped in `.catch(() => {})` because removing an already-unsubscribed channel can throw harmlessly. If channels start leaking (memory, double-subscriptions), revisit.
- **Replica identity is DEFAULT, not FULL.** DELETE payloads carry only the primary key. Fine for the current "refetch on any signal" pattern, but if a future feature wants to react to specific deleted-row contents, flip `replica identity full` on the relevant table — at the cost of larger broadcast traffic.
- **`hidden_from_team` toggle** (Phase 6) is in the schema already. The coach view does NOT respect it yet — the coach's `read kicks on owned teams` RLS policy is unconditional. The teammate-visibility policy IS gated on `hidden_from_team = false` (Phase 5 will care). Decision pending: should hidden_from_team also hide from the coach? Probably yes for the "I shanked it, don't show coach" use case — defer to Phase 6 discussion.
- **No per-player drill-down.** Click-into-player-for-full-history is in the original Phase 4 description but not in v1. Cheap add-on later: modal that shows a session list + chart for that player only.
- **No "stale data" indicator.** If Realtime disconnects (network blip), the dashboard silently stops updating. Supabase auto-reconnects but UI doesn't show the state. Cheap add-on: subscribe-state hook → header chip "live" / "reconnecting".
- **`coach.js` reads `window.authState.user` directly** instead of taking it as a parameter. Couples to auth.js's global. Fine for now (small surface) but a parameterized `activate(userId)` is the obvious clean-up if this file grows.
- **`window.showToast` exported from auth.js for coach.js.** Both modules need it; auth.js owns it. If a third caller appears, extract to its own file.

## What Riley asked for

"a system for coaches to add their players to so they can check the data they input and so that other players can see what their friends are kicking"

When asked how players join, Riley specifically said: *"a server where coach is on and we all sign up via an autogenerated 10 character join code."*

When asked if a real coach was lined up vs. building for general use: *"coach would love to see it now but lets make him a quality product."* So: real user (his Conroe Tigers coach), but design well — don't ship a rushed MVP.

## Locked design decisions

- **Discord/server style.** A team is the unit. Coach creates a team, gets a 10-char alphanumeric invite code, shares it. Players sign up + enter the code to join. Everyone on the team can see everyone else's stats.
- **Supabase free tier.** PostgreSQL + Auth + Realtime. Free for up to ~50k MAU which an HS team will never hit. **No monthly cost.** No separate server to host/maintain.
- **Frontend stays at suspicious-cow.github.io/punt-tracker/.** Same PWA, same look, same offline-first feel. localStorage demoted to a cache; Supabase becomes source of truth.
- **Coach is team owner.** Can read everything on their teams. Cannot edit player kicks.
- **Player roles:** can full-CRUD their own kicks, read-only on teammates' kicks.
- **One user can be in multiple teams** (e.g., school team + 7-on-7 team, or returning to it next season). team_members is a join table, not a foreign key on users.

## Schema sketch

- `users` — managed by Supabase Auth (email + password). App-level columns: name, role (`'coach'` | `'player'`).
- `teams` — id, name, owner_user_id (the coach), join_code (10 random chars, generated server-side, unique), created_at.
- `team_members` — team_id, user_id, joined_at. Composite PK or unique constraint.
- `kicks` — existing shape plus user_id column. Distance, hangtime, sessionId, position, etc.
- `sessions` — existing shape plus user_id column.

Row-level security (RLS) enforces:
- Player can SELECT/INSERT/UPDATE/DELETE their own kicks/sessions only.
- Player can SELECT teammates' kicks/sessions (read-only).
- Coach (team owner) can SELECT all kicks/sessions on their owned teams (read-only — no edit).

## Build phases (each shippable on its own)

| Phase | Scope | Days |
|---|---|---|
| 1 | Supabase project, tables, RLS policies. No UI yet. | ~2 |
| 2 | Sign-up + sign-in screens. localStorage → cloud migration on first sign-in. | ~2 |
| 3 | Coach creates team, gets join code. Player enters code to join. | DONE 2026-06-04, verified |
| 4 | Coach dashboard: list of players + their stats, live via Realtime. | DONE 2026-06-04, verified |
| 5 | Player "Team" tab: teammates' stats, read-only, live. | DONE 2026-06-04, verified |
| 6 | Polish: realtime indicator, offline retry queue, hidden_from_team toggle. | DONE 2026-06-04, verified |

## Late-session additions (2026-06-04 evening)

### Login page (commit `b55cb70`)

Anonymous use of the tracker is now blocked. A full-screen splash with sign-in / create-account buttons fronts the app for unauthenticated visitors. Behavior is controlled by `body.signed-in` — when unset, CSS hides the app shell (header, main, footers, tab bar, dashboards, account chip) with `!important` and shows `.login-page`. auth.js toggles the class in `setAuthState`. PWA cold-launches with a persisted session still skip the splash so offline use works for returning users.

**Trade-off Riley accepted:** previously the app supported anonymous use as localStorage-only. That's gone. Anyone visiting MUST sign up to log a single kick. If Riley ever wants a "try without committing" path back, add a "skip — use locally" button on the splash.

### Per-user data isolation (commits `73a8e3d` then `65399ae`)

**Intent:** different accounts signing in on the same device shouldn't see each other's data. Without this, the kick list and charts briefly showed the previous user's localStorage data until cloud sync overrode it.

**Approach:** tag localStorage with the user_id who owns it via a new `punt-tracker-data-owner-v1` key (set by `window.localData.setDataOwner(userId)`). Sign-out wipes kicks + sessions + sync queue + owner tag. Sign-in compares the tag to the current user.id and reconciles.

**Incident: my first version of `reconcileLocalData` lost Riley's data.** The original three-way logic was effectively two-way: any non-match (including owner=null) triggered `clearAllLocalData()` + `loadCloudDataToLocal(userId)`. On Riley's first sign-in after the change shipped, owner was null (the key was brand new), his localStorage held legitimate data, and the code wiped it and reloaded from cloud. Sessions that hadn't been synced to cloud (or that had subtly different dates in cloud) showed up wrong. Riley's symptom: "past sessions have now been set as today's date."

**Fix (commit `65399ae`):** three-way decision now genuinely three-way:
- `owner === userId`: same user, keep local, run `maybeMigrate` for any new local additions
- `owner === null`: legacy / pre-tagging data — **DO NOT CLEAR**, run `maybeMigrate` prompt as the original Phase 2 flow did, then tag the owner for next time
- `owner !== null && owner !== userId`: definitively foreign, load cloud first (writes overwrite localStorage on success); only clear in the catch block if cloud load fails

**Recovery investigation RESOLVED 2026-06-05.** Riley ran a diagnostic in the SQL editor (`select date, started_at, finished_at, kick_count from sessions`) and confirmed cloud dates all match the actual `started_at` and kick counts match what he remembers. **Cloud was never corrupted.** The lost-history symptom yesterday was confined to whatever local sessions hadn't yet synced before the wipe — those are gone, but cloud history is intact. No SQL recovery needed.

**Carried-forward for next session:**
- If Riley reports that the SQL query shows wrong dates in cloud, the data was corrupted at upload time (most likely by `sessionToCloud`'s `started_at: session.startedAt || new Date().toISOString()` fallback firing during an upload where startedAt was somehow missing). Fix path: `update public.sessions set date = to_char(started_at::date, 'YYYY-MM-DD') where date = '2026-06-04'` — but only after verifying which rows are actually wrong.
- If Riley reports cloud has correct dates, his missing sessions are local-only data that the wipe destroyed. Recovery requires an exported backup from earlier in the day (export/import lives at the bottom of the kick UI).
- Lesson for future destructive ops: never combine "clear local" + "reload from cloud" without first verifying cloud has equivalent or newer data. Trust local data when there's no signal it doesn't belong to the current user.

### Phase 7 — tamper-proof timestamps (commit `2c156dc`, VERIFIED 2026-06-05)

**Driver:** Riley said "ok lets make the data date and time un tamperable with because clearly we need that" after the isolation incident. The cloud accepted bad dates because nothing was protecting them. This phase moves timestamp authority from the client to the database.

**Verified live 2026-06-05** via a three-query test in the Supabase SQL editor: tried to overwrite `kicked_at`, `date`, and `notes` on the most recent kick with bogus 2020 values; trigger silently restored `kicked_at` + `date`, `notes` updated as expected. Confirmed both halves of the rule (protected fields locked, unprotected fields still mutable).

**Implementation:** two Postgres triggers per table (`public.kicks`, `public.sessions`), defined in `supabase/migrations/phase-7.sql` and mirrored into `supabase/schema.sql` section 5.

- **BEFORE INSERT trigger** (`tp_force_created_at`) — overwrites `created_at` to `now()` regardless of what the client sent. Audit witness is server-controlled.
- **BEFORE UPDATE trigger** — silently restores `created_at`, plus the user-meaningful "when did it happen" fields:
  - kicks: `created_at`, `kicked_at`, `date`
  - sessions: `created_at`, `started_at`, `date`; `finished_at` is settable once (null→value) then locked.

Other columns (distance, hangtime, notes, position, hidden_from_team, etc.) update normally.

**Why this fixes the isolation-incident class of bug:** even if local wipes and re-uploads everything as "new," the upsert matches by id → UPDATE path → trigger restores the original kicked_at/started_at/date. Bad client values are discarded silently. History is preserved in cloud and re-syncs back to local on next read.

**Carried-forward:**
- The triggers fire on ALL UPDATEs, including service_role. To fix an already-corrupted row, drop the relevant trigger, fix the row, recreate it. Recipe in the comment block at the top of `phase-7.sql`.
- INSERT-time `kicked_at` and `started_at` are still client-supplied (so backfill / first-time migration works). The audit guarantee is on `created_at` (server-set) plus the post-INSERT immutability of the user-meaningful fields. If we ever need stronger insert-time guarantees, add a CHECK that `kicked_at <= now() + interval '1 minute'`.
- SQL was applied + verified live on 2026-06-05. No further server action needed.

### Phase 8a — log conditions on sessions (commit `4336d50`, VERIFIED 2026-06-05)

**Driver:** the original tracker plan called for wind / weather / surface logging to unlock conditions-aware analysis. Conditions live on the **session**, not per-kick — wind doesn't change between consecutive kicks.

**Schema:** `supabase/migrations/phase-8a.sql` adds four nullable columns to `public.sessions`:
- `wind_mph` integer
- `wind_direction` text in (into, with, cross)
- `weather` text in (clear, cloudy, rain, wet)
- `surface` text in (turf, grass, wet_grass)

Phase 7 triggers do NOT touch these columns, so they remain editable forever (back-fill old sessions any time).

**Client UI:** inline panel inside the active session card AND inside each expanded past-session row. Chip-style pickers; tap to select, tap selected to clear. mph is a number input that saves on blur. Compact summary line ("12mph cross · Clear · Turf") appears under the session's stats when collapsed.

**Defensive sync:** `sessionToCloud` only emits the conditions fields when they are set, so a fresh deploy without the SQL migration still syncs sessions without errors.

### Phase 8b — conditions analysis card (commit `ac344f9`, VERIFIED 2026-06-05)

New file `conditions-analysis.js`. Pairs each kick with its session's conditions, then buckets:
- **Wind speed:** 0-5 / 6-15 / 16+ mph
- **Wind direction:** Into / With / Cross
- **Weather:** Clear / Cloudy / Rain / Wet
- **Surface:** Turf / Grass / Wet Grass

For each bucket: count, avg distance, avg hangtime. Highest-avg-distance bucket in each group is highlighted gold ("you punt best in X"). Card stays hidden until at least one kick has any condition attached, then fades in.

Renders into `#conditions-analysis-card` via `window.conditionsAnalysis.render(kicks, sessions)`, called from `renderAll()` in tracker.js. Two-column grid on screens >=640px.

### Sign-in sync hardening (commits `ea5d8a3`, `a663628`, 2026-06-05)

**The latent bug yesterday's incident exposed:** the original `reconcileLocalData` trusted `owner === userId` as proof that local data was authoritative — if local was somehow wiped between sign-outs, sign-in left local empty and never pulled from cloud. Today Riley signed out last night, signed back in this morning, local was empty, all his data appeared "gone" even though cloud had everything.

**New behavior (commit `a663628`):** any sign-in where owner matches (or is untagged) runs `pushLocalToCloud` (idempotent upserts; Phase 7 triggers keep existing timestamps locked) then `loadCloudDataToLocal(userId, { merge: true })` which keeps any local-only items by id. Result:
- returning user, in sync → effectively a no-op
- signed-out-then-back-in → cloud restored automatically
- offline writes → pushed up, kept locally
- legacy untagged data → silently uploaded

`maybeMigrate` is now dead code; left in place to minimize blast radius, delete in a follow-up.

**Owner-mismatch branch unchanged** — still wipes local and loads cloud (no merge), because that local data definitively isn't this user's.

### Auth race condition (commit `eee71e1`, 2026-06-05)

Supabase's cross-tab BroadcastChannel can fire two `onAuthStateChange` events fast enough that two `setAuthState` calls interleave. Second call sets `window.authState.profile = null` on entry; first then awaits into a state where its `applyRoleUI(profile.role)` crashes on null.

Fixed with a generation token: each `setAuthState` increments a module-level counter and bails out after each `await` if a newer call has started. Stale calls drop quietly; latest call wins.

Surfaced when Riley unregistered the SW to force a fresh load — a classic "the race only fires under specific load conditions" bug.

### Phase 9a — kicker mode / FG tracker (commits `6b839cb`, `c17a172`, `e320070`, 2026-06-05)

**Driver:** Riley asked "we need to add a page for kickers too." Picked the **separate-mode** scope — placekickers get their own sign-up choice and their own form/stats, not just an extra field on the punter form.

**Schema (`supabase/migrations/phase-9a.sql`):**
- `user_profiles.position` text default 'punter' check in (punter, kicker) — existing rows are punters, no breakage.
- `kicks.kick_type` text default 'punt' check in (punt, fg, pat, kickoff) — keeps the one kicks table polymorphic so all the cloud sync, RLS, and Phase 7 triggers carry over for free.
- `kicks.outcome` text check in (made, missed) — null for punts, set for FG/PAT.

**Architecture:** Parallel UI in the same DOM gated by **body classes**: `body.position-punter` hides `.kicker-only`, `body.position-kicker` hides `.punter-only`. Stacks cleanly with existing `role-coach` / `role-player` / `player-only` / `coach-only` / `player-tab-*` classes. No DOM duplication of shared infrastructure: session control, conditions panel, account chip, login splash, team/coach views — all reused.

**Files added:**
- `kicker.js` — kicker form handler, FG stats sidebar (Made/Att/FG%/Career Long), live session grid (Attempts/Made/FG%/Long), last-session preview ("8 attempts, 75% made"). Activated by `applyRoleUI` when `profile.position === 'kicker'`. Hooks the shared start/finish session buttons via `setTimeout(render, 0)` since tracker.js updates state in those handlers without firing `local-data-changed`.
- `kicker-field.js` — same football SVG visual as the punter field. LOS picker drives a football marker + dashed trajectory to the opposite goalpost. **FG distance auto-fills via `(yards-to-opp-goal + 17)`** (10 EZ + 7 holder). Once the user manually types in the distance field, auto-fill stops (`e.isTrusted` guard). LOS is persisted in `kick.position.los` and restored on edit.

**Auth surface changes:** `signUp` / `completeProfile` / `ensureProfile` now take `position`; `loadProfile` pulls the column; `setAuthState` → `applyRoleUI(role, position)` sets the body class and activates kickerApp. Sign-up + profile modals get a Position fieldset that JS shows/hides based on the Role radios (`wirePositionToggle` on DOMContentLoaded).

**Existing punter users are 100% unaffected** — the migration default + the body-class system means they see the exact same UI they had before. Riley's main account is still a punter; he tested kicker mode via a separate signup using a `+kicker` gmail alias.

**Deferred to 9b:**
- Charts adapted for kickers (FG% over time, distance histogram)
- Conditions analysis adapted for FG outcomes ("you make 80% in calm wind, 50% in 15+ mph")
- Past sessions adapted for kicker rendering (currently `.punter-only`, hidden in kicker mode)
- Coach dashboard showing kickers' FG% (currently shows punt-only stats)
- Kickoffs + PATs (only FG implemented in 9a)
- More flexible position editing (currently locked at sign-up)

**Defensive note in `kickToCloud`:** `kick_type` and `outcome` only emit when set, so a stale client deploying before the SQL migration runs still syncs punts cleanly. Same pattern as conditions in Phase 8a.

### Phase 9b — kicker mode polish: hash, PAT, kickoff, past sessions, charts (2026-06-05)

Half a day of focused additions on top of 9a. All changes inside the kicker view; the punter side is untouched.

**FG form refinements:**
- Ball marker visually placed **7 yards behind the LOS** (standard NFL/college holder spot) — Riley iterated 5 → 8 → 7 to settle.
- Trajectory line now extends to **back of the endzone** (x = `rightGoalX + 10`), not the goal line. ViewBox already 120 wide so it draws cleanly.
- **Hash picker** (Left / Middle / Right) added below the LOS row. Ball y-position moves to top hash / center / bottom hash; trajectory still aims at the field-center goalposts. Saves to `kick.position.hash`.
- **FG distance input dropped.** Riley: "the point where the ball is on to the back of the endzone is how a field goal is measured." `kicker-field.js` exposes `getDistance()` that returns the live computed `(yards-to-opp-goal + 17)`. kicker.js reads it at save time. The on-field prompt still shows the running distance.

**PAT mode (commit `e0b4f2b`):**
- Kick-type toggle expanded to **Field Goal | PAT | Kickoff**.
- Selecting PAT locks LOS at **Opp 3** (20 yd FG by the formula) and disables the side toggle + yard input + steppers via `setLosLocked`. Hash is still pickable.
- Kick type is **sticky after save** so Riley can rapid-fire log a series of PATs. `resetForm` snapshots `currentKickType()` before `form.reset()` and re-applies it.
- Sidebar gets a separate **PAT %** card; live session swaps the "Made" tile for a **PAT %** tile. Career Long stays FG-only.
- Kick rows render PAT kicks with `PAT` instead of a distance number.
- SQL constraint already permitted `pat` from Phase 9a — no migration.

**Kickoff mode (commit `9c6820a`):**
- New file: `kickoff-field.js` (mirrors `field.js` drag-drop). Ball locked at **Own 40** (x=50), no LOS picker. Same `pointToYardLine` / `snapPoint` / hash-band detection as the punter. Trajectory draws ball → landing on drag.
- New HTML section `#kicker-kickoff-section` with its **own field SVG** (kickoff- prefixed IDs) + its **own stopwatch** (kickoff-stopwatch-btn / display / reset / help) + a hangtime input. Inline mini-stopwatch implementation in kicker.js (matches stopwatch.js but bound to kickoff IDs).
- When type=kickoff, `applyKickTypeUI` toggles `#kicker-fg-pat-section.hidden` and lazily calls `window.kickoffField.setup` + `kickoffStopwatch.setup`.
- **Result auto-derived** from landing position, never stored:
  - `inEndZone && side==='opp'` → touchback
  - `side==='opp' && yard<=20 && !inEndZone` → inside20
  - else → normal
- `outcome` stays null for kickoffs — `kickToCloud` already drops it (defensive), so no SQL change.
- Kickoff kick rows show distance + a badge: TOUCHBACK (red), INSIDE 20 (green), or `KO · 4.05s` (grey).
- Validation: empty submit on kickoff shows "Drag the football to where it landed" inline error.

**Past sessions + charts (commit `251034e`):**
- Four new kicker-only cards: FG Distance Trend, FG Make %, Kickoff Hangtime Trend, Past Sessions.
- `kicker-charts.js` mirrors the structure of `charts.js` but each chart filters kicks by type. FG Make % chart has `yMax: 100` so the y-axis doesn't auto-scale to 67%-83% etc. Each chart needs ≥ 2 finished sessions with the relevant kick type before drawing.
- `renderPastSessions` in kicker.js: same expand/collapse + edit/delete UX as the punter, but the row header shows split stats `5/6 FG · 83% · 3/3 PAT · 100% · 4 KO · 48.2 yd avg · 4.05s hang` (parts shown only when count > 0). Reuses existing `kickerSessionSummary` helper for the breakdown.
- Click delegation: `handleSessionListClick` calls `handleKickListClick` first (now returns boolean), then handles session toggle + Delete Session confirm. Reuses the punter's `.session-row` CSS classes; the embedded `<ul>` swaps `session-kicks` for new `kicker-session-kicks` class to avoid the punter's `.session-kicks li { display: flex }` clobbering the kicker row's grid layout.

**Commits this phase:** `aaa503e` (ball 5 yd back) → `5080c40` (8 yd) → `d4d0a4a` (settled at 7 yd + trajectory through endzone) → `bef0ef4` (hash picker) → `4776f04` (drop distance input) → `e0b4f2b` (PAT mode) → `9c6820a` (kickoff mode) → `251034e` (past sessions + 3 charts). Plus minor copy fixes for the kicker page header / live stats — covered in the commit history.

**Service worker:** v23 → v31 today (one bump per ship). Cache-busted URL pattern Riley uses: `https://suspicious-cow.github.io/punt-tracker/?v=31` to bypass SW for the HTML navigation. He learned to F12 → Application → Service Workers → Unregister when a stale cache mismatches new code (root cause of his "I can't save my kick" report after I dropped the distance input — old kicker.js cached, threw on `null.value`).

**Still deferred to 9c / coach work:**
- Conditions analysis adapted for FG outcomes ("you make 80% in calm wind")
- Coach dashboard showing kicker FG% / kickoff metrics
- More flexible position editing (still locked at sign-up)
- Possibly a kickoff distance chart (Riley didn't ask but it's a natural sibling of hangtime)

| 4 | Coach dashboard: list of players + their stats, click into player for full history. | ~3 |
| 5 | Player "Team" tab: teammates' stats, read-only. | ~2 |
| 6 | Polish: realtime updates, offline tolerance, "hide this kick from teammates" toggle. | ~2-3 |

**Total estimate: 2-3 weeks of focused work.**

## Preconditions Riley/Zain owe before Phase 1

1. **Supabase account + project.** Riley or Zain signs up at https://supabase.com (free, just an email). Creates a project (suggested name: 'punt-tracker'). Sends Claude both:
   - **Project URL** (from Settings → API)
   - **anon public key** (from Settings → API — safe to put in client code and commit to repo)
2. **Zain's sign-off** on storing teammates' kick data in a hosted DB. Low sensitivity (it's punt distances, not SSNs) but other teammates' parents implicitly trust whatever the coach uses, so worth Zain explicitly OK'ing.
3. **Coach gut-check.** A "yeah I'd actually sign up and check it" text from the coach. Confirms a real user, not hypothetical.

## What's NOT in this plan

- No payment / paid tier. Free Supabase is sufficient.
- No iOS/Android native apps. PWA stays the install path.
- No video / film features. Out of scope.
- No coach-to-coach collaboration across schools. Team is single-coach for v1.
- No analytics dashboards beyond what the current app shows + per-player breakdowns. Conditions inputs / Python weekly report (from [[project-tracker-plan]]) are still future work that can layer on after multi-user lands.

## How to apply

- Tomorrow's first move is to ask Riley/Zain whether they got the Supabase project set up and what the URL + anon key are. Do not start Phase 1 code until those are in hand.
- All backend code goes in the `punt-tracker` repo at `C:\Users\Zain_\Downloads\punt-tracker`. The recruiting site (`riley-summer-work`) does NOT need backend changes — it keeps reading localStorage for Riley's personal stats card.
- This is a real product surface now. Each phase deserves its own commit and a working demo before moving on. Riley specifically said "quality product" so resist the urge to rush.
- Related: [[project-punt-tracker-public]] [[project-tracker-sprint-state]] [[project-tracker-plan]] [[riley-summer-project]]
