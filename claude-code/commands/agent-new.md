---
description: Create a new Oya agent and configure it end to end (template quickstart or from scratch — soul, skills, routines, knowledge base, deploy)
---

You have the Oya MCP server connected (tools include `templates.list`, `templates.get`,
`templates.deploy`, `agents.create`, `agents.get`, `agents.set_soul`, `skills.list`,
`agents.sync_skills`, `agents.add_skill`, `agents.list_skills`, `knowledge_base.create_folder`,
`knowledge_base.upload`, `knowledge_base.assign_entry`, `routines.create`, `gateways.list`,
`agents.deploy`, `agents.run_script`).

The user wants to create an agent: **$ARGUMENTS**

If they gave no description, ask what the agent should do (role + the concrete outcomes it
owns) before building.

## Path A — Quickstart from a template (default, fastest)

Most "build me a [role]" intents map to a curated template that already ships a complete agent.

1. Call `templates.list` and pick the closest match to the user's intent. Show it to them and
   confirm (use `templates.get` for its detail — skills, routines, required inputs).
2. Call `templates.deploy` with the `template_id` (and `agent_name` / `deploy_inputs` as
   needed). It returns a new `agent_id` with skills + routines + soul preconfigured.
3. Connect any required gateways in the browser (see the deploy note below), then
   `agents.deploy` and print `https://oya.ai/chat/<agent_id>`.

## Path B — From scratch (when no template fits)

Build a **complete** agent, not a toy. Default to the full flow; only skip routines/KB if the
user explicitly asks for something minimal.

1. **Create.** `agents.create` with `name`, a one-line `description`, and `mode`
   (`skills` or `script`). Capture the `agent_id`.
2. **Soul.** Call `agents.set_soul` — the identity loaded every turn. Give it a `persona`
   (5–8 lines), `behavior_rules` (6–10 specific rules), and a `welcome_message`. Keep it tight;
   reference content goes in the KB, not the persona.
3. **Skills.** Browse `skills.list` (optionally by `category`), then declare the whole toolset
   in one call with `agents.sync_skills` (a list of `{skill_id, config?, credentials?}`) — it
   adds and removes to match, and never drops core skills. Verify with `agents.list_skills`.
   If a needed capability isn't in the catalog, pause and run `/oya:skill-new` to author it.
4. **Knowledge base.** For playbooks, product facts, or tone guides: `knowledge_base.create_folder`
   → `knowledge_base.upload` (the doc text) → `knowledge_base.assign_entry` so the agent can
   look it up via its `search-kb` skill. Don't paste long content into the soul.
5. **Routines.** Add at least one via `routines.create` (`agent_id`, `name`, `prompt`,
   natural-language `schedule` like "every weekday at 9am"). Make the prompt concrete — it runs
   with no human in the loop.
6. **Deploy.** `agents.deploy`. For a `script`-mode agent, first `agents.update_script`, then
   `agents.deploy_script`, then `agents.deploy`.
7. **Smoke test.** Offer one `agents.run_script` with a representative `user_message`, summarize
   the result, and print `https://oya.ai/chat/<agent_id>`.

## Pre-deploy checklist (state it out loud; fix anything that fails)

- Soul set: `persona` ≥ 5 lines, `behavior_rules` ≥ 6, `welcome_message` non-empty
  (`agents.get_soul`).
- Skills a working set, not one (`agents.list_skills`).
- At least one routine unless the user opted out (`routines.list`).
- KB holds any reference content (`knowledge_base.list_agent_knowledge`).

## Gateways

`gateways.list` shows what's connected. To connect a **new** platform, call `gateways.connect`
(`agent_id` + `platform`) — OAuth needs a browser callback, so it returns an `install_url` for
the user to open and authorize; then re-check with `gateways.list`. If the user already connected
that platform elsewhere, pass a `connection_id` from `gateways.list_connections` to reuse it with
no browser step. Don't fake a connection.

Surface any tool error verbatim (it carries a domain code like `not_found` / `forbidden`) and
stop rather than guessing.
