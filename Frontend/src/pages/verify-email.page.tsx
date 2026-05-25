import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, MailCheck, RefreshCcw } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";

import { Alert, Button, ButtonLink, Card, Field, Input, Spinner } from "@/components";
import { queryKeys } from "@/constants";
import { useAuth } from "@/features/auth";
import { useOnlineStatus } from "@/hooks";
import { routePaths } from "@/routes/paths";
import { authService } from "@/services";
import { getErrorMessage } from "@/utils";

const resendSchema = z.object({
  email: z.string().email("Enter a valid email address.")
});

type ResendValues = z.infer<typeof resendSchema>;

export const VerifyEmailPage = () => {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || user?.email || "";
  const form = useForm<ResendValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: {
      email: emailParam
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async (verificationToken: string) =>
      authService.verifyEmail(verificationToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profileStatus })
      ]);
    }
  });

  const resendMutation = useMutation({
    mutationFn: async ({ email }: ResendValues) => authService.resendVerification(email)
  });

  useEffect(() => {
    if (!token || verifyMutation.isPending || verifyMutation.isSuccess || verifyMutation.isError) {
      return;
    }

    void verifyMutation.mutateAsync(token);
  }, [token, verifyMutation]);

  const onSubmitResend = form.handleSubmit(async (values) => {
    await resendMutation.mutateAsync(values);
  });

  const successCtaPath = isAuthenticated ? routePaths.onboardingVerify : routePaths.login;

  return (
    <Card className="max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-primary-soft p-3 text-primary">
          <MailCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl text-foreground">Verify your email</h1>
          <p className="text-sm text-muted-foreground">
            We keep account activation blocked until the backend confirms your email address.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {token && verifyMutation.isPending ? (
          <Alert tone="info" title="Verifying email">
            <span className="inline-flex items-center gap-2">
              <Spinner />
              We’re submitting your verification token to the backend now.
            </span>
          </Alert>
        ) : null}

        {verifyMutation.isSuccess ? (
          <Alert tone="success" title="Email verified">
            The backend confirmed your email address. You can continue through onboarding or return
            to sign in if needed.
          </Alert>
        ) : null}

        {token && verifyMutation.isError ? (
          <Alert tone="danger" title="Verification did not complete">
            {getErrorMessage(
              verifyMutation.error,
              "That verification link could not be completed. You can request a new one below."
            )}
          </Alert>
        ) : null}

        {verifyMutation.isSuccess ? (
          <ButtonLink to={successCtaPath}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        ) : (
          <form className="space-y-5" onSubmit={onSubmitResend} noValidate>
            <Field
              htmlFor="resend-email"
              label="Email"
              error={form.formState.errors.email?.message}
              hint="Use this if your original verification link expired or never arrived."
              required
            >
              <Input
                id="resend-email"
                type="email"
                placeholder="name@example.com"
                {...form.register("email")}
              />
            </Field>

            {!isOnline ? (
              <Alert tone="warning" title="Offline">
                Reconnect to request a fresh verification email.
              </Alert>
            ) : null}

            {resendMutation.isSuccess ? (
              <Alert tone="success" title="Verification email sent">
                The backend accepted the resend request. Check your inbox for the next link.
              </Alert>
            ) : null}

            {resendMutation.error ? (
              <Alert tone="danger" title="We could not resend verification">
                {getErrorMessage(resendMutation.error)}
              </Alert>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={resendMutation.isPending || !isOnline}
                variant="accent"
              >
                {resendMutation.isPending ? "Sending..." : "Resend verification"}
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <ButtonLink
                to={isAuthenticated ? routePaths.onboarding : routePaths.login}
                variant="secondary"
              >
                Back
              </ButtonLink>
            </div>
          </form>
        )}
      </div>
    </Card>
  );
};
