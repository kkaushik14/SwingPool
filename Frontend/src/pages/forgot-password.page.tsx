import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { Alert, Button, ButtonLink, Card, Field, Input } from "@/components";
import { useOnlineStatus } from "@/hooks";
import { routePaths } from "@/routes/paths";
import { authService } from "@/services";
import { getErrorMessage } from "@/utils";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address.")
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const isOnline = useOnlineStatus();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ""
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async ({ email }: ForgotPasswordValues) =>
      authService.forgotPassword(email)
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await forgotPasswordMutation.mutateAsync(values);
  });

  return (
    <Card className="max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-primary-soft p-3 text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl text-foreground">Forgot password</h1>
          <p className="text-sm text-muted-foreground">
            Request a reset link and finish the password change from a secure tokenized page.
          </p>
        </div>
      </div>

      {forgotPasswordMutation.isSuccess ? (
        <div className="space-y-5">
          <Alert tone="success" title="Reset instructions sent">
            If that email exists in the system, the backend has queued a reset email with the
            next secure step.
          </Alert>
          <div className="flex flex-wrap gap-3">
            <ButtonLink to={routePaths.login}>
              Back to login
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <Button
              variant="secondary"
              onClick={() => {
                forgotPasswordMutation.reset();
                form.reset();
              }}
            >
              Send another request
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <Field
            htmlFor="forgot-email"
            label="Email"
            error={form.formState.errors.email?.message}
            hint="Use the same email address tied to your member or admin account."
            required
          >
            <Input
              id="forgot-email"
              type="email"
              placeholder="name@example.com"
              {...form.register("email")}
            />
          </Field>

          {!isOnline ? (
            <Alert tone="warning" title="Offline">
              Reconnect to request a password-reset email from the backend.
            </Alert>
          ) : null}

          {forgotPasswordMutation.error ? (
            <Alert tone="danger" title="We could not start password reset">
              {getErrorMessage(forgotPasswordMutation.error)}
            </Alert>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={forgotPasswordMutation.isPending || !isOnline}
          >
            {forgotPasswordMutation.isPending ? "Sending..." : "Send reset link"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      )}

      <p className="mt-5 text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link
          to={routePaths.login}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Return to login
        </Link>
      </p>
    </Card>
  );
};
