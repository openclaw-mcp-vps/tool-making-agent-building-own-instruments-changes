export type ToolVisibility = "private" | "marketplace";

export interface ToolVersion {
  version: number;
  code: string;
  createdAt: string;
  notes: string;
}

export interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  authorAgentId: string;
  visibility: ToolVisibility;
  tags: string[];
  version: number;
  versions: ToolVersion[];
  executions: number;
  lastExecutionAt?: string;
}

export interface ToolExecution {
  id: string;
  toolId: string;
  toolName: string;
  input: unknown;
  output?: unknown;
  error?: string;
  durationMs: number;
  executedAt: string;
  status: "success" | "error";
}

export interface CreateToolInput {
  name: string;
  description: string;
  code: string;
  authorAgentId: string;
  visibility: ToolVisibility;
  tags?: string[];
}

export interface ExecuteToolInput {
  toolId: string;
  input: unknown;
}

export interface ToolAnalytics {
  totalTools: number;
  totalExecutions: number;
  successRate: number;
  avgExecutionMs: number;
  mostUsedTool?: Pick<Tool, "id" | "name" | "executions">;
}
