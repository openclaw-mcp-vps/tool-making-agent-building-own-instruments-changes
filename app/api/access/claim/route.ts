import { NextResponse } from "next/server";
import { findPurchase } from "@/lib/lemonsqueezy";

const ACCESS_COOKIE = "agent_tool_access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      email?: string;
    };

    const orderId = body.orderId?.trim();
    const email = body.email?.trim();

    if (!orderId || !email) {
      return NextResponse.json(
        {
          error: "orderId and email are required."
        },
        { status: 400 }
      );
    }

    const isLocalBypass =
      process.env.NODE_ENV !== "production" && orderId === "LOCAL_DEV" && email.includes("@");

    if (!isLocalBypass) {
      const purchase = await findPurchase(orderId, email);

      if (!purchase) {
        return NextResponse.json(
          {
            error: "Purchase not found yet. Wait a few seconds and retry after checkout completes."
          },
          { status: 404 }
        );
      }

      if (purchase.status.toLowerCase().includes("refund")) {
        return NextResponse.json(
          {
            error: "This order is not eligible for access."
          },
          { status: 403 }
        );
      }
    }

    const response = NextResponse.json({ access: "granted" });

    response.cookies.set({
      name: ACCESS_COOKIE,
      value: "granted",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request payload."
      },
      { status: 400 }
    );
  }
}
