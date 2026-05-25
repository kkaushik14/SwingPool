import { StatusCodes } from "http-status-codes";

import { SUCCESS_MESSAGES } from "../../constants/index.js";
import { sendSuccess } from "../../utils/index.js";

import { subscriptionsService } from "./subscriptions.service.js";

const requestContextFromReq = (req) => ({
  requestId: req.requestId,
  role: req.auth?.role,
  actorId: req.auth?.sub,
});

export const listSubscriptionPlans = async (_req, res) => {
  const plans = await subscriptionsService.getPublicPlans();

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: plans,
  });
};

export const adminListPlans = async (_req, res) => {
  const plans = await subscriptionsService.adminListPlans({
    includeInactive: true,
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: plans,
  });
};

export const adminCreatePlan = async (req, res) => {
  const plan = await subscriptionsService.adminCreatePlan(
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: plan,
  });
};

export const adminUpdatePlan = async (req, res) => {
  const plan = await subscriptionsService.adminUpdatePlan(
    req.validated.params.planId,
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: plan,
  });
};

export const adminListCoupons = async (_req, res) => {
  const coupons = await subscriptionsService.adminListCoupons({
    includeInactive: true,
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: coupons,
  });
};

export const adminCreateCoupon = async (req, res) => {
  const coupon = await subscriptionsService.adminCreateCoupon(
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: coupon,
  });
};

export const adminUpdateCoupon = async (req, res) => {
  const coupon = await subscriptionsService.adminUpdateCoupon(
    req.validated.params.couponId,
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: coupon,
  });
};

export const getSubscriptionConfig = async (_req, res) => {
  const subscriptionConfig = await subscriptionsService.getConfig();

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: subscriptionConfig,
  });
};

export const adminUpdateSubscriptionConfig = async (req, res) => {
  const subscriptionConfig = await subscriptionsService.adminUpdateConfig(
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: subscriptionConfig,
  });
};

export const createSubscription = async (req, res) => {
  const created = await subscriptionsService.createSubscriptionForUser(
    req.auth.sub,
    req.validated.body,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.CREATED,
    message: SUCCESS_MESSAGES.CREATED,
    data: created,
  });
};

export const confirmSubscriptionPayment = async (req, res) => {
  const confirmed = await subscriptionsService.confirmSubscriptionPayment({
    subscriptionId: req.validated.params.subscriptionId,
    requesterUserId: req.auth.sub,
    requesterRole: req.auth.role,
    paymentIntentId: req.validated.body.paymentIntentId,
    paymentConfirmed: req.validated.body.paymentConfirmed,
    paymentReference: req.validated.body.paymentReference,
    requestContext: requestContextFromReq(req),
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: confirmed,
  });
};

export const listMySubscriptions = async (req, res) => {
  const subscriptions = await subscriptionsService.listUserSubscriptions(
    req.auth.sub,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: subscriptions,
  });
};

export const listMySubscriptionHistory = async (req, res) => {
  const history = await subscriptionsService.listUserSubscriptionHistory(
    req.auth.sub,
    req.validated.query,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: history,
  });
};

export const listMyCancellationEvents = async (req, res) => {
  const events = await subscriptionsService.listUserCancellationEvents(
    req.auth.sub,
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: events,
  });
};

export const cancelSubscription = async (req, res) => {
  const canceled = await subscriptionsService.cancelSubscriptionForUser({
    subscriptionId: req.validated.params.subscriptionId,
    requesterUserId: req.auth.sub,
    requesterRole: req.auth.role,
    reason: req.validated.body.reason,
    requestContext: requestContextFromReq(req),
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: canceled,
  });
};

export const getUpgradePreview = async (req, res) => {
  const preview = await subscriptionsService.calculateUpgradePreviewForUser({
    subscriptionId: req.validated.params.subscriptionId,
    requesterUserId: req.auth.sub,
    requesterRole: req.auth.role,
    targetPlanCode: req.validated.body.targetPlanCode,
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: preview,
  });
};

export const upgradeSubscription = async (req, res) => {
  const upgraded = await subscriptionsService.upgradeSubscriptionForUser({
    subscriptionId: req.validated.params.subscriptionId,
    requesterUserId: req.auth.sub,
    requesterRole: req.auth.role,
    targetPlanCode: req.validated.body.targetPlanCode,
    paymentConfirmed: req.validated.body.paymentConfirmed,
    paymentReference: req.validated.body.paymentReference,
    requestContext: requestContextFromReq(req),
  });

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: upgraded,
  });
};

export const adminMarkRenewalFailed = async (req, res) => {
  const updated = await subscriptionsService.markRenewalFailed(
    req.validated.params.subscriptionId,
    req.validated.body.reason,
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.UPDATED,
    data: updated,
  });
};

export const adminProcessGraceExpirations = async (req, res) => {
  const summary = await subscriptionsService.processGracePeriodExpirations(
    req.validated.body.runAt || new Date(),
    requestContextFromReq(req),
  );

  return sendSuccess(res, {
    statusCode: StatusCodes.OK,
    message: SUCCESS_MESSAGES.DEFAULT,
    data: summary,
  });
};
