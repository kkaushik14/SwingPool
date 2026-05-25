import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Alert,
  Badge,
  Button,
  Card,
  OperationalStatePanel,
  PageSectionSkeleton,
  RetryButton,
  Input,
  Label,
  SectionHeading,
  Spinner
} from "@/components";
import { queryClient } from "@/lib";
import { queryKeys } from "@/constants";
import {
  AccountInlineStatusCards,
  selectAccountStatusNotices
} from "@/features/notifications";
import { useOnlineStatus } from "@/hooks";
import { usersService } from "@/services";
import { getErrorMessage, toStatusLabel, toStatusTone } from "@/utils";

const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(10),
  dateOfBirth: z.string().min(1),
  addressLine1: z.string().min(3),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().min(2)
});

type ProfileSchema = z.infer<typeof profileSchema>;

export const ProfilePage = () => {
  const isOnline = useOnlineStatus();
  const profileQuery = useQuery({
    queryKey: queryKeys.myProfile,
    queryFn: async () => (await usersService.getMe()).data
  });
  const profileStatusQuery = useQuery({
    queryKey: queryKeys.profileStatus,
    queryFn: async () => (await usersService.getProfileStatus()).data
  });

  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      addressLine1: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India"
    }
  });

  useEffect(() => {
    if (profileQuery.data?.profile) {
      form.reset({
        firstName: profileQuery.data.profile.firstName || "",
        lastName: profileQuery.data.profile.lastName || "",
        phone: profileQuery.data.profile.phone || "",
        dateOfBirth: profileQuery.data.profile.dateOfBirth?.slice(0, 10) || "",
        addressLine1: profileQuery.data.profile.addressLine1 || "",
        city: profileQuery.data.profile.city || "",
        state: profileQuery.data.profile.state || "",
        postalCode: profileQuery.data.profile.postalCode || "",
        country: profileQuery.data.profile.country || "India"
      });
    }
  }, [profileQuery.data, form]);

  const updateMutation = useMutation({
    mutationFn: usersService.updateProfile,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
      await queryClient.invalidateQueries({ queryKey: queryKeys.profileStatus });
    }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync(values);
  });
  const accountNotices = selectAccountStatusNotices({
    profileStatus: profileStatusQuery.data
  });
  const isInitialLoading =
    (profileQuery.isPending || profileStatusQuery.isPending) &&
    !profileQuery.data &&
    !profileStatusQuery.data;
  const hasBlockingError =
    (profileQuery.isError || profileStatusQuery.isError) &&
    !profileQuery.data &&
    !profileStatusQuery.data;
  const retryProfileQueries = async () => {
    await Promise.all([profileQuery.refetch(), profileStatusQuery.refetch()]);
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Profile"
        title="Complete the verification-ready profile"
        description="This form mirrors the backend profile completion contract that gates subscription activation."
      />

      {!isOnline && (profileQuery.data || profileStatusQuery.data) ? (
        <Alert tone="warning" title="Offline view">
          Profile changes cannot be submitted until the connection returns, but the last synced
          verification state is still visible.
        </Alert>
      ) : null}

      {isInitialLoading ? <PageSectionSkeleton cards={2} rows={3} /> : null}

      {!isInitialLoading && hasBlockingError ? (
        <OperationalStatePanel
          action={<RetryButton onClick={() => void retryProfileQueries()} />}
          description="The profile form or verification summary could not be loaded from the backend."
          state="error"
          title="Profile details are temporarily unavailable"
        />
      ) : null}

      {!isInitialLoading && !hasBlockingError ? (
        <>
          <AccountInlineStatusCards notices={accountNotices} surface="profile" />

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="space-y-5 bg-surface-elevated/95">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-2xl text-foreground">Verification status</h3>
            <Badge tone={toStatusTone(profileStatusQuery.data?.profileVerificationStatus)}>
              {toStatusLabel(profileStatusQuery.data?.profileVerificationStatus)}
            </Badge>
          </div>
          <div className="space-y-4 rounded-3xl border border-border/70 bg-surface-soft/80 p-5 text-sm text-muted-foreground">
            <div className="flex items-center justify-between gap-4">
              <span>Email verification</span>
              <Badge tone={profileStatusQuery.data?.emailVerified ? "success" : "warning"}>
                {profileStatusQuery.data?.emailVerified ? "Verified" : "Pending"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Profile completion</span>
              <Badge tone={profileStatusQuery.data?.profileCompleted ? "success" : "warning"}>
                {profileStatusQuery.data?.profileCompleted ? "Complete" : "Incomplete"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Subscription eligibility</span>
              <Badge tone={profileStatusQuery.data?.eligibleForSubscription ? "success" : "warning"}>
                {profileStatusQuery.data?.eligibleForSubscription ? "Ready" : "Blocked"}
              </Badge>
            </div>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            Keep this page accurate and current. Once the backend sees complete details, profile verification can move forward and billing activation can proceed safely.
          </p>
        </Card>

        <Card className="bg-surface-elevated/95">
        <form className="grid gap-5 md:grid-cols-2" onSubmit={onSubmit}>
          {[
            ["firstName", "First Name"],
            ["lastName", "Last Name"],
            ["phone", "Phone"],
            ["dateOfBirth", "Date of Birth"],
            ["addressLine1", "Address"],
            ["city", "City"],
            ["state", "State"],
            ["postalCode", "Postal Code"],
            ["country", "Country"]
          ].map(([field, label]) => (
            <div key={field} className={field === "addressLine1" ? "md:col-span-2" : undefined}>
              <Label htmlFor={field}>{label}</Label>
              <Input id={field} type={field === "dateOfBirth" ? "date" : "text"} {...form.register(field as keyof ProfileSchema)} />
              {form.formState.errors[field as keyof ProfileSchema] ? (
                <p className="mt-2 text-sm text-danger">
                  {form.formState.errors[field as keyof ProfileSchema]?.message as string}
                </p>
              ) : null}
            </div>
          ))}
          <div className="md:col-span-2">
            {updateMutation.error ? <Alert tone="danger">{getErrorMessage(updateMutation.error)}</Alert> : null}
            {updateMutation.isSuccess ? <Alert tone="success">Profile updated. Admin verification can now continue.</Alert> : null}
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending || !isOnline}>
              {updateMutation.isPending ? <Spinner /> : null}
              {updateMutation.isPending ? "Saving profile..." : "Save profile"}
            </Button>
          </div>
        </form>
        </Card>
      </div>
        </>
      ) : null}
    </div>
  );
};
