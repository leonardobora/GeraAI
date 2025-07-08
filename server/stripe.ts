import Stripe from "stripe";
import { storage } from "./storage"; // Assuming storage.ts is in the same directory
import type { Request, Response } from "express";
import { users } from "@shared/schema"; // Import users schema for updates

// Initialize Stripe with the secret key from environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error(
    "STRIPE_SECRET_KEY não está definida nas variáveis de ambiente.",
  );
  throw new Error("STRIPE_SECRET_KEY is not set.");
}
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20", // Use the latest API version
  typescript: true,
});

// Define product IDs from your Stripe dashboard (as per MONETIZATION.md)
// These should match the Price IDs you provided earlier.
const PREMIUM_PLAN_PRICE_ID = "price_1RiebXCdZxla5RSsMqbjTIFK"; // Premium plan price
const PRO_PLAN_PRICE_ID = "price_1RiebmCdZxla5RSsCychM1qN"; // Pro plan price

// Webhook secret from environment variables
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
if (!STRIPE_WEBHOOK_SECRET) {
  console.warn(
    "STRIPE_WEBHOOK_SECRET não está definida. Webhooks podem não funcionar corretamente.",
  );
  // throw new Error("STRIPE_WEBHOOK_SECRET is not set."); // Optionally throw error
}

// Function to map Price ID to your internal plan name
const getPlanNameFromPriceId = (priceId: string): string | null => {
  switch (priceId) {
    case PREMIUM_PLAN_PRICE_ID:
      return "premium";
    case PRO_PLAN_PRICE_ID:
      return "pro";
    default:
      return null;
  }
};

