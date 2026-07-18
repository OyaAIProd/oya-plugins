---
description: Bring your own Claude Code subagent (or Claude Agent SDK agent) to Oya — map its prompt and tools onto a deployed Oya agent
---

You have the Oya MCP server connected (tools include `agents.create`, `agents.set_soul`,
`skills.list`, `skills.get`, `agents.sync_skills`, `agents.add_skill`, `agents.update_script`,
`agents.update_secrets`, `agents.deploy_script`, `agents.deploy`, `agents.run_script`,
`routines.create`).

The user wants to migrate a Claude Code agent to Oya: **$ARGUMENTS**

There are two shapes of "Claude Code agent" — handle whichever they have:

- **A subagent definition** (`.claude/agents/<name>.md`): YAML frontmatter (`name`,
  `description`, `tools`, `model`) plus a system-prompt body. This is **instructions + a tool
  allowlist, no code** → it maps to an Oya **skills-mode** agent. This is the common case.
- **A Claude Agent SDK program** (`claude-agent-sdk` / `@anthropic-ai/claude-agent-sdk` — a
  Python/TS script with a `query()` loop and custom tools): this is code → migrate it like a
  LangChain agent into an Oya **script-mode** agent (see `/oya:migrate-langchain` for the
  script contract; the steps below note the differences).

Read the agent file(s) from the repo before starting.

## Subagent → skills-mode Oya agent (the common case)

An Oya skills-mode agent has a **soul** (identity, loaded every turn) and a set of **catalog
skills** (its tools). The subagent's prompt becomes the soul; its `tools` become skills.

**Honest constraint:** Claude Code tools are *coding-environment* tools (`Read`, `Write`,
`Edit`, `Bash`, `Grep`, `Glob`) — an Oya agent runs in a sandbox over gateways and skills, not
a local checkout, so those have **no 1:1 Oya equivalent**. Capability-level tools map cleanly.
A subagent that's a *researcher / summarizer / classifier / SDR / assistant* persona ports
well; one whose whole job is editing local files does not — say so if that's what you're
looking at.

### Tool mapping (verify against `skills.list` — ids can change)

| Claude Code tool | Oya skill |
| --- | --- |
| `WebSearch` | `web-search` |
| `WebFetch` | `web-search` (fetch/read-url) |
| (persistent memory / notes) | `memory` |
| (current date/time) | `current-time` |
| (knowledge/doc lookup) | `search-kb` + uploaded KB |
| MCP tools (Gmail, Slack, CRM, ...) | the matching Oya gateway skill (browse `skills.list`) |
| `Read` / `Write` / `Edit` / `Bash` / `Grep` / `Glob` | no direct equivalent — drop or replace with a purpose-built skill (`/oya:skill-new`) |

### Steps

1. **Create:** `agents.create` with `mode: "skills"`, a name (from the subagent's `name`), and a
   one-line description (from its `description`).
2. **Prompt → soul:** `agents.set_soul`. Turn the system-prompt body into a `persona` (the
   role, a few lines) and `behavior_rules` (its instructions, as a list of specific rules).
   Add a `welcome_message`. Example:

   ```markdown
   # BEFORE — .claude/agents/research-assistant.md
   ---
   name: research-assistant
   description: Deep, multi-source research questions
   tools: WebSearch, WebFetch, Read
   model: sonnet
   ---
   You are a meticulous research assistant. Search multiple sources, cross-check
   every claim, and produce a cited summary. Never state a fact you could not verify.
   Prefer primary sources.
   ```

   ```
   # AFTER — agents.set_soul arguments
   persona: "A meticulous research assistant that answers hard questions from multiple sources."
   behavior_rules: [
     "Search multiple independent sources before answering",
     "Cross-check every claim; never state a fact you could not verify",
     "Prefer primary sources over summaries",
     "Always cite the sources behind each claim",
   ]
   welcome_message: "Ask me anything you need researched — I'll dig, verify, and cite."
   ```

3. **Tools → skills:** browse `skills.list`, then declare the whole set with
   `agents.sync_skills` (a list of `{skill_id}`). For the example above:
   `[{"skill_id":"web-search"},{"skill_id":"memory"},{"skill_id":"current-time"}]`. If the
   subagent relied on a capability with no catalog skill, pause and run `/oya:skill-new` to
   author it, then include it.
4. **Model:** Oya picks the agent's model in its own config; there's no MCP field for it, so
   note the original `model:` for the user and move on (they can set it in the web app if they
   care).
5. **Deploy:** `agents.deploy`. Skills-mode agents run interactively, so **test in chat** at
   `https://oya.ai/chat/<agent_id>` rather than `agents.run_script` — print that URL.
6. **Recurring version?** If the subagent was something the user kicked off on a schedule, add a
   `routines.create` so Oya runs it on a cadence.

## Claude Agent SDK program → script-mode Oya agent

If it's code (a `query()` / tool-loop script), it's a port, not a prompt mapping:

1. `agents.create` with `mode: "script"`.
2. Rewrite the entry so it reads `os.environ["USER_MESSAGE"]` and `print(json.dumps(result))`
   (the Oya script contract — stdout is the result, imports auto-install on deploy, secrets are
   env vars). Custom Agent-SDK tools become plain Python functions in the script, or reusable
   Oya skills (`skills.create`).
3. `agents.update_script` → `agents.update_secrets` (any `ANTHROPIC_API_KEY` / tool keys) →
   `agents.deploy_script` → `agents.deploy` → `agents.run_script` to smoke-test. To drop the
   Anthropic key, call `oya_runtime.llm(messages)` in the sandbox (billed to the Oya account).

Surface any tool error verbatim (domain codes like `not_found` / `forbidden`) and stop rather
than guessing.
