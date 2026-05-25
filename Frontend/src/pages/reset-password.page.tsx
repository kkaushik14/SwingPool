import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";

import { Alert, Button, ButtonLink, Card, Field, Input } from "@/components";
import { useOnlineStatus } from "@/hooks";
import { routePaths } from "@/routes/paths";
import { authService } from "@/services";
import { getErrorMessage } from "@/utils";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Add one uppercase letter.")
      .regex(/[a-z]/, "Add one lowercase letter.")
      .regex(/[0-9]/, "Add one number.")
      .regex(/[^A-Za-z0-9]/, "Add one special character."),
    confirmPassword: z.string().min(1, "Confirm your new password.")
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords must match."
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export const ResetPasswordPage = () => {
  const isOnline = useOnlineStatus();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: ""
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ newPassword }: ResetPasswordValues) =>
      authService.resetPassword(token, newPassword)
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await resetPasswordMutation.mutateAsync(values);
  });

  return (
    <Card className="max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-accent-soft p-3 text-accent-foreground">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl text-foreground">Reset password</h1>
          <p className="text-sm text-muted-foreground">
            Finish the reset using the token from your email so the backend can confirm the
            request safely.
          </p>
        </div>
      </div>

      {!token ? (
        <div className="space-y-5">
          <Alert tone="warning" title="Reset token missing">
            Open this page from the reset email so we can submit the token back to the backend.
          </Alert>
          <ButtonLink to={routePaths.forgotPassword}>
            Request a new reset link
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      ) : resetPasswordMutation.isSuccess ? (
        <div className="space-y-5">
          <Alert tone="success" title="Password updated">
            Your password was changed successfully. Sign in with the new credentials to continue.
          </Alert>
          <ButtonLink to={routePaths.login}>
            Go to login
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <Field
            htmlFor="reset-password"
            label="New password"
            error={form.formState.errors.newPassword?.message}
            hint="Use a strong password with upper, lower, number, and special characters."
            required
          >
            <Input
              id="reset-password"
              type="password"
              placeholder="Create a new password"
              {...form.register("newPassword")}
            />
          </Field>

          <Field
            htmlFor="reset-password-confirm"
            label="Confirm password"
            error={form.formState.errors.confirmPassword?.message}
            required
          >
            <Input
              id="reset-password-confirm"
              type="password"
              placeholder="Repeat the new password"
              {...form.register("confirmPassword")}
            />
          </Field>

          {!isOnline ? (
            <Alert tone="warning" title="Offline">
              Reconnect before submitting the reset token and new password.
            </Alert>
          ) : null}

          {resetPasswordMutation.error ? (
            <Alert tone="danger" title="We could not reset your password">
              {getErrorMessage(resetPasswordMutation.error)}
            </Alert>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={resetPasswordMutation.isPending || !isOnline}
          >
            {resetPasswordMutation.isPending ? "Resetting..." : "Reset password"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}
    </Card>
  );
};
