import crypto from "crypto";
import { readJsonFile, writeJsonFile } from "@/lib/storage";

const PURCHASE_FILE = "purchases.json";

type PurchaseRecord = {
  email: string;
  source: "stripe";
  eventId: string;
  createdAt: string;
};

export function getStripePaymentLink() {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";
}

function safeCompareHex(a: string, b: string): boolean {
  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function verifyStripeSignature(rawBody: string, signatureHeader: string): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return false;
  }

  const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, piece) => {
    const [key, value] = piece.split("=");
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});

  const timestamp = parts.t;
  const v1 = parts.v1;

  if (!timestamp || !v1) {
    return false;
  }

  const payloadToSign = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(payloadToSign).digest("hex");

  return safeCompareHex(expected, v1);
}

export async function recordPurchase(email: string, eventId: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await readJsonFile<PurchaseRecord[]>(PURCHASE_FILE, []);

  const exists = existing.some((record) => record.eventId === eventId || record.email === normalizedEmail);
  if (exists) {
    return;
  }

  existing.push({
    email: normalizedEmail,
    source: "stripe",
    eventId,
    createdAt: new Date().toISOString(),
  });

  await writeJsonFile(PURCHASE_FILE, existing);
}

export async function hasPurchase(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await readJsonFile<PurchaseRecord[]>(PURCHASE_FILE, []);
  return existing.some((record) => record.email === normalizedEmail);
}
