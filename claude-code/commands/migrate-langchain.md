---
description: Bring your own LangChain / LangGraph agent to Oya — port the Python code into a deployed Oya agent
---

You have the Oya MCP server connected (tools include `agents.create`, `agents.update_script`,
`agents.update_secrets`, `agents.deploy_script`, `agents.deploy`, `agents.run_script`,
`skills.list`, `agents.add_skill`, `routines.create`).

The user wants to migrate a LangChain / LangGraph agent to Oya: **$ARGUMENTS**

LangChain is Python and an Oya **script-mode agent is one self-contained Python 3.11 script**,
so this is a near-direct port — not a rewrite. Ask for (or read from the repo) the agent's
source: the LLM setup, tools, prompt, and how it's invoked.

## How an Oya script agent runs (the contract you're porting to)

- The script is one file. Input arrives as **environment variables**: `USER_MESSAGE` (the raw
  user input) and `INPUT_JSON` (a merged JSON blob of the message + secrets + tool config).
  Read `os.environ["USER_MESSAGE"]`.
- The script's **stdout is the result**. Print your final answer (JSON is the convention).
- **Dependencies auto-install** from the script's `import` statements on deploy — `import
  langchain_openai` pulls `langchain-openai`, etc. No requirements file needed.
- **Secrets are env vars.** `OPENAI_API_KEY`, `TAVILY_API_KEY`, etc. are set once via
  `agents.update_secrets` and read with `os.environ[...]`.
- Declare I/O shape with `# INPUT_SCHEMA:` / `# OUTPUT_SCHEMA:` comment lines (JSON) so the
  chat wrapper knows the shapes.

## Steps

1. **Create the agent:** `agents.create` with `mode: "script"`, a name, and a one-line
   description. Capture `agent_id`.
2. **Port the code.** Wrap their LangChain agent so it reads `USER_MESSAGE` and prints the
   result. The chain/graph/tool code moves over unchanged. Example:

   ```python
   # INPUT_SCHEMA: {"type": "object", "properties": {"user_message": {"type": "string"}}}
   # OUTPUT_SCHEMA: {"type": "object", "properties": {"answer": {"type": "string"}}}
   import os, json
   from langchain_openai import ChatOpenAI
   from langchain.agents import create_react_agent, AgentExecutor
   from langchain_community.tools.tavily_search import TavilySearchResults
   from langchain import hub

   user_message = os.environ.get("USER_MESSAGE", "")

   llm = ChatOpenAI(model="gpt-4o", api_key=os.environ["OPENAI_API_KEY"])   # key = Oya secret
   tools = [TavilySearchResults(max_results=3)]                             # TAVILY_API_KEY = Oya secret
   agent = create_react_agent(llm, tools, hub.pull("hwchase17/react"))
   executor = AgentExecutor(agent=agent, tools=tools)

   result = executor.invoke({"input": user_message})
   print(json.dumps({"answer": result["output"]}))                          # stdout = result
   ```

   For **LangGraph**, it's the same shape — build your `StateGraph`, `app = graph.compile()`,
   then `print(json.dumps(app.invoke({"messages": [("user", user_message)]})))`.

3. **Push it:** `agents.update_script` with the full source.
4. **Move the keys:** `agents.update_secrets` with `{"OPENAI_API_KEY": "...", "TAVILY_API_KEY":
   "..."}` — every provider/API key your LangChain code read from env. Never hardcode them in
   the script. Ask the user for the values (or tell them to add them).
5. **Deploy:** `agents.deploy_script` (builds the sandbox and pip-installs the imports), then
   `agents.deploy` to go live.
6. **Smoke test:** `agents.run_script` with a representative `user_message`; read the run
   result and confirm the output matches the original agent's behavior. Iterate on the script
   if the output differs.

## Optional, higher-value follow-ups (offer these)

- **Drop the OpenAI key entirely:** replace `ChatOpenAI` with the platform LLM. Inside the
  sandbox, `import oya_runtime; oya_runtime.llm([{"role":"user","content":user_message}])`
  returns `{"content": ...}` billed to their Oya account — no API key to manage.
- **LangChain tools that already exist as Oya skills:** browse `skills.list`; if a tool (web
  search, Gmail, a CRM) maps to a catalog skill, attach it with `agents.add_skill` instead of
  carrying the dependency in-script.
- **Scheduled/cron LangChain jobs:** turn them into a `routines.create` (natural-language
  schedule) so Oya runs the agent on a cadence instead of the user's own scheduler.

Surface any tool error verbatim (domain codes like `not_found` / `forbidden`) and stop rather
than guessing. If a deploy fails on a dependency, read the error — it usually names the package
that didn't resolve; fix the import or pin a version and redeploy.
