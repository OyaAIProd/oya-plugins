---
description: Deploy an Oya agent (build its script to the sandbox and mark it live)
---

You have the Oya MCP server connected (tools include `agents.list`, `agents.get`,
`agents.update_script`, `agents.deploy`, `agents.deploy_script`, `agents.run_script`).

The user wants to deploy an agent: **$ARGUMENTS**

Do this:

1. If no agent id was given, call `agents.list` and ask the user which agent to deploy.
2. If they have local script changes to push first, call `agents.update_script` with the new
   source.
3. For a script-mode agent, call `agents.deploy_script` to build + upload the code to its
   sandbox; then `agents.deploy` to mark it live. Report each result.
4. Offer a smoke test: call `agents.run_script` once (optionally with a `user_message`) and
   summarize the run result. If it fails, drill in with `agents.get_runs` → `agents.get_run`.

To share a deployed agent, `agents.export` produces a portable OyaAgentSpec (credentials
stripped) that `agents.fork` re-creates elsewhere; `templates.create` turns it into a reusable
template.

Surface any tool error verbatim (it carries a domain code like `not_found` / `forbidden`)
and stop rather than guessing.
