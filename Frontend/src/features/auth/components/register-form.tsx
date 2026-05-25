import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import { Alert, Button, Card, Field, Input } from "@/components/ui";
import { useAuth } from "@/features/auth/auth.provider";
import { useOnlineStatus } from "@/hooks";
import { getPostAuthRedirect } from "@/routes/access";
import { routePaths } from "@/routes/paths";
import { getErrorMessage } from "@/utils";

const registerSchema = z.object({
  displayName: z.string().min(2, "Display name should be at least 2 characters."),
  email: z.string().email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Add one uppercase letter.")
    .regex(/[a-z]/, "Add one lowercase letter.")
    .regex(/[0-9]/, "Add one number.")
    .regex(/[^A-Za-z0-9]/, "Add one special character.")
});

type RegisterSchema = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();
  const { register } = useAuth();
  const redirectTarget = (location.state as { from?: string } | null)?.from;
  const form = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: ""
    }
  });

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: (result) => {
      if (result.verification?.emailVerification?.token) {
        const params = new URLSearchParams();
        params.set("token", result.verification.emailVerification.token);
        params.set("email", result.user.email);
        navigate(`${routePaths.verifyEmail}?${params.toString()}`, { replace: true });
        return;
      }

      navigate(getPostAuthRedirect(result.user.role, redirectTarget), {
        replace: true
      });
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await registerMutation.mutateAsync(values);
  });

  return (
    <Card className="max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-accent-soft p-3 text-accent-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-3xl text-foreground">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Start with secure access, then move through profile completion, charity selection, and subscription activation.
          </p>
        </div>
      </div>

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <Field
          htmlFor="displayName"
          label="Display name"
          error={form.formState.errors.displayName?.message}
          hint="This is the name we’ll use across your member account surfaces."
          required
        >
          <Input id="displayName" placeholder="Your preferred name" {...form.register("displayName")} />
        </Field>
        <Field
          htmlFor="register-email"
          label="Email"
          error={form.formState.errors.email?.message}
          hint="You’ll verify this email before the account can fully activate."
          required
        >
          <Input id="register-email" type="email" placeholder="name@example.com" {...form.register("email")} />
        </Field>
        <Field
          htmlFor="register-password"
          label="Password"
          error={form.formState.errors.password?.message}
          hint="Use at least 8 characters with upper, lower, number, and special character."
          required
        >
          <Input id="register-password" type="password" placeholder="Create a secure password" {...form.register("password")} />
        </Field>

        {!isOnline ? (
          <Alert tone="warning" title="Offline">
            Reconnect before creating an account so the backend can issue the session securely.
          </Alert>
        ) : null}

        {registerMutation.error ? (
          <Alert tone="danger" title="We could not create your account">
            {getErrorMessage(registerMutation.error)}
          </Alert>
        ) : null}

        <Alert tone="info" title="Activation requirements">
          Account activation still requires email verification, completed profile verification,
          and confirmed payment from the backend.
        </Alert>

        <Button
          type="submit"
          className="w-full"
          variant="accent"
          disabled={registerMutation.isPending || !isOnline}
        >
          {registerMutation.isPending ? "Creating account..." : "Create Account"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-5 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to={routePaths.login} className="font-semibold text-primary underline-offset-4 hover:underline">
          Sign in instead
        </Link>
      </p>
    </Card>
  );
};
