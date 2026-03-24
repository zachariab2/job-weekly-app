"use server";

import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, referralCodes, subscriptions } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { getStripeClient } from "@/lib/payments/stripe";

const SUBSCRIPTION_PRICE_CENTS = 999;

export async function createReferralCodeAction(): Promise<void> {
  const user = await requireUser();
  const subscription = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, user.id) });

  if (!subscription || subscription.status !== "active") {
    return;
  }

  let code = makeCode();
  let clash = await db.query.referralCodes.findFirst({ where: eq(referralCodes.code, code) });
  while (clash) {
    code = makeCode();
    clash = await db.query.referralCodes.findFirst({ where: eq(referralCodes.code, code) });
  }

  await db.insert(referralCodes).values({ code, ownerUserId: user.id });
  revalidatePath("/billing");
}

function makeCode() {
  return randomBytes(3).toString("hex").toUpperCase();
}

export async function startCheckoutSession() {
  const user = await requireUser();
  const subscription = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, user.id) });

  if (subscription?.status === "active" && subscription.stripeSubscriptionId) {
    redirect("/billing");
  }

  const stripe = getStripeClient();
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    metadata: { userId: user.id },
    subscription_data: {
      metadata: { userId: user.id },
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: SUBSCRIPTION_PRICE_CENTS,
          recurring: { interval: "week" },
          product_data: {
            name: "JobWeekly Weekly Membership",
            description: "Premium job search operating system",
          },
        },
      },
    ],
    success_url: `${appUrl}/billing?checkout=success`,
    cancel_url: `${appUrl}/billing?checkout=cancel`,
  });

  if (!session.url) {
    throw new Error("Stripe Checkout session missing URL");
  }

  redirect(session.url);
}
