import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Alert, Button, Card, Field, Input } from "@/components/ui";
import { useAuth } from "@/features/auth/auth.provider";
import { useOnlineStatus } from "@/hooks";
import { getPostAuthRedirect } from "@/routes/access";
import { routePaths } from "@/routes/paths";
import { getErrorMessage } from "@/utils";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.")
});

type LoginSchema = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const { login } = useAuth();
  const redirectTarget = (location.state as { from?: string } | null)?.from;
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (result) => {
      navigate(getPostAuthRedirect(result.user.role, redirectTarget), {
        replace: true
      });
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await loginMutation.mutateAsync(values);
  });

  return (
    <Card className="max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-primary-soft p-3 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Securely re-enter your account and continue from verification, scores, or admin operations.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        {redirectTarget ? (
          <Alert tone="info" title="You’ll continue where you left off">
            After sign-in, we’ll send you back to the requested protected route if your role is allowed there.
          </Alert>
        ) : null}
        <Field
          htmlFor="email"
          label="Email"
          error={form.formState.errors.email?.message}
          hint="Use the email attached to your member or admin account."
          required
        >
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            {...form.register("email")}
          />
        </Field>
        <Field
          htmlFor="password"
          label="Password"
          error={form.formState.errors.password?.message}
          required
        >
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...form.register("password")}
          />
        </Field>

        {!isOnline ? (
          <Alert tone="warning" title="Offline">
            Reconnect before signing in so the backend can validate your credentials.
          </Alert>
        ) : null}

        {loginMutation.error ? (
          <Alert tone="danger" title="We could not sign you in">
            {getErrorMessage(loginMutation.error)}
          </Alert>
        ) : null}

        <Button type="submit" className="w-full" disabled={loginMutation.isPending || !isOnline}>
          {loginMutation.isPending ? "Signing in..." : "Sign In"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <Link
          to={routePaths.forgotPassword}
          className="font-semibold text-primary underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
        <p>
          New to Swing Pool?{" "}
          <Link to={routePaths.signup} className="font-semibold text-primary underline-offset-4 hover:underline">
          Create an account
          </Link>
        </p>
      </div>
    </Card>
  );
};
