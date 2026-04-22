import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_COOKIE, hasAccessCookie } from "@/lib/auth";
import { createTool, createToolSchema, listTools } from "@/lib/tool-executor";

const createRequestSchema = z.object({
  name: z.string(),
  description: z.string(),
  code: z.string(),
  inputSchema: z.record(z.unknown()).optional(),
});

export async function GET() {
  const tools = await listTools();
  return NextResponse.json({
    tools,
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasAccessCookie(cookieStore.get(ACCESS_COOKIE)?.value)) {
    return NextResponse.json({ error: "Paid access is required." }, { status: 402 });
  }

  try {
    const body = await request.json();
    const parsed = createRequestSchema.parse(body);
    const validated = createToolSchema.parse(parsed);
    const tool = await createTool(validated);
    return NextResponse.json({ tool }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create tool.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
