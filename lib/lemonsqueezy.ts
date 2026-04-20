import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const PURCHASES_FILE = path.join(DATA_DIR, "purchases.json");

export interface PurchaseRecord {
  orderId: string;
  email: string;
  customerName: string;
  status: string;
  productName?: string;
  createdAt: string;
}

interface LemonSqueezyPayload {
  meta?: {
    event_name?: string;
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      user_email?: string;
      user_name?: string;
      first_order_item?: {
        product_name?: string;
      };
    };
  };
}

export const getCheckoutOverlayUrl = (): string => {
  const productId = process.env.NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID;

  if (!productId) {
    return "";
  }

  return `https://checkout.lemonsqueezy.com/buy/${productId}?embed=1&logo=0&desc=0&discount=0`;
};

export const verifyWebhookSignature = (rawBody: string, signatureHeader: string | null): boolean => {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

  if (!secret || !signatureHeader) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
};

export const parsePurchaseFromWebhook = (payload: LemonSqueezyPayload): PurchaseRecord | null => {
  const eventName = payload.meta?.event_name;

  if (!eventName || !eventName.includes("order")) {
    return null;
  }

  const orderId = payload.data?.id;
  const attributes = payload.data?.attributes;

  if (!orderId || !attributes?.user_email) {
    return null;
  }

  return {
    orderId,
    email: attributes.user_email.toLowerCase(),
    customerName: attributes.user_name ?? "",
    status: attributes.status ?? "paid",
    productName: attributes.first_order_item?.product_name,
    createdAt: new Date().toISOString()
  };
};

export const persistPurchase = async (purchase: PurchaseRecord): Promise<void> => {
  await mkdir(DATA_DIR, { recursive: true });
  const all = await readPurchases();
  const deduped = all.filter((entry) => entry.orderId !== purchase.orderId);
  deduped.push(purchase);
  await writeFile(PURCHASES_FILE, JSON.stringify(deduped, null, 2), "utf-8");
};

export const readPurchases = async (): Promise<PurchaseRecord[]> => {
  try {
    const raw = await readFile(PURCHASES_FILE, "utf-8");
    return JSON.parse(raw) as PurchaseRecord[];
  } catch {
    return [];
  }
};

export const findPurchase = async (orderId: string, email: string): Promise<PurchaseRecord | null> => {
  const all = await readPurchases();
  const normalizedEmail = email.toLowerCase().trim();
  const found = all.find(
    (entry) => entry.orderId === orderId.trim() && entry.email === normalizedEmail
  );

  return found ?? null;
};
