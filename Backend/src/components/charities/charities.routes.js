import { Router } from "express";

import { USER_ROLES } from "../../enums/index.js";
import {
  authenticate,
  authorizeRoles,
  validateRequest,
} from "../../middlewares/index.js";
import { asyncHandler } from "../../utils/index.js";

import {
  createCharity,
  createDonationIntent,
  createManualAdjustment,
  createPayoutEntry,
  getCharityById,
  getCharityReportsSummary,
  getContributionRule,
  getMySelection,
  listCharity,
  listMyDonations,
  listMySelectionHistory,
  listPayoutEntries,
  setMySelection,
  updateCharity,
  updateContributionRule,
  updatePayoutEntry,
} from "./charities.controller.js";
import {
  charitiesIdParamsSchema,
  createCharitySchema,
  createDonationIntentSchema,
  createPayoutEntrySchema,
  reportsQuerySchema,
  setMyCharitySelectionSchema,
  updateCharitySchema,
  updateContributionRuleSchema,
  updatePayoutEntrySchema,
} from "./charities.validator.js";

const router = Router();

/**
 * @openapi
 * /charities:
 *   get:
 *     tags: [Charities]
 *     summary: List charities
 */
router.get("/", asyncHandler(listCharity));

/**
 * @openapi
 * /charities/rules/effective:
 *   get:
 *     tags: [Charities]
 *     summary: Get active charity contribution rule
 */
router.get("/rules/effective", asyncHandler(getContributionRule));

/**
 * @openapi
 * /charities/my/selection:
 *   get:
 *     tags: [Charities]
 *     summary: Get current authenticated user charity selection
 *     security:
 *       - BearerAuth: []
 */
router.get("/my/selection", authenticate, asyncHandler(getMySelection));

/**
 * @openapi
 * /charities/my/selections:
 *   get:
 *     tags: [Charities]
 *     summary: List authenticated user charity selection history
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/my/selections",
  authenticate,
  asyncHandler(listMySelectionHistory),
);

/**
 * @openapi
 * /charities/my/selection:
 *   post:
 *     tags: [Charities]
 *     summary: Set charity selection for future payments
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/my/selection",
  authenticate,
  validateRequest(setMyCharitySelectionSchema),
  asyncHandler(setMySelection),
);

/**
 * @openapi
 * /charities/my/donations:
 *   get:
 *     tags: [Charities]
 *     summary: List authenticated user donations
 *     security:
 *       - BearerAuth: []
 */
router.get("/my/donations", authenticate, asyncHandler(listMyDonations));

/**
 * @openapi
 * /charities/my/donations/intents:
 *   post:
 *     tags: [Charities]
 *     summary: Create independent donation intent linked to payment infrastructure
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/my/donations/intents",
  authenticate,
  validateRequest(createDonationIntentSchema),
  asyncHandler(createDonationIntent),
);

/**
 * @openapi
 * /charities:
 *   post:
 *     tags: [Charities]
 *     summary: Admin create charity
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(createCharitySchema),
  asyncHandler(createCharity),
);

/**
 * @openapi
 * /charities/admin/rules:
 *   patch:
 *     tags: [Charities]
 *     summary: Admin update contribution rule percentages
 *     security:
 *       - BearerAuth: []
 */
router.patch(
  "/admin/rules",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(updateContributionRuleSchema),
  asyncHandler(updateContributionRule),
);

/**
 * @openapi
 * /charities/admin/payouts:
 *   get:
 *     tags: [Charities]
 *     summary: Admin list charity payout ledger entries
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/admin/payouts",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  asyncHandler(listPayoutEntries),
);

/**
 * @openapi
 * /charities/admin/payouts:
 *   post:
 *     tags: [Charities]
 *     summary: Admin create payout ledger entry
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/admin/payouts",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(createPayoutEntrySchema),
  asyncHandler(createPayoutEntry),
);

/**
 * @openapi
 * /charities/admin/payouts/{payoutId}:
 *   patch:
 *     tags: [Charities]
 *     summary: Admin update payout processing status
 *     security:
 *       - BearerAuth: []
 */
router.patch(
  "/admin/payouts/:payoutId",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(updatePayoutEntrySchema),
  asyncHandler(updatePayoutEntry),
);

/**
 * @openapi
 * /charities/admin/adjustments:
 *   post:
 *     tags: [Charities]
 *     summary: Admin create manual charity adjustment
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/admin/adjustments",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(createPayoutEntrySchema),
  asyncHandler(createManualAdjustment),
);

/**
 * @openapi
 * /charities/admin/reports/summary:
 *   get:
 *     tags: [Charities]
 *     summary: Admin fetch charity allocation and payout aggregates
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/admin/reports/summary",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(reportsQuerySchema),
  asyncHandler(getCharityReportsSummary),
);

/**
 * @openapi
 * /charities/{id}:
 *   get:
 *     tags: [Charities]
 *     summary: Get charity by id
 */
router.get(
  "/:id",
  validateRequest(charitiesIdParamsSchema),
  asyncHandler(getCharityById),
);

/**
 * @openapi
 * /charities/{id}:
 *   patch:
 *     tags: [Charities]
 *     summary: Admin update charity
 *     security:
 *       - BearerAuth: []
 */
router.patch(
  "/:id",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(updateCharitySchema),
  asyncHandler(updateCharity),
);

export { router as charitiesRouter };
