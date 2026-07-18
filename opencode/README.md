# Oya plugin for OpenCode

An OpenCode **plugin** (`@opencode-ai/plugin`) that registers Oya tools as native OpenCode
tools, proxying to the Oya MCP server. No manual MCP config. Covers the agent + skill
lifecycle: `oya_agents_list`, `oya_agent_get`, `oya_agent_create`, `oya_agent_get_soul`,
`oya_agent_set_soul`, `oya_agent_deploy`, `oya_agent_run`, `oya_agent_skills_list`,
`oya_agent_add_skill`, `oya_agent_remove_skill`, `oya_agent_sync_skills`, `oya_skills_list`,
`oya_skill_get`, `oya_skill_create`, `oya_skill_update`, `oya_templates_list`,
`oya_template_deploy`, `oya_kb_upload`, `oya_kb_assign_entry`, `oya_routines_list`,
`oya_routine_create`, `oya_routine_trigger`, `oya_gateways_list`, and `oya_call` (escape hatch
for any other MCP tool).

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
