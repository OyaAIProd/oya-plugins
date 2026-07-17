---
description: Scaffold a new Oya skill from a description and publish it to your catalog
---

You have the Oya MCP server connected (tools prefixed `mcp__...__oya__` — `skills.list`,
`skills.get`, `skills.create`, `skills.update`, `skills.delete`, and the `agents.*` tools).

The user wants to create a new Oya skill: **$ARGUMENTS**

Do this:

1. Draft a `SKILL.md` with YAML frontmatter (`name` in kebab-case, `description`, `category`,
   and a `tool_schema` describing the input) followed by a short body explaining what the
   skill does and when to use it.
2. Write the `script.py` — the skill's Python entry point. Keep it self-contained; read
   inputs from the documented schema and print/return the result.
3. Show the user the drafted `SKILL.md` and `script.py` and ask for confirmation.
4. On confirmation, call the `skills.create` tool with `skill_md` and `script_py` (and
   `assets` only if the skill needs extra files). Report the returned `skill_id`.
5. Offer to attach it to one of their agents with `agents.add_skill`.

Prefer concrete, working code over placeholders. If the user gave no description, ask what
the skill should do first.
