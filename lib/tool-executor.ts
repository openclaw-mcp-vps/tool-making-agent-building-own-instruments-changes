import { randomUUID } from "crypto";
import { z } from "zod";
import { executeInSandbox } from "@/lib/sandbox";
import { readJsonFile, writeJsonFile } from "@/lib/storage";

export const TOOL_FILE = "tools.json";

export const createToolSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, "Use letters, numbers, dashes, or underscores."),
  description: z.string().min(10).max(300),
  code: z.string().min(20).max(12000),
  inputSchema: z.record(z.unknown()).optional(),
});

const toolSchema = createToolSchema.extend({
  id: z.string(),
  version: z.number().int().positive(),
  createdAt: z.string(),
  updatedAt: z.string(),
  executionCount: z.number().int().nonnegative(),
  lastResultPreview: z.string().optional(),
});

export type Tool = z.infer<typeof toolSchema>;

async function getToolData(): Promise<Tool[]> {
  const raw = await readJsonFile<unknown[]>(TOOL_FILE, []);
  const parsed = z.array(toolSchema).safeParse(raw);
  if (!parsed.success) {
    return [];
  }
  return parsed.data;
}

async function saveToolData(tools: Tool[]) {
  await writeJsonFile(TOOL_FILE, tools);
}

export async function listTools(): Promise<Tool[]> {
  const tools = await getToolData();
  return tools.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export async function createTool(input: z.infer<typeof createToolSchema>): Promise<Tool> {
  const parsed = createToolSchema.parse(input);
  const tools = await getToolData();

  const duplicate = tools.find((tool) => tool.name.toLowerCase() === parsed.name.toLowerCase());
  if (duplicate) {
    throw new Error(`Tool name \"${parsed.name}\" already exists.`);
  }

  const now = new Date().toISOString();
  const tool: Tool = {
    id: randomUUID(),
    name: parsed.name,
    description: parsed.description,
    code: parsed.code,
    inputSchema: parsed.inputSchema,
    version: 1,
    createdAt: now,
    updatedAt: now,
    executionCount: 0,
  };

  tools.push(tool);
  await saveToolData(tools);
  return tool;
}

export async function executeToolByName(name: string, input: unknown) {
  const tools = await getToolData();
  const tool = tools.find((candidate) => candidate.name.toLowerCase() === name.toLowerCase());

  if (!tool) {
    throw new Error(`No tool named \"${name}\" exists.`);
  }

  const run = await executeInSandbox(tool.code, input);

  tool.executionCount += 1;
  tool.updatedAt = new Date().toISOString();
  tool.lastResultPreview = JSON.stringify(run.result).slice(0, 300);

  await saveToolData(tools);

  return {
    tool,
    run,
  };
}

export async function executeAdhocTool(code: string, input: unknown) {
  return executeInSandbox(code, input);
}
