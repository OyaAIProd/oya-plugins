# Oya plugin for OpenAI Codex CLI

A Codex **plugin** that bundles the Oya MCP connector plus a skill teaching Codex how to use
it, so you can manage Oya agents and skills from Codex.

Structure:

```
codex/
├── .codex-plugin/plugin.json   # manifest
├── mcp.json                    # the Oya MCP connector (url + OYA_API_KEY bearer)
└── skills/oya/SKILL.md         # how-to skill for the agent
```

## Install

```bash
export OYA_API_KEY="a2a_..."          # create one at https://oya.ai

# add the Oya marketplace (repo-scoped or personal), then install the plugin
codex plugin marketplace add OyaAIProd/oya-plugins
codex plugin install oya            # or run /plugins in a Codex session and pick "oya"
```

Start a new Codex session, then ask e.g. "list my Oya skills" or "deploy agent abc123".

## Verify

```bash
codex plugin list      # 'oya' should be listed
```
