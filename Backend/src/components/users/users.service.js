import {
  PROFILE_COMPLETION_STATUSES,
  PROFILE_VERIFICATION_STATUSES,
  USER_STATUSES,
} from "../../enums/index.js";
import { AppError, DomainError } from "../../errors/index.js";
import { logAuditEvent } from "../../services/index.js";

import {
  toProfileVerificationDto,
  toUserDto,
  toUserProfileDto,
} from "./users.dto.js";
import { usersProfileRules, usersRepository } from "./users.repository.js";

const determineUserVerificationStatus = ({ user, profile }) => {
  const isEmailVerified = Boolean(user?.emailVerifiedAt);
  const isProfileComplete =
    profile?.completionStatus === PROFILE_COMPLETION_STATUSES.COMPLETED;
  const isProfileVerified =
    profile?.verificationStatus === PROFILE_VERIFICATION_STATUSES.VERIFIED;

  if (isEmailVerified && isProfileComplete && isProfileVerified) {
    return USER_STATUSES.VERIFIED;
  }

  if (user?.status === USER_STATUSES.SUSPENDED) {
    return USER_STATUSES.SUSPENDED;
  }

  if (user?.status === USER_STATUSES.INACTIVE) {
    return USER_STATUSES.INACTIVE;
  }

  return USER_STATUSES.PENDING_VERIFICATION;
};

const syncUserStatusWithProfile = async (userId) => {
  const [user, profile] = await Promise.all([
    usersRepository.findById(userId),
    usersRepository.findProfileByUserId(userId),
  ]);

  if (!user) {
    throw AppError.notFound("User not found.");
  }

  const targetStatus = determineUserVerificationStatus({ user, profile });

  if (targetStatus !== user.status) {
    await usersRepository.updateById(userId, {
      status: targetStatus,
    });
  }

  const reloadedUser = await usersRepository.findById(userId);

  return {
    user: reloadedUser,
    profile,
  };
};

const assertUserIsSubscriptionEligible = ({ user, profile }) => {
  const verification = toProfileVerificationDto(user, profile);

  if (!verification.eligibleForSubscription) {
    throw new DomainError(
      "Subscription can be activated only after email and profile verification are fully completed.",
      verification,
    );
  }
};

export const sanitizeUser = (user, profile = null) => toUserDto(user, profile);

