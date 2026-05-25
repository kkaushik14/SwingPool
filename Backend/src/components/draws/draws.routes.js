import { Router } from "express";

import { USER_ROLES } from "../../enums/index.js";
import {
  authenticate,
  authorizeRoles,
  validateRequest,
} from "../../middlewares/index.js";
import { asyncHandler } from "../../utils/index.js";

import {
  addManualJackpotFund,
  createDrawSimulation,
  createDrawSnapshot,
  generateDrawEntries,
  getDrawConfig,
  getDrawPrizePool,
  getDrawSnapshotById,
  getPublishedDrawResult,
  listDrawEntries,
  listDrawSimulations,
  listDrawSnapshots,
  listJackpotLedger,
  publishDraw,
  updateDrawConfig,
  updateDrawSnapshot,
} from "./draws.controller.js";
import {
  addManualJackpotFundSchema,
  createDrawSnapshotSchema,
  drawIdParamsSchema,
  runDrawSimulationSchema,
  updateDrawConfigSchema,
  updateDrawSnapshotSchema,
} from "./draws.validator.js";

const router = Router();

/**
 * @openapi
 * /draws/config:
 *   get:
 *     tags: [Draws]
 *     summary: Get effective draw engine configuration
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/config",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  asyncHandler(getDrawConfig),
);

/**
 * @openapi
 * /draws/config:
 *   patch:
 *     tags: [Draws]
 *     summary: Update draw engine configuration
 *     security:
 *       - BearerAuth: []
 */
router.patch(
  "/config",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(updateDrawConfigSchema),
  asyncHandler(updateDrawConfig),
);

router.post(
  "/config/jackpot-funds",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(addManualJackpotFundSchema),
  asyncHandler(addManualJackpotFund),
);
router.get(
  "/config/jackpot-ledger",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  asyncHandler(listJackpotLedger),
);

router.get(
  "/",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  asyncHandler(listDrawSnapshots),
);
router.get(
  "/:id",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(drawIdParamsSchema),
  asyncHandler(getDrawSnapshotById),
);

/**
 * @openapi
 * /draws:
 *   post:
 *     tags: [Draws]
 *     summary: Create monthly draw snapshot
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(createDrawSnapshotSchema),
  asyncHandler(createDrawSnapshot),
);
router.patch(
  "/:id",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(updateDrawSnapshotSchema),
  asyncHandler(updateDrawSnapshot),
);

/**
 * @openapi
 * /draws/{id}/entries/generate:
 *   post:
 *     tags: [Draws]
 *     summary: Generate automatic entries for eligible users
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/:id/entries/generate",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(drawIdParamsSchema),
  asyncHandler(generateDrawEntries),
);
router.get(
  "/:id/entries",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(drawIdParamsSchema),
  asyncHandler(listDrawEntries),
);

/**
 * @openapi
 * /draws/{id}/simulations:
 *   post:
 *     tags: [Draws]
 *     summary: Run non-publishing draw simulation
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/:id/simulations",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(runDrawSimulationSchema),
  asyncHandler(createDrawSimulation),
);
router.get(
  "/:id/simulations",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(drawIdParamsSchema),
  asyncHandler(listDrawSimulations),
);

/**
 * @openapi
 * /draws/{id}/publish:
 *   post:
 *     tags: [Draws]
 *     summary: Publish immutable draw result, winners, and prize pool snapshot
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/:id/publish",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(drawIdParamsSchema),
  asyncHandler(publishDraw),
);
router.get(
  "/:id/result",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(drawIdParamsSchema),
  asyncHandler(getPublishedDrawResult),
);
router.get(
  "/:id/prize-pool",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(drawIdParamsSchema),
  asyncHandler(getDrawPrizePool),
);

export { router as drawsRouter };
