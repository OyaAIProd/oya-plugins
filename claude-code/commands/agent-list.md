---
description: List your Oya agents and show a status overview for one of them
---

You have the Oya MCP server connected (tools include `agents.list`, `agents.get`,
`agents.get_soul`, `agents.list_skills`, `routines.list`, `triggers.list`, `gateways.list`,
`knowledge_base.list_agent_knowledge`).

The user wants an overview of their agents: **$ARGUMENTS**

1. Call `agents.list` — it returns the caller's agents in the active workspace with counts and
   status. Present a compact table: name, id, mode, status, and the counts it gives you.
2. If the user named a specific agent (or asks to drill in), assemble a status card for it:
   - `agents.get` — mode, status, description.
   - `agents.get_soul` — persona, behavior_rules, welcome_message.
   - `agents.list_skills` — attached skills and whether each is enabled.
   - `routines.list` — scheduled routines and their cadences.
   - `triggers.list` — webhook triggers.
   - `gateways.list` — connected platforms (Slack, Gmail, ...) and their active state.
   - `knowledge_base.list_agent_knowledge` — KB entries assigned to it.
   Summarize; don't dump raw JSON unless the user asks for it. Flag anything that looks off (no
   skills attached, deployed but empty, a routine with no prompt) so the user can jump to
   `/oya:agent-debug`.
3. Print the chat URL `https://oya.ai/chat/<agent_id>` for any agent you detail.

Surface any tool error verbatim (it carries a domain code like `not_found` / `forbidden`) and
stop rather than guessing.
