import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAnalytics, listAgents, listExecutions, listTools } from "@/lib/tool-registry";

export const runtime = "nodejs";

const fallbackToolDraft = (message: string) => {
  const lower = message.toLowerCase();

  if (lower.includes("csv") || lower.includes("spreadsheet") || lower.includes("row")) {
    return {
      name: "Dataset Row Validator",
      description:
        "Validates rows against required fields and returns both valid rows and structured validation errors.",
      code: `module.exports = async function(input) {
  const rows = Array.isArray(input.rows) ? input.rows : [];
  const required = Array.isArray(input.requiredFields) ? input.requiredFields : ["id", "email"];

  const valid = [];
  const invalid = [];

  for (const row of rows) {
    const missing = required.filter((field) => !row?.[field]);

    if (missing.length > 0) {
      invalid.push({ row, missing });
      continue;
    }

    valid.push(row);
  }

  return {
    validCount: valid.length,
    invalidCount: invalid.length,
    valid,
    invalid
  };
};`
    };
  }

  if (lower.includes("api") || lower.includes("response") || lower.includes("json")) {
    return {
      name: "API Response Normalizer",
      description:
        "Flattens nested API response items into a stable schema and records malformed entries.",
      code: `module.exports = async function(input) {
  const items = Array.isArray(input.items) ? input.items : [];

  const normalized = [];
  const malformed = [];

  for (const item of items) {
    if (!item || typeof item !== "object") {
      malformed.push({ reason: "not-object", item });
      continue;
    }

    if (!item.id || !item.payload) {
      malformed.push({ reason: "missing-id-or-payload", item });
      continue;
    }

    normalized.push({
      id: item.id,
      name: item.payload.name ?? null,
      status: item.payload.status ?? "unknown",
      updatedAt: item.payload.updated_at ?? null
    });
  }

  return {
    normalizedCount: normalized.length,
    malformedCount: malformed.length,
    normalized,
    malformed
  };
};`
    };
  }

  return {
    name: "Workflow Guardrail Tool",
    description:
      "Classifies incoming tasks into executable, needs-review, or blocked buckets with explicit reasons.",
    code: `module.exports = async function(input) {
  const tasks = Array.isArray(input.tasks) ? input.tasks : [];

  const executable = [];
  const needsReview = [];
  const blocked = [];

  for (const task of tasks) {
    if (!task || !task.id || !task.instructions) {
      blocked.push({ task, reason: "missing-id-or-instructions" });
      continue;
    }

    if (task.riskLevel === "high" || task.requiresApproval === true) {
      needsReview.push({ task, reason: "manual-review-required" });
      continue;
    }

    executable.push(task);
  }

  return {
    executable,
    needsReview,
    blocked,
    summary: {
      executable: executable.length,
      needsReview: needsReview.length,
      blocked: blocked.length
    }
  };
};`
  };
};

const buildFallbackReply = (message: string) => {
  if (message.toLowerCase().includes("failing") || message.toLowerCase().includes("error")) {
    return "I drafted a validation-oriented tool so you can isolate bad inputs first, then tighten schema constraints iteratively.";
  }

  return "I drafted a first-pass tool with clear output structure so you can test quickly and iterate based on real payloads.";
};

const buildOpenAIReply = async (message: string) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const client = new OpenAI({ apiKey });

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You are a practical agent engineering copilot. Keep responses under 90 words and focus on concrete tool design tradeoffs."
      },
      {
        role: "user",
        content: `Draft guidance for this request: ${message}`
      }
    ]
  });

  const text = response.output_text?.trim();
  return text || null;
};

export async function GET() {
  const [agents, tools, analytics, recentExecutions] = await Promise.all([
    listAgents(),
    listTools(),
    getAnalytics(),
    listExecutions()
  ]);

  return NextResponse.json({
    agents,
    tools,
    analytics,
    recentExecutions: recentExecutions.slice(0, 8)
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      message?: string;
    };

    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json(
        {
          error: "message is required"
        },
        { status: 400 }
      );
    }

    const [draft, modelReply] = await Promise.all([
      Promise.resolve(fallbackToolDraft(message)),
      buildOpenAIReply(message).catch(() => null)
    ]);

    return NextResponse.json({
      reply: modelReply ?? buildFallbackReply(message),
      suggestedTool: draft
    });
  } catch {
    return NextResponse.json(
      {
        error: "Invalid payload."
      },
      { status: 400 }
    );
  }
}
