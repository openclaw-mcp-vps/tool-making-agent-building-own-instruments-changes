import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { executeInSandbox } from "@/lib/sandbox";
import type {
  CreateToolInput,
  Tool,
  ToolAnalytics,
  ToolExecution,
  ToolExecution as ToolExecutionRecord
} from "@/types/tool";
import type { Agent } from "@/types/agent";

const DATA_DIR = path.join(process.cwd(), "data");
const TOOLS_FILE = path.join(DATA_DIR, "tools.json");
const EXECUTIONS_FILE = path.join(DATA_DIR, "executions.json");
const AGENTS_FILE = path.join(DATA_DIR, "agents.json");

const ensureStore = async () => {
  await mkdir(DATA_DIR, { recursive: true });
  await bootstrapFile(ToolsFileConfig);
  await bootstrapFile(ExecutionsFileConfig);
  await bootstrapFile(AgentsFileConfig);
};

const bootstrapFile = async <T>(config: {
  file: string;
  fallback: T;
}) => {
  try {
    await readFile(config.file, "utf-8");
  } catch {
    await writeFile(config.file, JSON.stringify(config.fallback, null, 2), "utf-8");
  }
};

const ToolsFileConfig = {
  file: TOOLS_FILE,
  fallback: [] as Tool[]
};

const ExecutionsFileConfig = {
  file: EXECUTIONS_FILE,
  fallback: [] as ToolExecution[]
};

const AgentsFileConfig = {
  file: AGENTS_FILE,
  fallback: [
    {
      id: "agent-builder-1",
      name: "Builder Prime",
      goal: "Create and refine tools in real time",
      status: "idle",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      toolsBuilt: 0,
      totalExecutions: 0
    }
  ] as Agent[]
};

const readJson = async <T>(file: string, fallback: T): Promise<T> => {
  await ensureStore();
  const raw = await readFile(file, "utf-8");

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = async <T>(file: string, payload: T) => {
  await ensureStore();
  await writeFile(file, JSON.stringify(payload, null, 2), "utf-8");
};

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const buildId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export const listTools = async (): Promise<Tool[]> => {
  const tools = await readJson<Tool[]>(TOOLS_FILE, []);
  return tools.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getTool = async (toolId: string): Promise<Tool | undefined> => {
  const tools = await listTools();
  return tools.find((tool) => tool.id === toolId);
};

export const createTool = async (input: CreateToolInput): Promise<Tool> => {
  const tools = await listTools();
  const now = new Date().toISOString();

  const nextTool: Tool = {
    id: `tool_${buildId()}`,
    name: input.name,
    slug: slugify(input.name),
    description: input.description,
    code: input.code,
    createdAt: now,
    updatedAt: now,
    authorAgentId: input.authorAgentId,
    visibility: input.visibility,
    tags: input.tags ?? [],
    version: 1,
    versions: [
      {
        version: 1,
        code: input.code,
        createdAt: now,
        notes: "Initial version"
      }
    ],
    executions: 0
  };

  tools.push(nextTool);
  await writeJson(TOOLS_FILE, tools);

  await incrementAgentToolCount(input.authorAgentId);

  return nextTool;
};

export const updateToolCode = async (
  toolId: string,
  nextCode: string,
  notes: string
): Promise<Tool> => {
  const tools = await listTools();
  const target = tools.find((tool) => tool.id === toolId);

  if (!target) {
    throw new Error("Tool not found.");
  }

  target.version += 1;
  target.code = nextCode;
  target.updatedAt = new Date().toISOString();
  target.versions.unshift({
    version: target.version,
    code: nextCode,
    createdAt: target.updatedAt,
    notes
  });

  await writeJson(TOOLS_FILE, tools);
  return target;
};

export const executeTool = async (
  toolId: string,
  payload: unknown
): Promise<ToolExecutionRecord> => {
  const tools = await listTools();
  const tool = tools.find((item) => item.id === toolId);

  if (!tool) {
    throw new Error("Tool not found.");
  }

  const executionBase: Omit<ToolExecutionRecord, "output" | "error" | "status" | "durationMs"> = {
    id: `exec_${buildId()}`,
    toolId,
    toolName: tool.name,
    input: payload,
    executedAt: new Date().toISOString()
  };

  try {
    const { output, durationMs } = await executeInSandbox(tool.code, payload);

    const record: ToolExecutionRecord = {
      ...executionBase,
      output,
      durationMs,
      status: "success"
    };

    await persistExecution(record);
    tool.executions += 1;
    tool.lastExecutionAt = record.executedAt;
    tool.updatedAt = record.executedAt;
    await writeJson(TOOLS_FILE, tools);
    await incrementAgentExecutionCount(tool.authorAgentId);

    return record;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown execution error";

    const record: ToolExecutionRecord = {
      ...executionBase,
      error: message,
      durationMs: 0,
      status: "error"
    };

    await persistExecution(record);
    return record;
  }
};

export const listMarketplaceTools = async (): Promise<Tool[]> => {
  const tools = await listTools();
  return tools.filter((tool) => tool.visibility === "marketplace");
};

export const listExecutions = async (): Promise<ToolExecution[]> => {
  const logs = await readJson<ToolExecution[]>(EXECUTIONS_FILE, []);
  return logs.sort((a, b) => b.executedAt.localeCompare(a.executedAt));
};

export const listAgents = async (): Promise<Agent[]> => {
  const agents = await readJson<Agent[]>(AGENTS_FILE, []);
  return agents.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getAnalytics = async (): Promise<ToolAnalytics> => {
  const [tools, executions] = await Promise.all([listTools(), listExecutions()]);

  const totalExecutions = executions.length;
  const successCount = executions.filter((entry) => entry.status === "success").length;
  const avgExecutionMs =
    totalExecutions > 0
      ? Math.round(
          executions.reduce((acc, current) => acc + current.durationMs, 0) / totalExecutions
        )
      : 0;

  const sortedByUsage = [...tools].sort((a, b) => b.executions - a.executions);

  return {
    totalTools: tools.length,
    totalExecutions,
    successRate: totalExecutions > 0 ? Math.round((successCount / totalExecutions) * 100) : 100,
    avgExecutionMs,
    mostUsedTool: sortedByUsage[0]
      ? {
          id: sortedByUsage[0].id,
          name: sortedByUsage[0].name,
          executions: sortedByUsage[0].executions
        }
      : undefined
  };
};

const persistExecution = async (entry: ToolExecution) => {
  const logs = await readJson<ToolExecution[]>(EXECUTIONS_FILE, []);
  logs.push(entry);
  await writeJson(EXECUTIONS_FILE, logs);
};

const incrementAgentToolCount = async (agentId: string) => {
  const agents = await readJson<Agent[]>(AGENTS_FILE, []);
  const target = agents.find((agent) => agent.id === agentId);

  if (!target) {
    return;
  }

  target.toolsBuilt += 1;
  target.status = "building";
  target.updatedAt = new Date().toISOString();
  await writeJson(AGENTS_FILE, agents);
};

const incrementAgentExecutionCount = async (agentId: string) => {
  const agents = await readJson<Agent[]>(AGENTS_FILE, []);
  const target = agents.find((agent) => agent.id === agentId);

  if (!target) {
    return;
  }

  target.totalExecutions += 1;
  target.status = "testing";
  target.updatedAt = new Date().toISOString();
  await writeJson(AGENTS_FILE, agents);
};