export const handleStripeWebhook = async (req: Request, res: Response) => {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe webhook secret não configurado.");
    return res.status(500).send("Webhook secret não configurado.");
  }

  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err: any) {
    console.error(
      `⚠️ Erro na verificação da assinatura do webhook: ${err.message}`,
    );
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  console.log(`🔔 Evento Stripe recebido: ${event.type}`);
  const session = event.data.object as
    | Stripe.Checkout.Session
    | Stripe.Subscription
    | Stripe.Invoice;

  switch (event.type) {
    case "checkout.session.completed": {
      const checkoutSession = session as Stripe.Checkout.Session;
      if (
        checkoutSession.mode === "subscription" &&
        checkoutSession.subscription &&
        checkoutSession.customer
      ) {
        const subscriptionId = checkoutSession.subscription as string;
        const customerId = checkoutSession.customer as string;
        const userId = checkoutSession.client_reference_id; // We'll pass Replit User ID here

        if (!userId) {
          console.error(
            "checkout.session.completed: client_reference_id (User ID) não encontrado.",
          );
          return res
            .status(400)
            .send("User ID não encontrado na sessão de checkout.");
        }

        // Retrieve subscription details to get the plan and status
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price.id;
        const planName = priceId ? getPlanNameFromPriceId(priceId) : "free";

        console.log(
          `Checkout completo para User ID: ${userId}, Customer ID: ${customerId}, Subscription ID: ${subscriptionId}, Plano: ${planName}`,
        );

        await storage.upsertUser({
          // Assuming upsertUser can handle these new fields or we need a specific update function
          id: userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionPlan: planName || "free",
          subscriptionStatus: subscription.status, // e.g., 'active', 'trialing'
          // subscription_end_date will be set by 'customer.subscription.updated' or 'invoice.payment_succeeded'
          // trial_end_date is often part of the subscription object if applicable
          trialEndDate: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : undefined,
          subscriptionEndDate: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : undefined,
        });
      } else if (checkoutSession.mode === "setup") {
        // Handle setup intents if you use them (e.g., for updating payment methods outside of a subscription)
        console.log("SetupIntent Succeeded:", checkoutSession.setup_intent);
      }
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = session as Stripe.Invoice;
      if (invoice.subscription && invoice.customer) {
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata.userId; // Assuming we set userId in metadata during subscription creation

        if (!userId && invoice.customer_email) {
          // Fallback: try to find user by email if userId is not in metadata (less reliable)
          // const userByEmail = await storage.findUserByEmail(invoice.customer_email);
          // if (userByEmail) userId = userByEmail.id;
          console.warn(
            `invoice.payment_succeeded: userId não encontrado na metadata da subscription ${subscriptionId}. Tentando por email ${invoice.customer_email} (não implementado).`,
          );
        }

        if (!userId) {
          console.error(
            `invoice.payment_succeeded: User ID não encontrado para Subscription ID: ${subscriptionId}`,
          );
          // Potentially log this for manual follow-up
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        const planName = priceId ? getPlanNameFromPriceId(priceId) : "free";

        console.log(
          `Pagamento bem-sucedido para User ID: ${userId}, Customer ID: ${customerId}, Subscription ID: ${subscriptionId}, Plano: ${planName}`,
        );

        await storage.upsertUser({
          id: userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          subscriptionPlan: planName || "free",
          subscriptionStatus: subscription.status, // Should be 'active' or 'trialing'
          subscriptionEndDate: new Date(subscription.current_period_end * 1000),
          trialEndDate: subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : undefined,
        });
      }
      break;
    }
    case "customer.subscription.updated": {
      const subscription = session as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const userId = subscription.metadata.userId; // Assuming we set userId in metadata

      if (!userId) {
        console.error(
          `customer.subscription.updated: User ID não encontrado na metadata da Subscription ID: ${subscription.id}`,
        );
        break;
      }

      const priceId = subscription.items.data[0]?.price.id;
      const planName = priceId ? getPlanNameFromPriceId(priceId) : "free";

      console.log(
        `Assinatura atualizada para User ID: ${userId}, Customer ID: ${customerId}, Subscription ID: ${subscription.id}, Novo Status: ${subscription.status}, Novo Plano: ${planName}`,
      );

      await storage.upsertUser({
        id: userId,
        stripeSubscriptionId: subscription.id,
        subscriptionPlan: planName || "free",
        subscriptionStatus: subscription.status,
        subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        trialEndDate: subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : undefined,
        // If canceled, Stripe might set 'cancel_at_period_end' or status becomes 'canceled'
      });
      break;
    }
    case "customer.subscription.deleted": {
      // Handles subscription cancellations (immediate or at period end if not handled by updated)
      const subscription = session as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const userId = subscription.metadata.userId;

      if (!userId) {
        console.error(
          `customer.subscription.deleted: User ID não encontrado na metadata da Subscription ID: ${subscription.id}`,
        );
        break;
      }
      console.log(
        `Assinatura deletada para User ID: ${userId}, Customer ID: ${customerId}, Subscription ID: ${subscription.id}`,
      );

      await storage.upsertUser({
        id: userId,
        // Reset subscription fields or mark as 'canceled' and 'free' plan
        subscriptionPlan: "free",
        subscriptionStatus: "canceled", // Or 'expired' depending on context
        stripeSubscriptionId: null, // Clear the subscription ID
        subscriptionEndDate: null, // Clear the end date
        trialEndDate: null, // Clear trial date
      });
      break;
    }
    // ... handle other event types
    default:
      console.log(`Evento Stripe não tratado: ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).send();
};

// TODO: Add functions for creating checkout sessions and portal sessions
// e.g., createStripeCheckoutSession, createStripePortalSession
// These will be called by your frontend-facing API routes.

export const createStripeCheckoutSession = async (
  userId: string,
  email: string | undefined,
  planType: "premium" | "pro",
  currentUrl: string,
) => {
  let priceId: string;
  if (planType === "premium") {
    priceId = PREMIUM_PLAN_PRICE_ID;
  } else if (planType === "pro") {
    priceId = PRO_PLAN_PRICE_ID;
  } else {
    throw new Error("Plano inválido selecionado.");
  }

  const successUrl = `${currentUrl.split("/api/")[0]}/?subscription_success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${currentUrl.split("/api/")[0]}/?subscription_canceled=true`;

  const user = await storage.getUser(userId);
  let customerId = user?.stripeCustomerId;

  // Create a new Stripe customer if one doesn't exist
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email, // User's email
      metadata: {
        replitUserId: userId, // Link Stripe customer to your user ID
      },
    });
    customerId = customer.id;
    // Update your user record with the new Stripe Customer ID
    await storage.upsertUser({ id: userId, stripeCustomerId: customerId });
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    customer: customerId, // Use existing customer ID
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    // client_reference_id is used to map the checkout session back to your internal user ID in webhooks
    client_reference_id: userId,
    // metadata can also be used on the subscription itself
    subscription_data: {
      metadata: {
        userId: userId, // Store your internal user ID
      },
      // trial_period_days: 7, // Example: 7-day trial for new subscriptions
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    // allow_promotion_codes: true, // Enable if you use promotion codes
  };

  // If user is upgrading/downgrading and already has a subscription
  if (user?.stripeSubscriptionId && user.subscriptionStatus === "active") {
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId,
    );
    sessionParams.subscription_data.items = [
      {
        id: subscription.items.data[0].id, // ID of the subscription item to update
        price: priceId, // New price ID
      },
    ];
    // Add proration_behavior if needed, e.g., 'create_prorations' or 'none'
    // sessionParams.subscription_data.proration_behavior = 'create_prorations';
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
};

export const createStripePortalSession = async (
  stripeCustomerId: string,
  returnUrl?: string,
) => {
  if (!stripeCustomerId) {
    throw new Error("ID do cliente Stripe não fornecido.");
  }
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url:
      returnUrl || process.env.APP_BASE_URL || "http://localhost:5173", // Fallback URL
  });
  return portalSession;
};
