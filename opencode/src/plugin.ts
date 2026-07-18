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
      oya_skill_update: tool({
        description:
          "Edit a user-owned Oya skill (partial): any of name, description, category, skill_md, script_content, scripts, tool_schema.",
        args: {
          skill_id: tool.schema.string(),
          skill_md: tool.schema.string().optional(),
          script_content: tool.schema.string().optional(),
          tool_schema_json: tool.schema.string().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = { skill_id: args.skill_id };
          if (args.skill_md) payload.skill_md = args.skill_md;
          if (args.script_content) payload.script_content = args.script_content;
          if (args.tool_schema_json) payload.tool_schema = JSON.parse(args.tool_schema_json);
          return await callTool("skills.update", payload);
        },
      }),
      oya_agents_list: tool({
        description: "List your Oya agents.",
        args: {},
        async execute() {
          return await callTool("agents.list", {});
        },
      }),
      oya_agent_get: tool({
        description: "Get one Oya agent by id (mode, status, system prompt, description).",
        args: { agent_id: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.get", { agent_id: args.agent_id });
        },
      }),
      oya_agent_create: tool({
        description:
          "Create an Oya agent. mode is 'skills' or 'script'; system_prompt is the persona + behavior rules.",
        args: {
          name: tool.schema.string(),
          mode: tool.schema.string(),
          description: tool.schema.string().optional(),
          system_prompt: tool.schema.string().optional(),
        },
        async execute(args) {
          return await callTool("agents.create", {
            name: args.name,
            mode: args.mode,
            description: args.description || "",
            system_prompt: args.system_prompt || "",
          });
        },
      }),
      oya_agent_get_soul: tool({
        description: "Get an Oya agent's soul (persona, behavior_rules, welcome_message).",
        args: { agent_id: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.get_soul", { agent_id: args.agent_id });
        },
      }),
      oya_agent_set_soul: tool({
        description:
          "Set an Oya agent's soul (identity loaded every turn). Send only the fields to change: persona, behavior_rules (JSON array), welcome_message, mission.",
        args: {
          agent_id: tool.schema.string(),
          persona: tool.schema.string().optional(),
          behavior_rules_json: tool.schema.string().optional(),
          welcome_message: tool.schema.string().optional(),
          mission: tool.schema.string().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = { agent_id: args.agent_id };
          if (args.persona) payload.persona = args.persona;
          if (args.behavior_rules_json) payload.behavior_rules = JSON.parse(args.behavior_rules_json);
          if (args.welcome_message) payload.welcome_message = args.welcome_message;
          if (args.mission) payload.mission = args.mission;
          return await callTool("agents.set_soul", payload);
        },
      }),
      oya_agent_skills_list: tool({
        description: "List the skills attached to one Oya agent (enabled state + config).",
        args: { agent_id: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.list_skills", { agent_id: args.agent_id });
        },
      }),
      oya_agent_add_skill: tool({
        description: "Attach a catalog skill to an Oya agent (optional config/credentials JSON).",
        args: {
          agent_id: tool.schema.string(),
          skill_id: tool.schema.string(),
          config_json: tool.schema.string().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = {
            agent_id: args.agent_id,
            skill_id: args.skill_id,
          };
          if (args.config_json) payload.config = JSON.parse(args.config_json);
          return await callTool("agents.add_skill", payload);
        },
      }),
      oya_agent_remove_skill: tool({
        description: "Detach a skill from an Oya agent.",
        args: { agent_id: tool.schema.string(), skill_id: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.remove_skill", {
            agent_id: args.agent_id,
            skill_id: args.skill_id,
          });
        },
      }),
      oya_agent_sync_skills: tool({
        description:
          "Declare an Oya agent's full enabled skill set in one call. skills_json is a JSON array of {skill_id, config?, credentials?}.",
        args: { agent_id: tool.schema.string(), skills_json: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.sync_skills", {
            agent_id: args.agent_id,
            skills: JSON.parse(args.skills_json),
          });
        },
      }),
      oya_templates_list: tool({
        description: "Browse the Oya agent templates you can deploy (each a complete curated agent).",
        args: {},
        async execute() {
          return await callTool("templates.list", {});
        },
      }),
      oya_template_deploy: tool({
        description:
          "Quickstart: instantiate a complete Oya agent from a template (skills + routines + soul preconfigured). Returns the new agent_id.",
        args: {
          template_id: tool.schema.string(),
          agent_name: tool.schema.string().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = { template_id: args.template_id };
          if (args.agent_name) payload.agent_name = args.agent_name;
          return await callTool("templates.deploy", payload);
        },
      }),
      oya_kb_upload: tool({
        description:
          "Upload a text/markdown document into an Oya knowledge-base folder. Returns the entry_id (assign it with oya_kb_assign_entry).",
        args: {
          folder_id: tool.schema.string(),
          filename: tool.schema.string(),
          content: tool.schema.string(),
        },
        async execute(args) {
          return await callTool("knowledge_base.upload", {
            folder_id: args.folder_id,
            filename: args.filename,
            content: args.content,
          });
        },
      }),
      oya_kb_assign_entry: tool({
        description: "Assign a knowledge-base entry to an Oya agent so it can look it up via search-kb.",
        args: { agent_id: tool.schema.string(), entry_id: tool.schema.string() },
        async execute(args) {
          return await callTool("knowledge_base.assign_entry", {
            agent_id: args.agent_id,
            entry_id: args.entry_id,
            enabled: true,
          });
        },
      }),
      oya_gateways_list: tool({
        description: "List the gateways (connected platforms) attached to one Oya agent.",
        args: { agent_id: tool.schema.string() },
        async execute(args) {
          return await callTool("gateways.list", { agent_id: args.agent_id });
        },
      }),
      oya_routines_list: tool({
        description: "List an Oya agent's scheduled routines.",
        args: { agent_id: tool.schema.string() },
        async execute(args) {
          return await callTool("routines.list", { agent_id: args.agent_id });
        },
      }),
      oya_routine_create: tool({
        description:
          "Create a scheduled routine for an Oya agent. schedule is natural language (e.g. 'every weekday at 9am').",
        args: {
          agent_id: tool.schema.string(),
          name: tool.schema.string(),
          prompt: tool.schema.string(),
          schedule: tool.schema.string(),
        },
        async execute(args) {
          return await callTool("routines.create", {
            agent_id: args.agent_id,
            name: args.name,
            prompt: args.prompt,
            schedule: args.schedule,
          });
        },
      }),
      oya_routine_trigger: tool({
        description: "Run an Oya routine once immediately, out of schedule.",
        args: { routine_id: tool.schema.string() },
        async execute(args) {
          return await callTool("routines.trigger", { routine_id: args.routine_id });
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
