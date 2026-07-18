---
description: Bring your own Mastra (TypeScript) agent to Oya — reimplement it as a deployed Oya agent
---

You have the Oya MCP server connected (tools include `agents.create`, `agents.set_soul`,
`agents.update_script`, `agents.update_secrets`, `agents.deploy_script`, `agents.deploy`,
`agents.run_script`, `skills.list`, `agents.add_skill`, `skills.create`, `routines.create`).

The user wants to migrate a Mastra agent to Oya: **$ARGUMENTS**

Mastra is TypeScript/Node; the **Oya sandbox runs Python 3.11 only**. So this is a structured
reimplementation, not a copy-paste. The good news: Mastra's concepts map cleanly onto Oya's.
Ask for (or read from the repo) the Mastra agent — its `instructions`, `model`, `tools`, any
`workflows`, and its `memory` config.

## Concept mapping

| Mastra | Oya |
| --- | --- |
| `new Agent({ instructions, model })` | A **script-mode agent** whose script calls an LLM, **or** a skills-mode agent with a soul (`agents.set_soul`: persona + behavior_rules) |
| `createTool({ id, inputSchema, execute })` | A Python function in the script, **or** a reusable Oya **skill** (`skills.create`) if you want it shared across agents |
| `openai("gpt-4o")` / `@ai-sdk/*` | `openai` / `anthropic` Python SDK with the key as an Oya secret, **or** keyless `oya_runtime.llm(...)` in the sandbox |
| Mastra **workflow** (`.step()` chains) | Plain Python control flow in the script; for scheduled/multi-stage runs, an Oya **routine** (`routines.create`) |
| Mastra **memory** | Oya agent memory + knowledge base; or `oya_runtime.state` for cross-run key/value state |
| Zod `inputSchema` | The `# INPUT_SCHEMA:` comment (JSON Schema) at the top of the script |

## How an Oya script agent runs (the target contract)

- One self-contained Python file. Input is the `USER_MESSAGE` env var; **stdout is the result**
  (print JSON). Dependencies auto-install from `import` lines on deploy. Secrets are env vars
  set via `agents.update_secrets`.

## Steps

1. **Create:** `agents.create` with `mode: "script"`, name, description → capture `agent_id`.
   If the agent is more conversational than task-shaped, consider `mode: "skills"` + a soul
   instead (ask the user; script mode is the default for a ported Mastra agent).
2. **Translate the code.** Rebuild the agent loop in Python. Example — a Mastra weather agent:

   ```typescript
   // BEFORE (Mastra / TypeScript)
   const weatherTool = createTool({
     id: "get-weather",
     inputSchema: z.object({ city: z.string() }),
     execute: async ({ context }) =>
       (await fetch(`https://api.example.com/weather/${context.city}`)).json(),
   });
   export const agent = new Agent({
     name: "Weather Agent",
     instructions: "You are a concise weather assistant.",
     model: openai("gpt-4o"),
     tools: { weatherTool },
   });
   ```

   ```python
   # AFTER (Oya / Python — script.py)
   # INPUT_SCHEMA: {"type": "object", "properties": {"user_message": {"type": "string"}}}
   # OUTPUT_SCHEMA: {"type": "object", "properties": {"answer": {"type": "string"}}}
   import os, json, httpx
   from openai import OpenAI

   user_message = os.environ.get("USER_MESSAGE", "")
   client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])   # key = Oya secret

   def get_weather(city: str) -> dict:                      # Mastra tool -> Python function
       return httpx.get(f"https://api.example.com/weather/{city}").json()

   tools = [{"type": "function", "function": {
       "name": "get_weather", "description": "Weather for a city",
       "parameters": {"type": "object", "properties": {"city": {"type": "string"}},
                      "required": ["city"]}}}]

   messages = [{"role": "system", "content": "You are a concise weather assistant."},
               {"role": "user", "content": user_message}]
   resp = client.chat.completions.create(model="gpt-4o", messages=messages, tools=tools)
   msg = resp.choices[0].message
   if msg.tool_calls:                                       # one round of tool use
       call = msg.tool_calls[0]
       out = get_weather(**json.loads(call.function.arguments))
       messages += [msg, {"role": "tool", "tool_call_id": call.id, "content": json.dumps(out)}]
       resp = client.chat.completions.create(model="gpt-4o", messages=messages)
       msg = resp.choices[0].message

   print(json.dumps({"answer": msg.content}))               # stdout = result
   ```

   (To drop the OpenAI key: swap `client.chat.completions.create(...)` for
   `oya_runtime.llm(messages, ...)` inside the sandbox — billed to their Oya account.)

3. **Push:** `agents.update_script` with the source.
4. **Secrets:** `agents.update_secrets` with every key the Mastra agent used (`OPENAI_API_KEY`,
   any tool API keys). Ask the user for values.
5. **Deploy:** `agents.deploy_script` (installs the imports) then `agents.deploy`.
6. **Smoke test:** `agents.run_script` with a representative `user_message`; compare the output
   to the Mastra agent and iterate.

## Follow-ups (offer these)

- **Reusable tools:** if a Mastra tool is used by more than one agent, author it as an Oya skill
  (`skills.create`) and attach with `agents.add_skill` instead of inlining it — browse
  `skills.list` first in case it already exists in the catalog.
- **Workflows / triggers:** a Mastra workflow that ran on a schedule → `routines.create`; one
  that fired on an external event → a webhook trigger.

Surface any tool error verbatim (domain codes like `not_found` / `forbidden`) and stop rather
than guessing. If a deploy fails on a dependency, read the error — it names the package; fix
the import or pin a version and redeploy.
