import { NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";
import { getStripeClient } from "@/lib/payments/stripe";
import { db, subscriptions } from "@/lib/db";
import { finalizeReferralIfPresent } from "@/lib/services/referral-service";

const stripe = getStripeClient();

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook misconfigured" }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    return NextResponse.json({ error: `Invalid signature: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription && session.metadata?.userId) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await syncSubscriptionRecord(session.metadata.userId, subscription);
          await finalizeReferralIfPresent(session.metadata.userId);
        }
        break;
      }
      case "invoice.payment_succeeded": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const invoice = event.data.object as any;
        const subId: string | null = invoice.subscription ?? null;
        const userId = invoice.metadata?.userId ?? (subId ? await lookupUserId(subId) : null);
        if (userId && subId) {
          const subscription = await stripe.subscriptions.retrieve(subId);
          await syncSubscriptionRecord(userId, subscription);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId ?? (await lookupUserId(subscription.id));
        if (userId) {
          await syncSubscriptionRecord(userId, subscription);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    console.error("Stripe webhook error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscriptionRecord(userId: string, subscription: Stripe.Subscription) {
  const status = normalizeStatus(subscription.status);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = subscription as any;
  const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

  const existing = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, userId) });

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        status,
        stripeSubscriptionId: subscription.id,
        currentPeriodEnd,
        trialEndsAt: null,
      })
      .where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values({
      userId,
      status,
      stripeSubscriptionId: subscription.id,
      currentPeriodEnd,
    });
  }
}

async function lookupUserId(stripeSubscriptionId: string) {
  const record = await db.query.subscriptions.findFirst({ where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId) });
  return record?.userId ?? null;
}

function normalizeStatus(status: Stripe.Subscription.Status) {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid" || status === "incomplete") return "past_due";
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  return status;
}
