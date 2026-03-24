import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripeClient() {
  if (stripe) {
    return stripe;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  stripe = new Stripe(secretKey, {
    apiVersion: "2026-02-25.clover",
  });

  return stripe;
}
