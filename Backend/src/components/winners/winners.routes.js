import { Router } from "express";

import { USER_ROLES } from "../../enums/index.js";
import {
  authenticate,
  authorizeRoles,
  validateRequest,
} from "../../middlewares/index.js";
import { asyncHandler } from "../../utils/index.js";

import {
  createWinner,
  getMineWinnerById,
  getWinnerById,
  listMineWinners,
  listWinnerProofs,
  listWinnersAdmin,
  reviewWinnerProof,
  submitWinnerProof,
  updateWinnerPayout,
} from "./winners.controller.js";
import {
  createWinnerSchema,
  listWinnersAdminQuerySchema,
  reviewWinnerProofSchema,
  submitWinnerProofSchema,
  updateWinnerPayoutSchema,
  winnerIdParamsSchema,
  winnersIdParamsSchema,
} from "./winners.validator.js";

const router = Router();

/**
 * @openapi
 * /winners/mine:
 *   get:
 *     tags: [Winners]
 *     summary: List authenticated user winner records
 *     security:
 *       - BearerAuth: []
 */
router.get("/mine", authenticate, asyncHandler(listMineWinners));
router.get(
  "/mine/:id",
  authenticate,
  validateRequest(winnersIdParamsSchema),
  asyncHandler(getMineWinnerById),
);

/**
 * @openapi
 * /winners/{winnerId}/proofs:
 *   post:
 *     tags: [Winners]
 *     summary: Submit winner proof files (max 2 files)
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/:winnerId/proofs",
  authenticate,
  validateRequest(submitWinnerProofSchema),
  asyncHandler(submitWinnerProof),
);
router.get(
  "/:winnerId/proofs",
  authenticate,
  validateRequest(winnerIdParamsSchema),
  asyncHandler(listWinnerProofs),
);

/**
 * @openapi
 * /winners/admin:
 *   get:
 *     tags: [Winners]
 *     summary: Admin list winners by draw and payout status
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/admin",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(listWinnersAdminQuerySchema),
  asyncHandler(listWinnersAdmin),
);
router.get(
  "/admin/:id",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(winnersIdParamsSchema),
  asyncHandler(getWinnerById),
);
router.post(
  "/admin",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(createWinnerSchema),
  asyncHandler(createWinner),
);

/**
 * @openapi
 * /winners/admin/{winnerId}/proofs/{proofId}/review:
 *   patch:
 *     tags: [Winners]
 *     summary: Admin approve or reject submitted proof
 *     security:
 *       - BearerAuth: []
 */
router.patch(
  "/admin/:winnerId/proofs/:proofId/review",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(reviewWinnerProofSchema),
  asyncHandler(reviewWinnerProof),
);

/**
 * @openapi
 * /winners/admin/{winnerId}/payout:
 *   patch:
 *     tags: [Winners]
 *     summary: Admin update payout workflow status
 *     security:
 *       - BearerAuth: []
 */
router.patch(
  "/admin/:winnerId/payout",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(updateWinnerPayoutSchema),
  asyncHandler(updateWinnerPayout),
);

export { router as winnersRouter };
