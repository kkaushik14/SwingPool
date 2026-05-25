import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must have at least 8 characters.")
  .regex(/[A-Z]/, "Password must include at least one uppercase character.")
  .regex(/[a-z]/, "Password must include at least one lowercase character.")
  .regex(/[0-9]/, "Password must include at least one number.")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must include at least one special character.",
  );

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: passwordSchema,
    displayName: z.string().trim().min(2).max(80),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(20),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const logoutSchema = refreshSchema;

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(20),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const resendEmailVerificationSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(20),
    newPassword: passwordSchema,
  }),
  query: z.object({}).default({}),
  params: z.object({}).default({}),
});
