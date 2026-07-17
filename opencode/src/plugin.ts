/**
 * Oya plugin for OpenCode.
 *
 * Registers Oya tools (skills, agents, deploy, ...) as native OpenCode tools by proxying to
 * the Oya MCP server over JSON-RPC. Reads credentials from the environment:
 *   OYA_API_KEY  (required) - your Oya API key, sent as `Authorization: Bearer`
 *   OYA_MCP_URL  (optional) - defaults to https://oya.ai/api/mcp
 */
import { type Plugin, tool } from "@opencode-ai/plugin";

const MCP_URL = process.env.OYA_MCP_URL || "https://oya.ai/api/mcp";
const API_KEY = process.env.OYA_API_KEY || "";

let rpcId = 0;

async function callTool(name: string, args: Record<string, unknown>): Promise<string> {
  rpcId += 1;
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: rpcId,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "oya rpc error");
  const result = data.result || {};
  const text: string = result?.content?.[0]?.text ?? "";
  if (result.isError) throw new Error(text || "oya tool error");
  return text;
}

export const OyaPlugin: Plugin = async () => {
  return {
    tool: {
      oya_skills_list: tool({
        description: "List the Oya skills visible to you (system + owned).",
        args: {},
        async execute() {
          return await callTool("skills.list", {});
        },
      }),
      oya_skill_get: tool({
        description: "Get one Oya skill from the catalog by id.",
        args: { skill_id: tool.schema.string() },
        async execute(args) {
          return await callTool("skills.get", { skill_id: args.skill_id });
        },
      }),
      oya_skill_create: tool({
        description:
          "Create an Oya skill from a SKILL.md (frontmatter + body) and a script.py.",
        args: { skill_md: tool.schema.string(), script_py: tool.schema.string() },
        async execute(args) {
          return await callTool("skills.create", {
            skill_md: args.skill_md,
            script_py: args.script_py,
          });
        },
      }),
      oya_agents_list: tool({
        description: "List your Oya agents.",
        args: {},
        async execute() {
          return await callTool("agents.list", {});
        },
      }),
      oya_agent_deploy: tool({
        description: "Deploy an Oya agent (build its script and mark it live).",
        args: { agent_id: tool.schema.string() },
        async execute(args) {
          await callTool("agents.deploy_script", { agent_id: args.agent_id });
          return await callTool("agents.deploy", { agent_id: args.agent_id });
        },
      }),
      oya_agent_run: tool({
        description: "Run a deployed Oya script agent once, with an optional user message.",
        args: { agent_id: tool.schema.string(), user_message: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.run_script", {
            agent_id: args.agent_id,
            user_message: args.user_message || "",
          });
        },
      }),
      oya_call: tool({
        description:
          "Escape hatch: call any Oya MCP tool by name with a JSON object of arguments (e.g. tool='routines.create').",
        args: { tool: tool.schema.string(), arguments_json: tool.schema.string() },
        async execute(args) {
          const parsed = args.arguments_json ? JSON.parse(args.arguments_json) : {};
          return await callTool(args.tool, parsed);
        },
      }),
    },
  };
};

export default OyaPlugin;
