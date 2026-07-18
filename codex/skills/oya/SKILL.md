---
name: oya
description: Manage Oya agents and skills end to end - create/configure/deploy/run agents, browse and attach catalog skills, author and edit custom skills, schedule routines and webhook triggers - using the bundled `oya` MCP tools.
---

# Oya

This plugin connects Codex to the user's Oya workspace through the `oya` MCP server. Use its
tools instead of guessing or asking for data you can fetch.

The connector authenticates with the `OYA_API_KEY` environment variable; if a call returns
unauthorized, tell the user to set it (create one at https://oya.ai). Tool errors carry a
domain code (`not_found`, `forbidden`, ...) — surface it and stop rather than retrying blindly.

## Available tools (call them directly)

- **Agents** — `agents.list`, `agents.get`, `agents.create`, `agents.get_soul`,
  `agents.set_soul`, `agents.update_script`, `agents.deploy`, `agents.deploy_script`,
  `agents.run_script`
- **Agent skills** — `agents.list_skills`, `agents.add_skill`, `agents.remove_skill`,
  `agents.sync_skills` (declare the whole set in one call)
- **Skills catalog** — `skills.list`, `skills.get`, `skills.create`, `skills.update`,
  `skills.delete`
- **Templates** — `templates.list`, `templates.get`, `templates.deploy` (quickstart a complete
  agent from a curated template)
- **Routines** — `routines.list`, `routines.create`, `routines.trigger`
- **Triggers** — `triggers.list`, `triggers.create_webhook`
- **Knowledge base** — `knowledge_base.list_folders`, `knowledge_base.create_folder`,
  `knowledge_base.upload`, `knowledge_base.assign_entry`, `knowledge_base.list_entries`,
  `knowledge_base.list_agent_knowledge`
- **Gateways (read)** — `gateways.list`, `gateways.list_connections`
- **Projects / organizations / api_keys** — `*.list` / `*.create` / `*.get` and related.

## Common flows

**Quickstart from a template (fastest).** `templates.list` → pick the closest match →
`templates.deploy` (with `agent_name` / `deploy_inputs`) → connect gateways in the browser →
`agents.deploy`. Ships skills + routines + soul preconfigured.

**Create an agent from scratch.** Build a complete agent, not a toy:
1. `agents.create` with `name`, `description`, `mode` (`skills` or `script`).
2. `agents.set_soul` — `persona` (5–8 lines), `behavior_rules` (6–10 specific rules),
   `welcome_message`. Keep it tight; reference content goes in the KB, not the soul.
3. Browse `skills.list`, then declare the whole toolset with `agents.sync_skills` (a list of
   `{skill_id, config?, credentials?}`). Verify with `agents.list_skills`. Missing capability?
   Author it (see below), then attach.
4. Reference content: `knowledge_base.create_folder` → `knowledge_base.upload` →
   `knowledge_base.assign_entry` so the agent finds it via `search-kb`.
5. Add at least one `routines.create` (natural-language `schedule` like "every weekday at 9am").
6. `agents.deploy` (for `script` mode: `agents.update_script` → `agents.deploy_script` →
   `agents.deploy`). Smoke-test with `agents.run_script` and print `https://oya.ai/chat/<id>`.

**Debug / edit an existing agent.** `agents.get` + `agents.get_soul` + `agents.list_skills` +
`routines.list` + `gateways.list` to inspect; `agents.run_script` to reproduce the failure; fix
the root cause (`agents.set_soul` for behavior, `agents.add_skill` / `agents.remove_skill` /
`agents.sync_skills` for tools, `agents.update_script` for code); redeploy and re-run to confirm.

**Create a skill.** Draft a `SKILL.md` (YAML frontmatter: `name` kebab-case, `description`,
`category`, a `tool_schema`) plus a self-contained `script.py`, show the user, then call
`skills.create` with `skill_md` and `script_py` (and `assets` for extra files).

**Edit a skill.** `skills.get` to pull the source, then `skills.update` (partial —
`script_content`, `scripts`, `tool_schema`, `skill_md`, or metadata). Smoke-test via an agent
that has it attached (`agents.run_script`). Only user-owned skills are editable.

**Schedule work.** `routines.create` for recurring prompts; `triggers.create_webhook` for
external events (Stripe, GitHub, ...) — it returns the webhook URL + secret to wire up.

**Bring your own agent (LangChain / Mastra / Claude Code → Oya).** An Oya script-mode agent is
one self-contained **Python 3.11** script: input arrives as the `USER_MESSAGE` env var, stdout
is the result, imports auto-install on deploy, and secrets are env vars.

- **LangChain** (Python): a near-direct port — wrap its chain/graph to read `USER_MESSAGE` and
  print the result. Flow: `agents.create` (mode `script`) → `agents.update_script` →
  `agents.update_secrets` (the keys it read from env) → `agents.deploy_script` (pip-installs the
  imports) → `agents.deploy` → `agents.run_script` to compare against the original.
- **Mastra** (TypeScript): a reimplementation (the sandbox is Python-only). Map `new Agent` →
  the script's LLM call, `createTool` → a Python function or an Oya skill, workflows → control
  flow or a routine, Zod schema → the `# INPUT_SCHEMA:` comment. Same deploy flow as LangChain.
- **Claude Code subagent** (`.claude/agents/*.md` — prompt + tool allowlist, no code): maps to a
  **skills-mode** agent. `agents.create` (mode `skills`) → `agents.set_soul` (the system prompt
  → persona + behavior_rules) → `agents.sync_skills` (map its tools to catalog skills:
  `WebSearch`→`web-search`, memory→`memory`, etc.; local file/bash tools have no equivalent) →
  `agents.deploy`; test in chat. A Claude *Agent SDK* program (code) migrates like LangChain.

Keyless LLM option in any script: call `oya_runtime.llm(messages)` in the sandbox instead of a
provider SDK.

## Limits

`gateways.list` / `gateways.list_connections` show what's connected, but **starting a new**
gateway OAuth connection (Slack, Gmail, etc.) needs a browser callback, so it isn't exposed over
MCP — direct the user to the Oya web app to connect a platform, then re-check with
`gateways.list`. Don't fake a connection.
