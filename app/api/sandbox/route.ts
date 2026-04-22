import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_COOKIE, hasAccessCookie } from "@/lib/auth";
import { executeAdhocTool } from "@/lib/tool-executor";

const sandboxSchema = z.object({
  code: z.string().min(20).max(12000),
  input: z.unknown(),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasAccessCookie(cookieStore.get(ACCESS_COOKIE)?.value)) {
    return NextResponse.json({ error: "Paid access is required." }, { status: 402 });
  }

  try {
    const body = await request.json();
    const parsed = sandboxSchema.parse(body);
    const run = await executeAdhocTool(parsed.code, parsed.input);
    return NextResponse.json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sandbox execution failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
