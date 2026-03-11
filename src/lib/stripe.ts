import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const PLATFORM_FEE_PERCENT = parseInt(
  process.env.STRIPE_PLATFORM_FEE_PERCENT ?? "15",
  10
);
