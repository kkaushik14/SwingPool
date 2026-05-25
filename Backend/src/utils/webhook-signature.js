import { createHmac, timingSafeEqual } from "node:crypto";

import Stripe from "stripe";

import { config } from "../config/index.js";
import { PaymentError } from "../errors/index.js";

const stripeVerifierClient = new Stripe(
  config.stripe.secretKey || "sk_test_placeholder_key",
  {
    apiVersion: "2025-03-31.basil",
  },
);

const toBuffer = (value) => {
  if (Buffer.isBuffer(value)) {
    return value;
  }

  return Buffer.from(String(value), "utf8");
};

export const computeHmacSignature = (payload, secret, algorithm = "sha256") => {
  return createHmac(algorithm, secret).update(payload).digest("hex");
};

export const verifyHmacSignature = ({
  payload,
  signature,
  secret,
  algorithm = "sha256",
}) => {
  const expectedSignature = computeHmacSignature(payload, secret, algorithm);
  const expectedBuffer = toBuffer(expectedSignature);
  const receivedBuffer = toBuffer(signature || "");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
};

export const verifyStripeWebhookSignature = ({
  payload,
  signature,
  secret = config.stripe.webhookSecret,
}) => {
  if (!signature) {
    throw new PaymentError("Missing Stripe webhook signature.");
  }

  if (config.stripe.mockMode) {
    try {
      return JSON.parse(
        Buffer.isBuffer(payload) ? payload.toString("utf8") : String(payload),
      );
    } catch (error) {
      throw new PaymentError("Invalid Stripe webhook payload JSON.", {
        cause: error.message,
      });
    }
  }

  try {
    return stripeVerifierClient.webhooks.constructEvent(
      payload,
      signature,
      secret,
      config.stripe.webhookToleranceSeconds,
    );
  } catch (error) {
    throw new PaymentError("Invalid Stripe webhook signature.", {
      cause: error.message,
    });
  }
};
