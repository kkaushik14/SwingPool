import { StatusCodes } from "http-status-codes";

import { SUCCESS_MESSAGES } from "../../constants/index.js";
import { constructStripeWebhookEvent } from "../../services/index.js";
import { sendSuccess } from "../../utils/index.js";

import { paymentsService } from "./payments.service.js";

const buildRequestContext = (req) => ({
  requestId: req.requestId,
  role: req.auth?.role,
  actorId: req.auth?.sub,
});

export const createPaymentIntent = async (req, res) => {
  const created = await paymentsService.createPaymentIntentForUser(
    req.auth.sub,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const createCheckoutSession = async (req, res) => {
  const created = await paymentsService.createCheckoutSessionForUser(
    req.auth.sub,
    req.validated.body,
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const listMyPayments = async (req, res) => {
  const payments = await paymentsService.listPaymentsForUser(req.auth.sub);

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: payments,
  });
};

export const listMyPaymentLedger = async (req, res) => {
  const ledgerEntries = await paymentsService.listPaymentLedgerForUser(
    req.auth.sub,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: ledgerEntries,
  });
};

export const processPaymentTimeouts = async (req, res) => {
  const result = await paymentsService.processTimedOutPayments(
    req.validated.body.runAt || new Date(),
    buildRequestContext(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: result,
  });
};

export const handleStripeWebhook = async (req, res) => {
  const signature = req.get("stripe-signature");
  const rawPayload = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body || {}), "utf8");

  const stripeEvent = constructStripeWebhookEvent({
    payload: rawPayload,
    signature,
  });

  const result = await paymentsService.processStripeWebhookEvent({
    event: stripeEvent,
    requestContext: buildRequestContext(req),
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: {
      acknowledged: true,
      result,
    },
  });
};
