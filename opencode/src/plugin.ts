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
      oya_gateway_connect: tool({
        description:
          "Connect a platform gateway (slack, gmail, jira, ...) to an Oya agent. Returns a browser install_url the user opens to authorize (OAuth needs a browser); then call oya_gateways_list to confirm. Pass connection_id (from oya_gateways_list_connections) to reuse an existing connection with no browser step.",
        args: {
          agent_id: tool.schema.string(),
          platform: tool.schema.string(),
          connection_id: tool.schema.string().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = { agent_id: args.agent_id, platform: args.platform };
          if (args.connection_id) payload.connection_id = args.connection_id;
          return await callTool("gateways.connect", payload);
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
      oya_skill_delete: tool({
        description: "Delete a user-owned (non-system) Oya skill.",
        args: { skill_id: tool.schema.string() },
        async execute(args) {
          return await callTool("skills.delete", { skill_id: args.skill_id });
        },
      }),
      oya_agent_update: tool({
        description:
          "Edit an Oya agent's top-level fields (partial): any of name, description, system_prompt, chat_model, is_active.",
        args: {
          agent_id: tool.schema.string(),
          name: tool.schema.string().optional(),
          description: tool.schema.string().optional(),
          system_prompt: tool.schema.string().optional(),
          chat_model: tool.schema.string().optional(),
          is_active: tool.schema.boolean().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = { agent_id: args.agent_id };
          if (args.name !== undefined) payload.name = args.name;
          if (args.description !== undefined) payload.description = args.description;
          if (args.system_prompt !== undefined) payload.system_prompt = args.system_prompt;
          if (args.chat_model !== undefined) payload.chat_model = args.chat_model;
          if (args.is_active !== undefined) payload.is_active = args.is_active;
          return await callTool("agents.update", payload);
        },
      }),
      oya_agent_update_script: tool({
        description: "Replace a script-mode Oya agent's Python source (does not deploy).",
        args: { agent_id: tool.schema.string(), script: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.update_script", {
            agent_id: args.agent_id,
            script: args.script,
          });
        },
      }),
      oya_agent_update_skill: tool({
        description:
          "Update a skill already attached to an Oya agent: toggle enabled, or swap config/credentials JSON.",
        args: {
          agent_id: tool.schema.string(),
          skill_id: tool.schema.string(),
          enabled: tool.schema.boolean().optional(),
          config_json: tool.schema.string().optional(),
          credentials_json: tool.schema.string().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = {
            agent_id: args.agent_id,
            skill_id: args.skill_id,
          };
          if (args.enabled !== undefined) payload.enabled = args.enabled;
          if (args.config_json) payload.config = JSON.parse(args.config_json);
          if (args.credentials_json) payload.credentials = JSON.parse(args.credentials_json);
          return await callTool("agents.update_skill", payload);
        },
      }),
      oya_agent_update_secrets: tool({
        description:
          "Set or replace a script-mode Oya agent's secret env vars (merged). secrets_json is a JSON {KEY: value} map.",
        args: { agent_id: tool.schema.string(), secrets_json: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.update_secrets", {
            agent_id: args.agent_id,
            secrets: JSON.parse(args.secrets_json),
          });
        },
      }),
      oya_agent_delete_secret: tool({
        description: "Delete one secret env var from a script-mode Oya agent by key.",
        args: { agent_id: tool.schema.string(), key: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.delete_secret", { agent_id: args.agent_id, key: args.key });
        },
      }),
      oya_agent_runs: tool({
        description:
          "List an Oya agent's recent runs (job_id, source, exit_code, timing). Start here to debug a failure, then drill in with oya_agent_run_get.",
        args: { agent_id: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.get_runs", { agent_id: args.agent_id });
        },
      }),
      oya_agent_run_get: tool({
        description:
          "Get the full payload + result of a single Oya run by job_id (status merged with result once done/failed).",
        args: { job_id: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.get_run", { job_id: args.job_id });
        },
      }),
      oya_agent_threads: tool({
        description: "List an Oya agent's chat threads (thread_id, title, updated_at).",
        args: { agent_id: tool.schema.string(), limit: tool.schema.number().optional() },
        async execute(args) {
          const payload: Record<string, unknown> = { agent_id: args.agent_id };
          if (args.limit !== undefined) payload.limit = args.limit;
          return await callTool("agents.list_threads", payload);
        },
      }),
      oya_agent_thread: tool({
        description:
          "Show the messages in an Oya chat thread (full conversation, including tool calls) by thread_id.",
        args: { thread_id: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.get_thread", { thread_id: args.thread_id });
        },
      }),
      oya_agent_trace: tool({
        description: "Fetch a run's LLM trace (local span tree, else Langfuse) by trace_id.",
        args: { trace_id: tool.schema.string() },
        async execute(args) {
          return await callTool("agents.get_trace", { trace_id: args.trace_id });
        },
      }),
      oya_agent_export: tool({
        description:
          "Export an Oya agent as a portable OyaAgentSpec v1 (soul + skills + routines, optional knowledge base). Credentials stripped. Re-create it with oya_agent_fork.",
        args: { agent_id: tool.schema.string(), include_kb: tool.schema.boolean().optional() },
        async execute(args) {
          const payload: Record<string, unknown> = { agent_id: args.agent_id };
          if (args.include_kb !== undefined) payload.include_kb = args.include_kb;
          return await callTool("agents.export", payload);
        },
      }),
      oya_agent_fork: tool({
        description:
          "Create a new Oya agent from an OyaAgentSpec object (the shape oya_agent_export returns). spec_json is the spec as JSON; optional name overrides the agent name. Returns the new agent_id.",
        args: { spec_json: tool.schema.string(), name: tool.schema.string().optional() },
        async execute(args) {
          const payload: Record<string, unknown> = { spec: JSON.parse(args.spec_json) };
          if (args.name) payload.name = args.name;
          return await callTool("agents.fork", payload);
        },
      }),
      oya_kb_list_folders: tool({
        description: "List your Oya knowledge-base folders.",
        args: {},
        async execute() {
          return await callTool("knowledge_base.list_folders", {});
        },
      }),
      oya_kb_create_folder: tool({
        description: "Create an Oya knowledge-base folder. Returns the folder_id.",
        args: { name: tool.schema.string(), description: tool.schema.string().optional() },
        async execute(args) {
          const payload: Record<string, unknown> = { name: args.name };
          if (args.description) payload.description = args.description;
          return await callTool("knowledge_base.create_folder", payload);
        },
      }),
      oya_kb_list_entries: tool({
        description: "List Oya knowledge-base entries, optionally scoped to one folder_id.",
        args: { folder_id: tool.schema.string().optional() },
        async execute(args) {
          const payload: Record<string, unknown> = {};
          if (args.folder_id) payload.folder_id = args.folder_id;
          return await callTool("knowledge_base.list_entries", payload);
        },
      }),
      oya_kb_list_agent_knowledge: tool({
        description: "List the knowledge-base entries assigned to one Oya agent.",
        args: { agent_id: tool.schema.string() },
        async execute(args) {
          return await callTool("knowledge_base.list_agent_knowledge", { agent_id: args.agent_id });
        },
      }),
      oya_kb_delete_entry: tool({
        description: "Delete an Oya knowledge-base entry by entry_id (removes it everywhere assigned).",
        args: { entry_id: tool.schema.string() },
        async execute(args) {
          return await callTool("knowledge_base.delete_entry", { entry_id: args.entry_id });
        },
      }),
      oya_kb_unassign_entry: tool({
        description: "Unassign a knowledge-base entry from one Oya agent (keeps the entry).",
        args: { agent_id: tool.schema.string(), entry_id: tool.schema.string() },
        async execute(args) {
          return await callTool("knowledge_base.assign_entry", {
            agent_id: args.agent_id,
            entry_id: args.entry_id,
            enabled: false,
          });
        },
      }),
      oya_routine_update: tool({
        description:
          "Update an Oya routine in place (partial): name, prompt, schedule (natural language), schedule_cron, output_channel, is_active.",
        args: {
          routine_id: tool.schema.string(),
          name: tool.schema.string().optional(),
          prompt: tool.schema.string().optional(),
          schedule: tool.schema.string().optional(),
          schedule_cron: tool.schema.string().optional(),
          output_channel: tool.schema.string().optional(),
          is_active: tool.schema.boolean().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = { routine_id: args.routine_id };
          if (args.name !== undefined) payload.name = args.name;
          if (args.prompt !== undefined) payload.prompt = args.prompt;
          if (args.schedule !== undefined) payload.schedule = args.schedule;
          if (args.schedule_cron !== undefined) payload.schedule_cron = args.schedule_cron;
          if (args.output_channel !== undefined) payload.output_channel = args.output_channel;
          if (args.is_active !== undefined) payload.is_active = args.is_active;
          return await callTool("routines.update", payload);
        },
      }),
      oya_routine_delete: tool({
        description: "Delete an Oya routine by id.",
        args: { routine_id: tool.schema.string() },
        async execute(args) {
          return await callTool("routines.delete", { routine_id: args.routine_id });
        },
      }),
      oya_template_get: tool({
        description: "Get one Oya template's detail (skills, routines, required inputs) by id.",
        args: { template_id: tool.schema.string() },
        async execute(args) {
          return await callTool("templates.get", { template_id: args.template_id });
        },
      }),
      oya_template_create: tool({
        description:
          "Create an Oya template you own. content_json is the TEMPLATE.yaml-shaped object (soul, skills, routines). Build one from an agent with oya_agent_export first.",
        args: {
          name: tool.schema.string(),
          display_name: tool.schema.string().optional(),
          description: tool.schema.string().optional(),
          category: tool.schema.string().optional(),
          content_json: tool.schema.string().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = { name: args.name };
          if (args.display_name) payload.display_name = args.display_name;
          if (args.description) payload.description = args.description;
          if (args.category) payload.category = args.category;
          if (args.content_json) payload.content = JSON.parse(args.content_json);
          return await callTool("templates.create", payload);
        },
      }),
      oya_template_update: tool({
        description:
          "Edit an Oya template you own (partial): display_name, description, category, icon, color, content_json.",
        args: {
          template_id: tool.schema.string(),
          display_name: tool.schema.string().optional(),
          description: tool.schema.string().optional(),
          category: tool.schema.string().optional(),
          content_json: tool.schema.string().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = { template_id: args.template_id };
          if (args.display_name) payload.display_name = args.display_name;
          if (args.description) payload.description = args.description;
          if (args.category) payload.category = args.category;
          if (args.content_json) payload.content = JSON.parse(args.content_json);
          return await callTool("templates.update", payload);
        },
      }),
      oya_template_fork: tool({
        description: "Fork a built-in or agency Oya template into your account so you can edit it.",
        args: { template_id: tool.schema.string(), name: tool.schema.string().optional() },
        async execute(args) {
          const payload: Record<string, unknown> = { template_id: args.template_id };
          if (args.name) payload.name = args.name;
          return await callTool("templates.fork", payload);
        },
      }),
      oya_template_delete: tool({
        description: "Delete an Oya template you own by id.",
        args: { template_id: tool.schema.string() },
        async execute(args) {
          return await callTool("templates.delete", { template_id: args.template_id });
        },
      }),
      oya_template_apply: tool({
        description:
          "Replay a template's soul + skills + routines onto an existing Oya agent (additive). Unlike oya_template_deploy, edits an agent you already have instead of creating one.",
        args: {
          template_id: tool.schema.string(),
          agent_id: tool.schema.string(),
          deploy_inputs_json: tool.schema.string().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = {
            template_id: args.template_id,
            agent_id: args.agent_id,
          };
          if (args.deploy_inputs_json) payload.deploy_inputs = JSON.parse(args.deploy_inputs_json);
          return await callTool("templates.apply", payload);
        },
      }),
      oya_triggers_list: tool({
        description: "List an Oya agent's webhook triggers (external events that start a run).",
        args: { agent_id: tool.schema.string() },
        async execute(args) {
          return await callTool("triggers.list", { agent_id: args.agent_id });
        },
      }),
      oya_trigger_create_webhook: tool({
        description:
          "Create a webhook trigger for an Oya agent (e.g. Stripe events, GitHub push). Returns the webhook URL + secret.",
        args: {
          agent_id: tool.schema.string(),
          name: tool.schema.string(),
          description: tool.schema.string().optional(),
          agent_prompt: tool.schema.string().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = { agent_id: args.agent_id, name: args.name };
          if (args.description) payload.description = args.description;
          if (args.agent_prompt) payload.agent_prompt = args.agent_prompt;
          return await callTool("triggers.create_webhook", payload);
        },
      }),
      oya_gateways_list_connections: tool({
        description:
          "List your reusable account-level OAuth connections (across agents). Connecting a NEW platform needs the browser.",
        args: {},
        async execute() {
          return await callTool("gateways.list_connections", {});
        },
      }),
      oya_projects_list: tool({
        description: "List your Oya projects (builder-workspace folders) with agent counts.",
        args: {},
        async execute() {
          return await callTool("projects.list", {});
        },
      }),
      oya_project_create: tool({
        description: "Create an Oya project (a folder that groups agents).",
        args: { name: tool.schema.string(), description: tool.schema.string().optional() },
        async execute(args) {
          const payload: Record<string, unknown> = { name: args.name };
          if (args.description) payload.description = args.description;
          return await callTool("projects.create", payload);
        },
      }),
      oya_organizations_list: tool({
        description: "List the organizations you belong to.",
        args: {},
        async execute() {
          return await callTool("organizations.list", {});
        },
      }),
      oya_organization_get: tool({
        description: "Get one organization you belong to, by id.",
        args: { org_id: tool.schema.string() },
        async execute(args) {
          return await callTool("organizations.get", { org_id: args.org_id });
        },
      }),
      oya_organization_create: tool({
        description: "Create an organization you own.",
        args: { display_name: tool.schema.string(), slug: tool.schema.string().optional() },
        async execute(args) {
          const payload: Record<string, unknown> = { display_name: args.display_name };
          if (args.slug) payload.slug = args.slug;
          return await callTool("organizations.create", payload);
        },
      }),
      oya_api_keys_list: tool({
        description: "List your Oya API keys (previews only).",
        args: {},
        async execute() {
          return await callTool("api_keys.list", {});
        },
      }),
      oya_api_key_create: tool({
        description: "Create an Oya API key (optionally bound to an agent). Returns the raw key once.",
        args: { name: tool.schema.string(), agent_id: tool.schema.string().optional() },
        async execute(args) {
          const payload: Record<string, unknown> = { name: args.name };
          if (args.agent_id) payload.agent_id = args.agent_id;
          return await callTool("api_keys.create", payload);
        },
      }),
      oya_account_whoami: tool({
        description:
          "Show your account type (agency / customer / individual), balance, and active customer target.",
        args: {},
        async execute() {
          return await callTool("accounts.whoami", {});
        },
      }),
      oya_accounts_list: tool({
        description: "List your customer sub-accounts (agency mode).",
        args: {},
        async execute() {
          return await callTool("accounts.list", {});
        },
      }),
      oya_account_create: tool({
        description:
          "Create a customer sub-account under your agency. label is the display name; email + invite optionally mint a login invite.",
        args: {
          label: tool.schema.string(),
          email: tool.schema.string().optional(),
          invite: tool.schema.boolean().optional(),
        },
        async execute(args) {
          const payload: Record<string, unknown> = { label: args.label };
          if (args.email) payload.email = args.email;
          if (args.invite !== undefined) payload.invite = args.invite;
          return await callTool("accounts.create", payload);
        },
      }),
      oya_account_delete: tool({
        description: "Soft-archive a customer sub-account by id (agency mode).",
        args: { customer_id: tool.schema.string() },
        async execute(args) {
          return await callTool("accounts.delete", { customer_id: args.customer_id });
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
