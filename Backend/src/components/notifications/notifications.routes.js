import { Router } from "express";

import { authenticate, validateRequest } from "../../middlewares/index.js";
import { asyncHandler } from "../../utils/index.js";

import {
  createMine,
  getMineById,
  listMine,
  updateMine,
} from "./notifications.controller.js";
import {
  createNotificationSchema,
  notificationsIdParamsSchema,
  updateNotificationSchema,
} from "./notifications.validator.js";

const router = Router();

router.get("/mine", authenticate, asyncHandler(listMine));
router.get(
  "/:id",
  authenticate,
  validateRequest(notificationsIdParamsSchema),
  asyncHandler(getMineById),
);
router.post(
  "/",
  authenticate,
  validateRequest(createNotificationSchema),
  asyncHandler(createMine),
);
router.patch(
  "/:id",
  authenticate,
  validateRequest(updateNotificationSchema),
  asyncHandler(updateMine),
);

export { router as notificationsRouter };
