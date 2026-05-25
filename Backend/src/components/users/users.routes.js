import { Router } from "express";

import { USER_ROLES } from "../../enums/index.js";
import {
  authenticate,
  authorizeRoles,
  validateRequest,
} from "../../middlewares/index.js";
import { asyncHandler } from "../../utils/index.js";

import {
  adminUpdateUser,
  adminVerifyUserProfile,
  getMyProfile,
  getMyProfileVerificationStatus,
  getUserById,
  listUsers,
  updateMyProfile,
} from "./users.controller.js";
import {
  adminUpdateUserSchema,
  adminVerifyProfileSchema,
  updateProfileSchema,
  userIdParamsSchema,
} from "./users.validator.js";

const router = Router();

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get authenticated user profile
 *     security:
 *       - BearerAuth: []
 */
router.get("/me", authenticate, asyncHandler(getMyProfile));
router.patch(
  "/me",
  authenticate,
  validateRequest(updateProfileSchema),
  asyncHandler(updateMyProfile),
);

/**
 * @openapi
 * /users/me/profile:
 *   patch:
 *     tags: [Users]
 *     summary: Complete or update authenticated user profile fields
 *     security:
 *       - BearerAuth: []
 */
router.patch(
  "/me/profile",
  authenticate,
  validateRequest(updateProfileSchema),
  asyncHandler(updateMyProfile),
);

/**
 * @openapi
 * /users/me/profile-status:
 *   get:
 *     tags: [Users]
 *     summary: Get profile verification state used for subscription eligibility
 *     security:
 *       - BearerAuth: []
 */
router.get(
  "/me/profile-status",
  authenticate,
  asyncHandler(getMyProfileVerificationStatus),
);

router.get(
  "/",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  asyncHandler(listUsers),
);
router.get(
  "/:id",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(userIdParamsSchema),
  asyncHandler(getUserById),
);
router.patch(
  "/:id",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(adminUpdateUserSchema),
  asyncHandler(adminUpdateUser),
);
router.patch(
  "/:id/profile-verification",
  authenticate,
  authorizeRoles(USER_ROLES.ADMIN),
  validateRequest(adminVerifyProfileSchema),
  asyncHandler(adminVerifyUserProfile),
);

export { router as usersRouter };
