import { NextResponse } from "next/server";
import {
  parsePurchaseFromWebhook,
  persistPurchase,
  verifyWebhookSignature
} from "@/lib/lemonsqueezy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  const secretConfigured = Boolean(process.env.LEMON_SQUEEZY_WEBHOOK_SECRET);

  if (secretConfigured && !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      {
        error: "Invalid webhook signature."
      },
      { status: 401 }
    );
  }

  try {
    const payload = JSON.parse(rawBody) as unknown;
    const purchase = parsePurchaseFromWebhook(payload as never);

    if (purchase) {
      await persistPurchase(purchase);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      {
        error: "Malformed webhook body."
      },
      { status: 400 }
    );
  }
}
