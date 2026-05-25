import { Router } from "express";

import { USER_ROLES } from "../../enums/index.js";
import {
  authenticate,
  authorizeRoles,
  validateRequest,
} from "../../middlewares/index.js";
import { asyncHandler } from "../../utils/index.js";

import {
  createMine,
  getMineById,
  getMineCompetitionEligibility,
  listMineCompetitionQualifying,
  listMineHistory,
  updateByAdmin,
} from "./scores.controller.js";
import {
  createScoreSchema,
  listScoreHistoryQuerySchema,
  scoresIdParamsSchema,
  updateScoreByAdminSchema,
} from "./scores.validator.js";

const router = Router();

/**
 * @openapi
 * /scores:
 *   post:
 *     tags: [Scores]
 *     summary: Submit user score (stored in full history and confirmed immutable)
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/",
  authenticate,
  validateRequest(createScoreSchema),
  asyncHandler(createMine),
);

/**
 * @openapi
 * /scores/mine:
 *   get:
 *     tags: [Scores]
 *     summary: List authenticated user score history with pagination
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/mine",
  authenticate,
  validateRequest(listScoreHistoryQuerySchema),
  asyncHandler(listMineHistory),
);

/**
 * @openapi
 * /scores/mine/competition/qualifying:
 *   get:
 *     tags: [Scores]
 *     summary: Get latest five qualifying competition scores
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/mine/competition/qualifying",
  authenticate,
  asyncHandler(listMineCompetitionQualifying),
);

/**
 * @openapi
 * /scores/mine/competition/eligibility:
 *   get:
 *     tags: [Scores]
 *     summary: Get current competition eligibility status
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/mine/competition/eligibility",
  authenticate,
  asyncHandler(getMineCompetitionEligibility),
);

/**
 * @openapi
 * /scores/mine/{id}:
 *   get:
 *     tags: [Scores]
 *     summary: Get score history record by id for authenticated user
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/mine/:id",
  authenticate,
  validateRequest(scoresIdParamsSchema),
  asyncHandler(getMineById),
);

/**
 * @openapi
 * /scores/admin/{id}:
 *   patch:
 *     tags: [Scores]
 *     summary: Admin edit score with full audit logging
 *     security:
 *       - BearerAuth: []
 */
router.patch(
  "/admin/:id",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(updateScoreByAdminSchema),
  asyncHandler(updateByAdmin),
);

export { router as scoresRouter };
