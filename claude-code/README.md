# Oya plugin for Claude Code

Connects Claude Code to the **Oya MCP server** so you can build, deploy, and manage Oya
agents and skills without leaving your editor. Bundles the MCP connection plus two slash
commands (`/oya:skill-new`, `/oya:agent-deploy`).

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
  `agents.list/get/create/list_skills/add_skill/remove_skill/update_script/deploy/deploy_script/run_script`,
  `projects.*`, `knowledge_base.*`, `routines.*`, `triggers.*`, `organizations.*`, `api_keys.*`.
- **`/oya:skill-new <description>`** — scaffold a SKILL.md + script.py and publish via `skills.create`.
- **`/oya:agent-deploy <agent>`** — build + deploy an agent and optionally smoke-test it.

## Point at dev / local

Edit `.mcp.json` and change the URL:

- Dev: `https://dev.oya.ai/api/mcp`
- Local backend: `http://localhost:8000/api/mcp`

## Just the MCP server, no plugin

If you only want the connection (no commands), copy `.mcp.json` into your project root — Claude
Code auto-loads a project `.mcp.json`.
