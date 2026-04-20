import { NextResponse } from "next/server";
import { executeTool, getAnalytics, listExecutions } from "@/lib/tool-registry";

export const runtime = "nodejs";

export async function GET() {
  const [analytics, executions] = await Promise.all([getAnalytics(), listExecutions()]);
  return NextResponse.json({ analytics, executions: executions.slice(0, 20) });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      toolId?: string;
      input?: unknown;
    };

    if (!body.toolId) {
      return NextResponse.json(
        {
          error: "toolId is required"
        },
        { status: 400 }
      );
    }

    const execution = await executeTool(body.toolId, body.input ?? {});

    return NextResponse.json({ execution });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool execution failed.";
    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}
