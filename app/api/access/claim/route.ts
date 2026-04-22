import { NextResponse } from "next/server";
import { z } from "zod";
import { grantAccessCookie } from "@/lib/auth";
import { hasPurchase } from "@/lib/lemonsqueezy";

const claimSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = claimSchema.parse(body);
    const purchased = await hasPurchase(email);

    if (!purchased) {
      return NextResponse.json(
        {
          error:
            "No completed checkout was found for this email yet. If you just paid, wait 10-20 seconds for webhook delivery and try again.",
        },
        { status: 404 },
      );
    }

    const response = NextResponse.json({ success: true });
    grantAccessCookie(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify purchase.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
