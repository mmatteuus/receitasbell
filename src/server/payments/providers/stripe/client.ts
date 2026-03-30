import Stripe from "stripe";
import { env } from "../../../shared/env.js";

// Inicializar cliente do Stripe
export const stripeClient = new Stripe(env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia", // Updated to valid TS inference type or use any if unsure
  appInfo: {
    name: "Receitasbell",
    version: "1.0.0",
  },
});