export const usersService = {
  async createUserRecord(payload) {
    const created = await usersRepository.create(payload);
    return sanitizeUser(created);
  },

  async createUserProfileRecord(payload) {
    const createdProfile = await usersRepository.createProfile(payload);
    return toUserProfileDto(createdProfile);
  },

  async getUserProfile(userId) {
    const [user, profile] = await Promise.all([
      usersRepository.findById(userId),
      usersRepository.findProfileByUserId(userId),
    ]);

    if (!user) {
      throw AppError.notFound("User profile not found.");
    }

    return sanitizeUser(user, profile);
  },

  async getUserById(userId) {
    const [user, profile] = await Promise.all([
      usersRepository.findById(userId),
      usersRepository.findProfileByUserId(userId),
    ]);

    if (!user) {
      throw AppError.notFound("User not found.");
    }

    return sanitizeUser(user, profile);
  },

  async listUsers() {
    const users = await usersRepository.list();
    const profiles = await Promise.all(
      users.map((item) => usersRepository.findProfileByUserId(item.id)),
    );

    return users.map((item, index) => sanitizeUser(item, profiles[index]));
  },

  async updateOwnProfile(userId, updatePayload, requestContext = {}) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw AppError.notFound("User not found.");
    }

    const fieldsAffectingVerification =
      usersProfileRules.REQUIRED_PROFILE_FIELDS.some((field) =>
        Object.prototype.hasOwnProperty.call(updatePayload, field),
      );

    const profileUpdatePayload = {
      ...updatePayload,
    };

    if (fieldsAffectingVerification) {
      profileUpdatePayload.verificationStatus =
        PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION;
      profileUpdatePayload.verificationReason = "";
      profileUpdatePayload.verifiedAt = null;
      profileUpdatePayload.verifiedBy = null;
    }

    const updatedProfile = await usersRepository.upsertProfileByUserId(
      userId,
      profileUpdatePayload,
    );

    await syncUserStatusWithProfile(userId);
    const latestUser = await usersRepository.findById(userId);

    logAuditEvent({
      action: "users.profile.update",
      actorId: userId,
      actorRole: user.role,
      entity: "UserProfile",
      entityId: updatedProfile.id,
      requestId: requestContext.requestId,
      metadata: {
        updatedFields: Object.keys(updatePayload),
      },
    });

    return sanitizeUser(latestUser, updatedProfile);
  },

  async getProfileVerificationStatus(userId) {
    const [user, profile] = await Promise.all([
      usersRepository.findById(userId),
      usersRepository.findProfileByUserId(userId),
    ]);

    if (!user) {
      throw AppError.notFound("User not found.");
    }

    return toProfileVerificationDto(user, profile);
  },

  async adminUpdateUser(userId, updatePayload, requestContext = {}) {
    const updated = await usersRepository.updateById(userId, updatePayload);

    if (!updated) {
      throw AppError.notFound("User not found.");
    }

    const profile = await usersRepository.findProfileByUserId(userId);

    logAuditEvent({
      action: "users.admin.update",
      actorId: requestContext.actorId,
      actorRole: requestContext.actorRole,
      entity: "User",
      entityId: userId,
      requestId: requestContext.requestId,
      metadata: {
        updatedFields: Object.keys(updatePayload),
      },
    });

    return sanitizeUser(updated, profile);
  },

  async adminVerifyUserProfile(
    userId,
    { verificationStatus, verificationReason = "" },
    requestContext = {},
  ) {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw AppError.notFound("User not found.");
    }

    const existingProfile = await usersRepository.findProfileByUserId(userId);

    if (!existingProfile) {
      throw AppError.notFound("User profile not found.");
    }

    const updatedProfile = await usersRepository.updateProfileByUserId(userId, {
      verificationStatus,
      verificationReason,
      verifiedAt:
        verificationStatus === PROFILE_VERIFICATION_STATUSES.VERIFIED
          ? new Date()
          : null,
      verifiedBy:
        verificationStatus === PROFILE_VERIFICATION_STATUSES.VERIFIED
          ? requestContext.actorId
          : null,
    });

    const { user: synchronizedUser } = await syncUserStatusWithProfile(userId);

    logAuditEvent({
      action: "users.profile.verify",
      actorId: requestContext.actorId,
      actorRole: requestContext.actorRole,
      entity: "UserProfile",
      entityId: updatedProfile.id,
      requestId: requestContext.requestId,
      metadata: {
        verificationStatus,
      },
    });

    return sanitizeUser(synchronizedUser, updatedProfile);
  },

  async markEmailVerified(userId, requestContext = {}) {
    const updatedUser = await usersRepository.updateById(userId, {
      emailVerifiedAt: new Date(),
    });

    if (!updatedUser) {
      throw AppError.notFound("User not found.");
    }

    const { user, profile } = await syncUserStatusWithProfile(userId);

    logAuditEvent({
      action: "users.email.verify",
      actorId: userId,
      actorRole: user.role,
      entity: "User",
      entityId: userId,
      requestId: requestContext.requestId,
    });

    return sanitizeUser(user, profile);
  },

  async touchLastLogin(userId) {
    return usersRepository.updateById(userId, {
      lastLoginAt: new Date(),
    });
  },

  async updatePassword(userId, passwordHash) {
    const updated = await usersRepository.updateById(userId, {
      passwordHash,
      passwordChangedAt: new Date(),
      mustRotatePassword: false,
    });

    if (!updated) {
      throw AppError.notFound("User not found.");
    }

    return updated;
  },

  async ensureUserCanAuthenticate(user) {
    if (user.status === USER_STATUSES.SUSPENDED) {
      throw AppError.forbidden("User account is suspended.");
    }

    if (user.status === USER_STATUSES.INACTIVE) {
      throw AppError.forbidden("User account is inactive.");
    }

    return true;
  },

  async assertSubscriptionEligibility(userId) {
    const [user, profile] = await Promise.all([
      usersRepository.findById(userId),
      usersRepository.findProfileByUserId(userId),
    ]);

    if (!user) {
      throw AppError.notFound("User not found.");
    }

    assertUserIsSubscriptionEligible({ user, profile });

    return toProfileVerificationDto(user, profile);
  },
};
