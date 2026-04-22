import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runAgentTurn } from "@/lib/agent-engine";
import { ACCESS_COOKIE, hasAccessCookie } from "@/lib/auth";

const agentRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1).max(6000),
    }),
  ),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasAccessCookie(cookieStore.get(ACCESS_COOKIE)?.value)) {
    return NextResponse.json(
      {
        error: "Paid access is required.",
      },
      { status: 402 },
    );
  }

  try {
    const json = await request.json();
    const parsed = agentRequestSchema.parse(json);
    const result = await runAgentTurn(parsed);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process agent request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
