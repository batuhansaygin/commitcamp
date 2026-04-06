import { NextResponse } from "next/server";
import { handleStripeWebhook } from "@/lib/actions/billing/webhooks";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    const rawBody = await req.text();
    const result = await handleStripeWebhook(rawBody, signature);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
