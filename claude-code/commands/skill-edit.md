---
description: Edit or fix an existing Oya skill (pull it, change the code or schema, push it back, smoke-test)
---

You have the Oya MCP server connected (tools include `skills.list`, `skills.get`,
`skills.update`, `skills.delete`, `agents.list`, `agents.list_skills`, `agents.run_script`).

The user wants to edit a skill: **$ARGUMENTS**

1. **Find it.** If no skill id was given, call `skills.list` (optionally with a `category`) and
   ask which skill. Only user-owned skills are editable — system skills are read-only.
2. **Pull the current source.** Call `skills.get` to see the name, description, config schema,
   `tool_schema`, and required resources. Read it before changing anything so the edit is
   grounded in what's actually there.
3. **Make the change.** Show the user the concrete diff you intend (script, schema, or
   metadata) and confirm.
4. **Push it back** with `skills.update` (partial — send only what changed):
   - `script_content` for a single-file skill, or `scripts` (`{relpath: code}`) for a
     multi-file skill.
   - `tool_schema` to change the input the agent passes.
   - `skill_md` to re-parse the whole SKILL.md (frontmatter + body) at once.
   - `name` / `description` / `category` for metadata.
5. **Smoke-test.** Find an agent that has this skill attached (`agents.list` →
   `agents.list_skills`), then call `agents.run_script` with a message that exercises the
   skill, and confirm the output is what the fix intended. Don't declare it fixed off a
   successful `skills.update` alone — verify the behavior.

Prefer concrete working code over placeholders. Surface any tool error verbatim (it carries a
domain code like `not_found` / `forbidden`) and stop rather than guessing.
