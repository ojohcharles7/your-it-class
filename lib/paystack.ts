import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { paystackSecretKey } from "./env";

const PAYSTACK_BASE = "https://api.paystack.co";

type PaystackEnvelope<T> = {
  status: boolean;
  message: string;
  data: T;
};

export type PaystackTransaction = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  paid_at?: string;
  metadata?: {
    user_id?: string;
    course_id?: string;
    slug?: string;
    [key: string]: unknown;
  };
};

export function newReference() {
  return `YIC-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!paystackSecretKey || !signature) return false;
  const expected = createHmac("sha512", paystackSecretKey).update(rawBody).digest("hex");
  const provided = signature.trim().toLowerCase();
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}

async function paystackFetch<T>(path: string, init?: RequestInit): Promise<PaystackEnvelope<T>> {
  if (!paystackSecretKey) {
    throw new Error("Paystack secret key is not configured.");
  }
  const response = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const json = (await response.json()) as PaystackEnvelope<T>;
  if (!response.ok || !json.status) {
    throw new Error(json.message || `Paystack request failed (${response.status}).`);
  }
  return json;
}

export async function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const { data } = await paystackFetch<{ authorization_url: string; access_code: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo,
        reference: input.reference,
        callback_url: input.callbackUrl,
        currency: "NGN",
        metadata: input.metadata,
      }),
    },
  );
  return data;
}

export async function verifyTransaction(reference: string) {
  const { data } = await paystackFetch<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
  return data;
}
