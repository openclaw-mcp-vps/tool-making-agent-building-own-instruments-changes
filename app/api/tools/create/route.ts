import { NextResponse } from "next/server";
import {
  createTool,
  listMarketplaceTools,
  listTools,
  updateToolCode
} from "@/lib/tool-registry";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const visibility = searchParams.get("visibility");

  if (visibility === "marketplace") {
    const tools = await listMarketplaceTools();
    return NextResponse.json({ tools });
  }

  const tools = await listTools();
  return NextResponse.json({ tools });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      toolId?: string;
      name?: string;
      description?: string;
      code?: string;
      notes?: string;
      authorAgentId?: string;
      visibility?: "private" | "marketplace";
      tags?: string[];
    };

    if (!body.code?.trim()) {
      return NextResponse.json(
        {
          error: "Tool code is required."
        },
        { status: 400 }
      );
    }

    if (body.toolId) {
      const tool = await updateToolCode(body.toolId, body.code, body.notes ?? "Updated version");
      return NextResponse.json({ tool });
    }

    if (!body.name?.trim() || !body.description?.trim()) {
      return NextResponse.json(
        {
          error: "name and description are required for new tools."
        },
        { status: 400 }
      );
    }

    const tool = await createTool({
      name: body.name,
      description: body.description,
      code: body.code,
      authorAgentId: body.authorAgentId ?? "agent-builder-1",
      visibility: body.visibility ?? "private",
      tags: body.tags
    });

    return NextResponse.json({ tool }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create tool.";
    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}
