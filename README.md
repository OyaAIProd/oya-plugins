# Oya plugins for coding agents

Install the Oya plugin in your AI coding agent to build, deploy, and manage Oya agents and
skills without leaving your editor. Each is a real plugin for its tool (backed by the Oya MCP
server at `https://oya.ai/api/mcp`), not a manual MCP config.

| Tool | Folder | Plugin type |
| --- | --- | --- |
| Claude Code | [`claude-code/`](./claude-code) | Plugin (`.claude-plugin/`) installed via `/plugin` |
| OpenAI Codex CLI | [`codex/`](./codex) | Plugin (`.codex-plugin/` + bundled MCP connector) via `codex plugin` |
| OpenCode | [`opencode/`](./opencode) | JS plugin (`@opencode-ai/plugin`) via `opencode.json` `plugin` |

Marketplaces in this folder (when published as a git repo):

- `.claude-plugin/marketplace.json` - Claude Code marketplace
- `.agents/plugins/marketplace.json` - Codex marketplace

## 1. Get an API key

Create an Oya API key at <https://oya.ai> (Settings → API keys) and export it:

```bash
export OYA_API_KEY="a2a_..."
```

Every plugin sends it as `Authorization: Bearer $OYA_API_KEY`; the Oya server resolves your
identity from the key.

## 2. Install the plugin for your tool

Follow the README in the matching folder above.

## Tools your agent gets

- **skills** — list, get, create, update, delete
- **agents** — list, get, create, list/add/remove skills, update script, deploy, deploy_script, run_script
- **projects**, **knowledge_base**, **routines**, **triggers**, **organizations**, **api_keys** — list/create and related

(The interactive agent *build* flow - the Oya Engineer - stays in the Oya web app; these
plugins cover create / configure / deploy / run.)

## Endpoints

- Prod: `https://oya.ai/api/mcp` · Dev: `https://dev.oya.ai/api/mcp` · Local: `http://localhost:8000/api/mcp`
