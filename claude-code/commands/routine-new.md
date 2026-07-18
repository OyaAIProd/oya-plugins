---
description: Add, list, or run scheduled routines and webhook triggers for an Oya agent
---

You have the Oya MCP server connected (tools include `routines.list`, `routines.create`,
`routines.trigger`, `triggers.list`, `triggers.create_webhook`, `agents.list`, `agents.get`).

The user wants to set up a routine or trigger: **$ARGUMENTS**

A **routine** is a recurring prompt the agent runs on a schedule. A **trigger** is an external
event (a webhook — Stripe events, GitHub push, etc.) that starts a run. Figure out which the
user needs from their intent.

1. **Pick the agent.** If none was named, call `agents.list` and ask which one.
2. **Show what's there.** Call `routines.list` and/or `triggers.list` for the agent so the
   user sees existing schedules before adding a duplicate.

**Scheduled routine**

3. Call `routines.create` with `agent_id`, a short `name`, the `prompt` the agent runs each
   time, and `schedule` as a natural-language cadence ("every weekday at 9am", "the 1st of the
   month"). Make the `prompt` concrete and self-contained — it runs with no human in the loop,
   so it must say exactly what to produce and where to send it.
4. Optionally set `output_channel` (and `output_gateway_id`) so results land in the right
   place.
5. Offer to `routines.trigger` it once immediately (out of schedule) to confirm it works, and
   summarize the run.

**Webhook trigger**

3. Call `triggers.create_webhook` with `agent_id`, a `name`, and an `agent_prompt` describing
   what the agent should do when the event fires. It returns the webhook URL + secret — show
   both to the user and tell them to wire the URL into the source system.

Write routine prompts and trigger descriptions that teach: name the concrete event and outcome
("summarize yesterday's Stripe charges and post to #finance"), not a vague label.

Surface any tool error verbatim (it carries a domain code like `not_found` / `forbidden`) and
stop rather than guessing.
