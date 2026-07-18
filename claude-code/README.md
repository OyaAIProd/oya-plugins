# Oya plugin for Claude Code

Connects Claude Code to the **Oya MCP server** so you can migrate existing agents to Oya and
build, deploy, and manage Oya agents and skills without leaving your editor. Bundles the MCP
connection plus slash commands — including bring-your-own-agent migration from **LangChain**,
**Mastra**, and **Claude Code** — covering the full agent + skill lifecycle.

## Prerequisites

Set your Oya API key in the environment Claude Code runs in:

```bash
export OYA_API_KEY="a2a_..."   # create one at https://oya.ai (Settings -> API keys)
```

The plugin reads `${OYA_API_KEY}` at load time and sends it as `Authorization: Bearer ...`.
If it's unset, Claude Code passes the literal string and the server rejects it — so export it
before launching `claude`.

## Install

```bash
# add this marketplace (from a local checkout of the monorepo)
/plugin marketplace add /path/to/A2ABaseAI/plugins
# or from GitHub once published:
# /plugin marketplace add OyaAIProd/oya-plugins

/plugin install oya@oya-plugins
```

Then verify the server is connected:

```bash
claude mcp list      # 'oya' should show as connected
```

## What you get

- **MCP tools** (namespaced `mcp__..._oya__<tool>`): `skills.list/get/create/update/delete`,
  `agents.list/get/create/get_soul/set_soul/list_skills/add_skill/remove_skill/sync_skills/update_script/deploy/deploy_script/run_script`,
  `templates.list/get/deploy`, `knowledge_base.create_folder/upload/assign_entry/list_*`,
  `routines.*`, `triggers.*`, `gateways.list/list_connections`, `projects.*`, `organizations.*`,
  `api_keys.*`.
- **Slash commands** covering the lifecycle:
  - **`/oya:migrate-langchain <agent>`** — bring your own LangChain / LangGraph agent to Oya (near-direct Python port, with code examples).
  - **`/oya:migrate-mastra <agent>`** — bring your own Mastra (TypeScript) agent to Oya (concept mapping + before/after code).
  - **`/oya:migrate-claude-code <agent>`** — bring your own Claude Code subagent / Claude Agent SDK agent to Oya (prompt → soul, tools → skills).
  - **`/oya:agent-new <description>`** — create an agent and configure it end to end (skills, routines, KB, deploy).
  - **`/oya:agent-list [name]`** — list your agents; drill into one for a status overview.
  - **`/oya:agent-debug <agent>`** — diagnose a failing agent or make a targeted edit (reproduce with `run_script`, fix, redeploy).
  - **`/oya:agent-skills <agent>`** — browse the catalog and add/remove skills on an agent.
  - **`/oya:agent-deploy <agent>`** — build + deploy an agent and optionally smoke-test it.
  - **`/oya:routine-new <agent>`** — add/list/run scheduled routines and webhook triggers.
  - **`/oya:skill-new <description>`** — scaffold a SKILL.md + script.py and publish via `skills.create`.
  - **`/oya:skill-edit <skill>`** — pull an existing skill, edit code/schema, push back with `skills.update`, smoke-test.

Gateway/OAuth connection and free-form soul/persona editing aren't exposed over MCP — the
commands point you to the Oya web app to finish those.

## Point at dev / local

Edit `.mcp.json` and change the URL:

- Dev: `https://dev.oya.ai/api/mcp`
- Local backend: `http://localhost:8000/api/mcp`

## Just the MCP server, no plugin

If you only want the connection (no commands), copy `.mcp.json` into your project root — Claude
Code auto-loads a project `.mcp.json`.
