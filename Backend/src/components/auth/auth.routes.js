import { Router } from "express";

import { authenticate, validateRequest } from "../../middlewares/index.js";
import { asyncHandler } from "../../utils/index.js";

import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resendEmailVerification,
  resetPassword,
  verifyEmail,
} from "./auth.controller.js";
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resendEmailVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./auth.validator.js";

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account and return token pair
 */
router.post(
  "/register",
  validateRequest(registerSchema),
  asyncHandler(register),
);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate user and return token pair
 */
router.post("/login", validateRequest(loginSchema), asyncHandler(login));

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and mint new access/refresh pair
 */
router.post("/refresh", validateRequest(refreshSchema), asyncHandler(refresh));

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke refresh session and denylist active access token jti
 *     security:
 *       - BearerAuth: []
 */
router.post(
  "/logout",
  authenticate,
  validateRequest(logoutSchema),
  asyncHandler(logout),
);

router.get("/me", authenticate, asyncHandler(me));
router.post(
  "/verify-email",
  validateRequest(verifyEmailSchema),
  asyncHandler(verifyEmail),
);
router.post(
  "/resend-verification",
  validateRequest(resendEmailVerificationSchema),
  asyncHandler(resendEmailVerification),
);
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  asyncHandler(forgotPassword),
);
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  asyncHandler(resetPassword),
);

export { router as authRouter };
