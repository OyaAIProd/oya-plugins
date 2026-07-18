---
description: Browse the skills catalog and add or remove skills on one of your Oya agents
---

You have the Oya MCP server connected (tools include `skills.list`, `skills.get`,
`agents.list`, `agents.get`, `agents.list_skills`, `agents.add_skill`, `agents.remove_skill`,
`agents.deploy`, `agents.run_script`).

The user wants to manage an agent's skills: **$ARGUMENTS**

1. **Pick the agent.** If none was named, call `agents.list` and ask which one.
2. **Show what's attached.** Call `agents.list_skills` for the agent — list each skill with
   its enabled state and config so the user sees the current set.
3. **Browse the catalog** when adding. Call `skills.list` (optionally filtered by `category`);
   each entry flags whether it's already installed. Use `skills.get` to show a skill's config
   schema and required resources before attaching it.
4. **Add.** `agents.add_skill` with `agent_id` + `skill_id`, plus `config` and `credentials`
   if the skill needs them (surface the required config from `skills.get` rather than sending
   an empty object and hoping).
5. **Remove.** `agents.remove_skill` with `agent_id` + `skill_id`. Confirm before detaching a
   skill the agent may depend on.
6. **Make it stick.** After changing the attached set, call `agents.deploy` so the live agent
   picks up the change, and offer a quick `agents.run_script` to confirm the agent can now (or
   no longer) do the thing.

If the user needs a capability that isn't in the catalog, don't force-fit an unrelated skill —
suggest `/oya:skill-new` to author it, then attach it here.

Surface any tool error verbatim (it carries a domain code like `not_found` / `forbidden`) and
stop rather than guessing.
