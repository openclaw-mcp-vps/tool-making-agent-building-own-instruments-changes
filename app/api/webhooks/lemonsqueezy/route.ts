import { NextResponse } from "next/server";
import { recordPurchase, verifyStripeSignature } from "@/lib/lemonsqueezy";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature header." }, { status: 400 });
  }

  const rawBody = await request.text();
  const isValid = verifyStripeSignature(rawBody, signature);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: Record<string, unknown>;

  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const eventId = String(event.id ?? "");
  const dataObject =
    typeof event.data === "object" && event.data !== null
      ? ((event.data as { object?: unknown }).object as Record<string, unknown>)
      : undefined;

  const customerDetails =
    dataObject && typeof dataObject.customer_details === "object" && dataObject.customer_details !== null
      ? (dataObject.customer_details as Record<string, unknown>)
      : undefined;

  const emailValue =
    (typeof customerDetails?.email === "string" && customerDetails.email) ||
    (typeof dataObject?.customer_email === "string" && dataObject.customer_email) ||
    "";

  if (!eventId || !emailValue) {
    return NextResponse.json({ error: "Missing purchase identity fields." }, { status: 400 });
  }

  await recordPurchase(emailValue, eventId);

  return NextResponse.json({ received: true });
}
