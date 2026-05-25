import express, { Router } from "express";

import { USER_ROLES } from "../../enums/index.js";
import {
  authenticate,
  authorizeRoles,
  validateRequest,
} from "../../middlewares/index.js";
import { asyncHandler } from "../../utils/index.js";

import {
  createCheckoutSession,
  createPaymentIntent,
  handleStripeWebhook,
  listMyPaymentLedger,
  listMyPayments,
  processPaymentTimeouts,
} from "./payments.controller.js";
import {
  createCheckoutSessionSchema,
  createPaymentIntentSchema,
  processTimeoutsSchema,
} from "./payments.validator.js";

const router = Router();

/**
 * @openapi
 * /payments/webhooks/stripe:
 *   post:
 *     tags: [Payments]
 *     summary: Stripe webhook receiver (source of truth for payment finalization)
 */
router.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  asyncHandler(handleStripeWebhook),
);

/**
 * @openapi
 * /payments/mine:
 *   get:
 *     tags: [Payments]
 *     summary: List authenticated user payments
 *     security:
 *       - BearerAuth: []
 */
router.get("/mine", authenticate, asyncHandler(listMyPayments));
router.get("/ledger/mine", authenticate, asyncHandler(listMyPaymentLedger));

/**
 * @openapi
 * /payments/intents:
 *   post:
 *     tags: [Payments]
 *     summary: Create Stripe payment intent and local payment attempt record
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/intents",
  authenticate,
  validateRequest(createPaymentIntentSchema),
  asyncHandler(createPaymentIntent),
);
router.post(
  "/checkout-session",
  authenticate,
  validateRequest(createCheckoutSessionSchema),
  asyncHandler(createCheckoutSession),
);

router.post(
  "/admin/process-timeouts",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(processTimeoutsSchema),
  asyncHandler(processPaymentTimeouts),
);

export { router as paymentsRouter };
