import {
  PROFILE_COMPLETION_STATUSES,
  PROFILE_VERIFICATION_STATUSES,
  USER_STATUSES,
} from "../../enums/index.js";

const toPlain = (value) => (value?.toObject ? value.toObject() : value);

export const toUserProfileDto = (profile) => {
  if (!profile) {
    return null;
  }

  const item = toPlain(profile);

  return {
    id: item.id || item._id?.toString(),
    userId: item.userId?.toString?.() || item.userId,
    firstName: item.firstName,
    lastName: item.lastName,
    phone: item.phone,
    dateOfBirth: item.dateOfBirth,
    handicapIndex: item.handicapIndex,
    addressLine1: item.addressLine1,
    city: item.city,
    state: item.state,
    postalCode: item.postalCode,
    country: item.country,
    completionStatus: item.completionStatus,
    verificationStatus: item.verificationStatus,
    verificationReason: item.verificationReason,
    verifiedBy: item.verifiedBy,
    verifiedAt: item.verifiedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const toUserDto = (user, profile = null) => {
  if (!user) {
    return null;
  }

  const item = toPlain(user);

  return {
    id: item.id || item._id?.toString(),
    email: item.email,
    displayName: item.displayName,
    role: item.role,
    status: item.status,
    emailVerifiedAt: item.emailVerifiedAt,
    mustRotatePassword: Boolean(item.mustRotatePassword),
    subscriptionStatus: item.subscriptionStatus,
    lastLoginAt: item.lastLoginAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    profile: toUserProfileDto(profile),
  };
};

export const toProfileVerificationDto = (user, profile) => {
  const userItem = toPlain(user);
  const profileItem = toPlain(profile);

  const isEmailVerified = Boolean(userItem?.emailVerifiedAt);
  const isProfileCompleted =
    profileItem?.completionStatus === PROFILE_COMPLETION_STATUSES.COMPLETED;
  const isProfileVerified =
    profileItem?.verificationStatus === PROFILE_VERIFICATION_STATUSES.VERIFIED;
  const isEligibleForSubscription =
    userItem?.status === USER_STATUSES.VERIFIED &&
    isEmailVerified &&
    isProfileCompleted &&
    isProfileVerified;

  return {
    userId: userItem?.id || userItem?._id?.toString(),
    userStatus: userItem?.status,
    emailVerified: isEmailVerified,
    profileCompleted: isProfileCompleted,
    profileVerificationStatus:
      profileItem?.verificationStatus ||
      PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
    eligibleForSubscription: isEligibleForSubscription,
  };
};
