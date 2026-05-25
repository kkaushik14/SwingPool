import { Router } from "express";

import { USER_ROLES } from "../../enums/index.js";
import {
  authenticate,
  authorizeRoles,
  validateRequest,
} from "../../middlewares/index.js";
import { asyncHandler } from "../../utils/index.js";

import {
  adminCreateCoupon,
  adminCreatePlan,
  adminListCoupons,
  adminListPlans,
  adminMarkRenewalFailed,
  adminProcessGraceExpirations,
  adminUpdateCoupon,
  adminUpdatePlan,
  adminUpdateSubscriptionConfig,
  cancelSubscription,
  confirmSubscriptionPayment,
  createSubscription,
  getSubscriptionConfig,
  getUpgradePreview,
  listMyCancellationEvents,
  listMySubscriptionHistory,
  listMySubscriptions,
  listSubscriptionPlans,
  upgradeSubscription,
} from "./subscriptions.controller.js";
import {
  cancelSubscriptionSchema,
  confirmSubscriptionPaymentSchema,
  createCouponSchema,
  createPlanSchema,
  createSubscriptionSchema,
  processGraceExpirySchema,
  renewalFailedSchema,
  subscriptionHistoryQuerySchema,
  updateCouponSchema,
  updatePlanSchema,
  updateSubscriptionConfigSchema,
  upgradePreviewSchema,
  upgradeSubscriptionSchema,
} from "./subscriptions.validator.js";

const router = Router();

/**
 * @openapi
 * /subscriptions/plans:
 *   get:
 *     tags: [Subscriptions]
 *     summary: List active subscription plans
 */
router.get("/plans", asyncHandler(listSubscriptionPlans));

/**
 * @openapi
 * /subscriptions/config:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get effective subscription configuration
 */
router.get("/config", asyncHandler(getSubscriptionConfig));

/**
 * @openapi
 * /subscriptions:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create a subscription in pending payment state
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/",
  authenticate,
  validateRequest(createSubscriptionSchema),
  asyncHandler(createSubscription),
);
router.get("/mine", authenticate, asyncHandler(listMySubscriptions));
router.get(
  "/history",
  authenticate,
  validateRequest(subscriptionHistoryQuerySchema),
  asyncHandler(listMySubscriptionHistory),
);
router.get(
  "/cancellations",
  authenticate,
  asyncHandler(listMyCancellationEvents),
);
router.post(
  "/:subscriptionId/confirm-payment",
  authenticate,
  validateRequest(confirmSubscriptionPaymentSchema),
  asyncHandler(confirmSubscriptionPayment),
);

/**
 * @openapi
 * /subscriptions/{subscriptionId}/cancel:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Cancel a subscription immediately
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/:subscriptionId/cancel",
  authenticate,
  validateRequest(cancelSubscriptionSchema),
  asyncHandler(cancelSubscription),
);

/**
 * @openapi
 * /subscriptions/{subscriptionId}/upgrade-preview:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Preview prorated amount for an allowed upgrade path
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/:subscriptionId/upgrade-preview",
  authenticate,
  validateRequest(upgradePreviewSchema),
  asyncHandler(getUpgradePreview),
);
router.post(
  "/:subscriptionId/upgrade",
  authenticate,
  validateRequest(upgradeSubscriptionSchema),
  asyncHandler(upgradeSubscription),
);

/**
 * @openapi
 * /subscriptions/admin/plans:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Admin create a subscription plan
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/admin/plans",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  asyncHandler(adminListPlans),
);
router.post(
  "/admin/plans",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(createPlanSchema),
  asyncHandler(adminCreatePlan),
);
router.patch(
  "/admin/plans/:planId",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(updatePlanSchema),
  asyncHandler(adminUpdatePlan),
);

router.get(
  "/admin/coupons",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  asyncHandler(adminListCoupons),
);
/**
 * @openapi
 * /subscriptions/admin/coupons:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Admin create subscription coupon
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/admin/coupons",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(createCouponSchema),
  asyncHandler(adminCreateCoupon),
);
router.patch(
  "/admin/coupons/:couponId",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(updateCouponSchema),
  asyncHandler(adminUpdateCoupon),
);

router.patch(
  "/admin/config",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(updateSubscriptionConfigSchema),
  asyncHandler(adminUpdateSubscriptionConfig),
);
router.post(
  "/admin/:subscriptionId/renewal-failed",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(renewalFailedSchema),
  asyncHandler(adminMarkRenewalFailed),
);
router.post(
  "/admin/grace-period/process-expirations",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(processGraceExpirySchema),
  asyncHandler(adminProcessGraceExpirations),
);

export { router as subscriptionsRouter };
