import { NextResponse } from "next/server";
import { executeInSandbox } from "@/lib/sandbox";

export const runtime = "nodejs";

const sleep = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      code?: string;
      input?: unknown;
    };

    if (!body.code?.trim()) {
      return NextResponse.json(
        {
          error: "code is required"
        },
        { status: 400 }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const push = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
        };

        try {
          push({ type: "stage", message: "Validating tool source..." });
          await sleep(120);

          push({ type: "stage", message: "Booting isolated runtime..." });
          await sleep(140);

          push({ type: "stage", message: "Executing against input payload..." });
          const { output, logs, durationMs } = await executeInSandbox(body.code ?? "", body.input ?? {});

          push({ type: "result", output, logs, durationMs });
          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Sandbox execution failed.";
          push({ type: "error", error: message });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform"
      }
    });
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request payload."
      },
      { status: 400 }
    );
  }
}
