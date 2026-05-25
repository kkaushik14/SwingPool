import { Router } from "express";

import { USER_ROLES } from "../../enums/index.js";
import {
  authenticate,
  authorizeRoles,
  validateRequest,
} from "../../middlewares/index.js";
import { asyncHandler } from "../../utils/index.js";

import {
  getCharitiesReport,
  getDrawsReport,
  getOverviewReport,
  getPaymentsReport,
  getSubscriptionsReport,
  getUsersReport,
  getWinnersReport,
} from "./reports.controller.js";
import {
  charitiesReportQuerySchema,
  drawsReportQuerySchema,
  overviewReportQuerySchema,
  paymentsReportQuerySchema,
  subscriptionsReportQuerySchema,
  usersReportQuerySchema,
  winnersReportQuerySchema,
} from "./reports.validator.js";

const router = Router();

router.use(authenticate, authorizeRoles(USER_ROLES.ADMIN));

router.get(
  "/overview",
  validateRequest(overviewReportQuerySchema),
  asyncHandler(getOverviewReport),
);
router.get(
  "/users",
  validateRequest(usersReportQuerySchema),
  asyncHandler(getUsersReport),
);
router.get(
  "/subscriptions",
  validateRequest(subscriptionsReportQuerySchema),
  asyncHandler(getSubscriptionsReport),
);
router.get(
  "/payments",
  validateRequest(paymentsReportQuerySchema),
  asyncHandler(getPaymentsReport),
);
router.get(
  "/charities",
  validateRequest(charitiesReportQuerySchema),
  asyncHandler(getCharitiesReport),
);
router.get(
  "/draws",
  validateRequest(drawsReportQuerySchema),
  asyncHandler(getDrawsReport),
);
router.get(
  "/winners",
  validateRequest(winnersReportQuerySchema),
  asyncHandler(getWinnersReport),
);

export { router as reportsRouter };
