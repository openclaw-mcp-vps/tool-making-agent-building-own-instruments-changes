import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_COOKIE, hasAccessCookie } from "@/lib/auth";
import { executeToolByName } from "@/lib/tool-executor";

const executeSchema = z.object({
  name: z.string().min(2).max(50),
  input: z.unknown(),
});

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasAccessCookie(cookieStore.get(ACCESS_COOKIE)?.value)) {
    return NextResponse.json({ error: "Paid access is required." }, { status: 402 });
  }

  try {
    const body = await request.json();
    const parsed = executeSchema.parse(body);
    const result = await executeToolByName(parsed.name, parsed.input);

    return NextResponse.json({
      tool: {
        name: result.tool.name,
        version: result.tool.version,
      },
      run: result.run,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute tool.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
