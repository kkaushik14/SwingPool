import { randomUUID } from "node:crypto";

import Stripe from "stripe";

import { config } from "../config/index.js";
import { DEFAULT_CURRENCY } from "../constants/index.js";
import { PaymentError } from "../errors/index.js";
import { logger } from "../logger/index.js";

export const stripeClient = config.stripe.mockMode
  ? null
  : new Stripe(config.stripe.secretKey, {
      apiVersion: "2025-03-31.basil",
    });

const createMockId = (prefix) =>
  `${prefix}_mock_${randomUUID().replaceAll("-", "").slice(0, 16)}`;

const withStripeFallback = async (
  operationName,
  fallbackFactory,
  stripeCallback,
) => {
  if (!stripeClient) {
    return fallbackFactory();
  }

  try {
    return await stripeCallback();
  } catch (error) {
    logger.error(
      { operationName, error: error.message },
      "Stripe operation failed",
    );
    throw new PaymentError(`Stripe ${operationName} failed.`, {
      operationName,
      cause: error.message,
    });
  }
};

export const createPaymentIntent = async ({
  amount,
  currency = DEFAULT_CURRENCY,
  customerId,
  metadata = {},
}) => {
  return withStripeFallback(
    "createPaymentIntent",
    () => ({
      id: createMockId("pi"),
      client_secret: createMockId("pi_secret"),
      status: "requires_payment_method",
      amount,
      currency,
      customer: customerId || null,
      metadata,
      livemode: false,
    }),
    () =>
      stripeClient.paymentIntents.create({
        amount,
        currency,
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      }),
  );
};

export const constructStripeWebhookEvent = ({
  payload,
  signature,
  secret = config.stripe.webhookSecret,
}) => {
  if (!signature) {
    throw new PaymentError("Missing Stripe webhook signature header.");
  }

  if (!stripeClient) {
    try {
      return JSON.parse(
        Buffer.isBuffer(payload) ? payload.toString("utf8") : String(payload),
      );
    } catch (error) {
      throw new PaymentError("Mock webhook payload is not valid JSON.", {
        cause: error.message,
      });
    }
  }

  try {
    return stripeClient.webhooks.constructEvent(
      payload,
      signature,
      secret,
      config.stripe.webhookToleranceSeconds,
    );
  } catch (error) {
    logger.warn(
      { error: error.message },
      "Stripe webhook signature verification failed",
    );
    throw new PaymentError("Invalid Stripe webhook signature.", {
      cause: error.message,
    });
  }
};

export const retrievePaymentIntent = async (paymentIntentId) => {
  return withStripeFallback(
    "retrievePaymentIntent",
    () => ({
      id: paymentIntentId,
      status: "processing",
      amount: 0,
      amount_received: 0,
      currency: "inr",
      metadata: {},
      canceled_at: null,
      created: Math.floor(Date.now() / 1000),
    }),
    () => stripeClient.paymentIntents.retrieve(paymentIntentId),
  );
};

export const createCheckoutSession = async ({
  amount,
  currency = DEFAULT_CURRENCY,
  customerId,
  metadata = {},
  successUrl,
  cancelUrl,
}) => {
  return withStripeFallback(
    "createCheckoutSession",
    () => ({
      id: createMockId("cs"),
      object: "checkout.session",
      url: `https://mock.stripe.local/checkout/${randomUUID()}`,
      mode: "payment",
      payment_intent: createMockId("pi"),
      amount_total: amount,
      currency,
      customer: customerId || null,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
    }),
    () =>
      stripeClient.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amount,
              product_data: {
                name: metadata?.name || "Swing Pool Payment",
                description:
                  metadata?.description ||
                  "Swing Pool payment checkout session",
              },
            },
          },
        ],
        metadata,
      }),
  );
};

export const createSubscription = async ({
  customerId,
  priceId,
  metadata = {},
}) => {
  return withStripeFallback(
    "createSubscription",
    () => ({
      id: createMockId("sub"),
      customer: customerId,
      status: "active",
      items: {
        data: [
          {
            price: {
              id: priceId || "price_mock_default",
            },
          },
        ],
      },
      metadata,
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    }),
    () =>
      stripeClient.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata,
      }),
  );
};

export const createOrGetCustomer = async ({ email, name, metadata = {} }) => {
  return withStripeFallback(
    "createOrGetCustomer",
    () => ({
      id: createMockId("cus"),
      email,
      name,
      metadata,
    }),
    async () => {
      const existingCustomers = await stripeClient.customers.list({
        email,
        limit: 1,
      });
      const existing = existingCustomers.data[0];

      if (existing) {
        return existing;
      }

      return stripeClient.customers.create({
        email,
        name,
        metadata,
      });
    },
  );
};
