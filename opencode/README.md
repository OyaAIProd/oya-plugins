# Oya plugin for OpenCode

An OpenCode **plugin** (`@opencode-ai/plugin`) that registers Oya tools (`oya_skills_list`,
`oya_skill_create`, `oya_agents_list`, `oya_agent_deploy`, `oya_agent_run`, `oya_call`, ...) as
native OpenCode tools, proxying to the Oya MCP server. No manual MCP config.

```
opencode/
├── package.json          # @oyadotai/opencode-plugin
└── src/plugin.ts         # registers the Oya tools
```

## Install

```bash
export OYA_API_KEY="a2a_..."   # create one at https://oya.ai
```

Add the plugin to your OpenCode config (`~/.config/opencode/opencode.json` or a project
`opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@oyadotai/opencode-plugin"]
}
```

OpenCode installs the package automatically. Or, for local development, drop
[`src/plugin.ts`](./src/plugin.ts) into `.opencode/plugins/oya.ts` (project) or
`~/.config/opencode/plugins/oya.ts` (global) and it auto-loads.

## Config

- `OYA_API_KEY` (required) - your Oya API key, sent as `Authorization: Bearer`.
- `OYA_MCP_URL` (optional) - defaults to `https://oya.ai/api/mcp`. Set to
  `https://dev.oya.ai/api/mcp` or `http://localhost:8000/api/mcp` for dev/local.

Then ask OpenCode e.g. "list my Oya skills" or "create a skill that posts a daily standup".
