---
name: oya
description: Manage Oya agents and skills - list/create/update/delete catalog skills, and create/configure/deploy/run agents - using the bundled `oya` MCP tools.
---

# Oya

This plugin connects Codex to the user's Oya workspace through the `oya` MCP server. Use its
tools instead of guessing or asking for data you can fetch.

Available tools (call them directly):

- **Skills** — `skills.list`, `skills.get`, `skills.create`, `skills.update`, `skills.delete`
- **Agents** — `agents.list`, `agents.get`, `agents.create`, `agents.list_skills`,
  `agents.add_skill`, `agents.remove_skill`, `agents.update_script`, `agents.deploy`,
  `agents.deploy_script`, `agents.run_script`
- **Projects / KB / routines / triggers / organizations / api_keys** — `*.list` / `*.create` and related.

Guidance:

- To **create a skill**, draft a `SKILL.md` (YAML frontmatter: `name` kebab-case,
  `description`, `category`, a `tool_schema`) plus a self-contained `script.py`, show the user,
  then call `skills.create` with `skill_md` and `script_py`.
- To **deploy an agent**, call `agents.deploy_script` (build + upload the code) then
  `agents.deploy` (mark it live); offer a smoke test via `agents.run_script`.
- Tool errors carry a domain code (`not_found`, `forbidden`, ...). Surface it and stop rather
  than retrying blindly.

The connector authenticates with the `OYA_API_KEY` environment variable; if a call returns
unauthorized, tell the user to set it (create one at https://oya.ai).
