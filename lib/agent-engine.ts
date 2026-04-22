import OpenAI from "openai";
import { z } from "zod";
import { createTool, executeToolByName, listTools } from "@/lib/tool-executor";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentRequest = {
  messages: ChatMessage[];
};

export type AgentResponse = {
  reply: string;
  action?: {
    type: "tool_created" | "tool_executed";
    toolName: string;
    details: unknown;
  };
};

const generatedToolSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9_-]+$/),
  description: z.string().min(10).max(300),
  code: z.string().min(20).max(12000),
});

function getLastUserMessage(messages: ChatMessage[]): string {
  const last = [...messages].reverse().find((message) => message.role === "user");
  return last?.content ?? "";
}

function parseToolRunCommand(rawInput: string): { toolName: string; payload: unknown } | null {
  const runMatch = rawInput.match(/run\s+([a-zA-Z0-9_-]+)/i);
  if (!runMatch) {
    return null;
  }

  const toolName = runMatch[1];
  const jsonStart = rawInput.indexOf("{");
  const jsonEnd = rawInput.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return { toolName, payload: {} };
  }

  const possibleJson = rawInput.slice(jsonStart, jsonEnd + 1);
  try {
    return {
      toolName,
      payload: JSON.parse(possibleJson),
    };
  } catch {
    return {
      toolName,
      payload: {},
    };
  }
}

async function generateToolFromPrompt(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  const completion = await client.responses.create({
    model,
    input: [
      {
        role: "system",
        content:
          "You are a tool-compiler for an AI agent platform. Return JSON only with keys name, description, code. Code must be JavaScript function body that returns a value.",
      },
      {
        role: "user",
        content: `Create a practical reusable tool from this request: ${prompt}`,
      },
    ],
  });

  const text = completion.output_text;
  if (!text) {
    return null;
  }

  const parsed = generatedToolSchema.safeParse(JSON.parse(text));
  if (!parsed.success) {
    return null;
  }

  return parsed.data;
}

function buildManualTemplate(prompt: string) {
  const slugBase = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);

  const name = slugBase.length > 2 ? `${slugBase}-tool` : "custom-tool";

  return {
    name,
    description: `Custom tool generated from request: ${prompt.slice(0, 200)}`,
    code: `
const text = String(input?.text ?? "");
const words = text
  .split(/\\s+/)
  .map((w) => w.trim())
  .filter(Boolean);

return {
  summary: text.slice(0, 160),
  wordCount: words.length,
  uniqueWords: new Set(words.map((w) => w.toLowerCase())).size,
  createdAt: context.nowIso
};
`.trim(),
  };
}

export async function runAgentTurn(request: AgentRequest): Promise<AgentResponse> {
  const lastUser = getLastUserMessage(request.messages).trim();

  if (!lastUser) {
    return {
      reply: "Send a request like \"build a tool that extracts emails\" or \"run my-tool with {\\\"text\\\":\\\"...\\\"}\".",
    };
  }

  const wantsToolList = /what tools|list tools|show tools/i.test(lastUser);
  if (wantsToolList) {
    const tools = await listTools();
    if (tools.length === 0) {
      return {
        reply:
          "No tools exist yet. Ask me to build one, for example: \"build a tool that summarizes release notes\".",
      };
    }

    const summary = tools
      .slice(0, 12)
      .map((tool) => `- ${tool.name}: ${tool.description}`)
      .join("\n");

    return {
      reply: `Available tools:\n${summary}`,
    };
  }

  const runCommand = parseToolRunCommand(lastUser);
  if (runCommand) {
    const execution = await executeToolByName(runCommand.toolName, runCommand.payload);
    return {
      reply: `Executed ${execution.tool.name} in ${execution.run.elapsedMs}ms.`,
      action: {
        type: "tool_executed",
        toolName: execution.tool.name,
        details: execution.run.result,
      },
    };
  }

  const wantsNewTool = /build|create|make.+tool/i.test(lastUser);
  if (wantsNewTool) {
    const candidate = (await generateToolFromPrompt(lastUser)) ?? buildManualTemplate(lastUser);
    const tool = await createTool(candidate);

    return {
      reply: `Created tool ${tool.name}. You can run it with: run ${tool.name} with {"text":"your input"}`,
      action: {
        type: "tool_created",
        toolName: tool.name,
        details: {
          description: tool.description,
        },
      },
    };
  }

  return {
    reply:
      "I can create tools on demand and execute them. Ask me to build one or run an existing one with JSON input.",
  };
}
