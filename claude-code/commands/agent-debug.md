---
description: Diagnose a failing Oya agent or make a targeted edit to an existing one
---

You have the Oya MCP server connected (tools include `agents.list`, `agents.get`,
`agents.get_soul`, `agents.set_soul`, `agents.list_skills`, `agents.add_skill`,
`agents.update_skill`, `agents.remove_skill`, `agents.sync_skills`, `agents.update_script`,
`agents.update_secrets`, `agents.deploy_script`, `agents.deploy`, `agents.run_script`,
`agents.get_runs`, `agents.get_run`, `agents.list_threads`, `agents.get_thread`,
`agents.get_trace`, `routines.list`, `routines.update`, `routines.trigger`, `gateways.list`,
`skills.list`, `skills.get`).

The user wants to debug or edit an agent: **$ARGUMENTS**

If no agent id was given, call `agents.list` and ask which one.

This command covers two intents — a failing agent, and an intentional edit. They share the
same surface.

**Diagnose (something's broken / "why didn't it work?")**

1. `agents.get` for the agent — check its mode, status, and system prompt.
2. `agents.list_skills` — is the skill it needed actually attached and enabled? Missing or
   disabled skills are the most common cause of "it can't do X".
3. `agents.get_soul` — if the agent misbehaves (wrong tone, ignores a rule), read its
   persona + behavior_rules; a vague or contradictory soul is often the cause.
4. `routines.list` — if the complaint is about a scheduled run, confirm the routine exists and
   its prompt/schedule are right. `gateways.list` — if it "can't reach Slack/Gmail", check the
   platform is actually connected.
4. **Read the real failure.** If a run already failed, don't guess — read it. `agents.get_runs`
   lists recent runs (find the failing `job_id`); `agents.get_run` returns that run's full payload
   + result. For a chat complaint, `agents.list_threads` → `agents.get_thread` shows the whole
   conversation (including tool calls), and `agents.get_trace` fetches the LLM trace behind a
   message. Otherwise **reproduce**: call `agents.run_script` with a `user_message` that recreates
   the failure. Form one hypothesis from the actual output.
5. **Fix** the root cause (see below), redeploy, and re-run to confirm the failure is gone.

**Edit (swap a skill, tweak rules, change behavior)**

- Add or remove a skill: `agents.add_skill` / `agents.remove_skill` (browse with `skills.list`
  / `skills.get` first), or replace the whole set at once with `agents.sync_skills`.
- Change persona, rules, or welcome message: `agents.set_soul` — send only the fields you're
  changing (`persona`, `behavior_rules`, `welcome_message`, `mission`, `brand`).
- Change code on a `script`-mode agent: `agents.update_script` with the new source.

**After any change:** `agents.deploy_script` (script mode) then `agents.deploy` to make it
live, and re-run `agents.run_script` to verify the fix actually holds before declaring done.

Surface any tool error verbatim (it carries a domain code like `not_found` / `forbidden`) and
stop rather than guessing.
