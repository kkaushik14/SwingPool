import { describe, expect, it, vi } from "vitest";

import {
  PROFILE_COMPLETION_STATUSES,
  PROFILE_VERIFICATION_STATUSES,
  USER_STATUSES,
} from "../src/enums/index.js";
import { DomainError } from "../src/errors/index.js";
import { usersRepository } from "../src/components/users/users.repository.js";
import { usersService } from "../src/components/users/users.service.js";

const buildUser = (overrides = {}) => ({
  id: "507f1f77bcf86cd799439011",
  email: "user@swingpool.test",
  displayName: "Test User",
  role: "user",
  status: USER_STATUSES.PENDING_VERIFICATION,
  emailVerifiedAt: null,
  subscriptionStatus: "free",
  ...overrides,
});

const buildProfile = (overrides = {}) => ({
  id: "507f1f77bcf86cd799439099",
  userId: "507f1f77bcf86cd799439011",
  completionStatus: PROFILE_COMPLETION_STATUSES.INCOMPLETE,
  verificationStatus: PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
  ...overrides,
});

describe("Users Service", () => {
  it("updates own profile and keeps verification pending until admin verification", async () => {
    const user = buildUser({
      emailVerifiedAt: new Date(),
      status: USER_STATUSES.PENDING_VERIFICATION,
    });

    const updatedProfile = buildProfile({
      completionStatus: PROFILE_COMPLETION_STATUSES.COMPLETED,
      verificationStatus: PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
      firstName: "Test",
      lastName: "User",
      phone: "9999999999",
      dateOfBirth: new Date("1995-01-01"),
      addressLine1: "123 Main Street",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      country: "India",
    });

    vi.spyOn(usersRepository, "findById").mockResolvedValue(user);
    vi.spyOn(usersRepository, "upsertProfileByUserId").mockResolvedValue(
      updatedProfile,
    );
    vi.spyOn(usersRepository, "findProfileByUserId").mockResolvedValue(
      updatedProfile,
    );
    vi.spyOn(usersRepository, "updateById").mockResolvedValue(user);

    const result = await usersService.updateOwnProfile(user.id, {
      firstName: "Test",
      lastName: "User",
      phone: "9999999999",
      dateOfBirth: new Date("1995-01-01"),
      addressLine1: "123 Main Street",
      city: "Pune",
      state: "Maharashtra",
      postalCode: "411001",
      country: "India",
    });

    expect(result.profile.completionStatus).toBe(
      PROFILE_COMPLETION_STATUSES.COMPLETED,
    );
    expect(result.profile.verificationStatus).toBe(
      PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
    );
    expect(result.status).toBe(USER_STATUSES.PENDING_VERIFICATION);
  });

  it("allows admin to verify profile and promote user status to verified", async () => {
    const user = buildUser({
      emailVerifiedAt: new Date(),
      status: USER_STATUSES.PENDING_VERIFICATION,
    });

    const pendingProfile = buildProfile({
      completionStatus: PROFILE_COMPLETION_STATUSES.COMPLETED,
      verificationStatus: PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
    });

    const verifiedProfile = {
      ...pendingProfile,
      verificationStatus: PROFILE_VERIFICATION_STATUSES.VERIFIED,
      verifiedAt: new Date(),
    };

    const verifiedUser = {
      ...user,
      status: USER_STATUSES.VERIFIED,
    };

    const findByIdSpy = vi.spyOn(usersRepository, "findById");
    findByIdSpy
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(verifiedUser);

    vi.spyOn(usersRepository, "findProfileByUserId")
      .mockResolvedValueOnce(pendingProfile)
      .mockResolvedValueOnce(verifiedProfile);

    vi.spyOn(usersRepository, "updateProfileByUserId").mockResolvedValue(
      verifiedProfile,
    );
    vi.spyOn(usersRepository, "updateById").mockResolvedValue(verifiedUser);

    const result = await usersService.adminVerifyUserProfile(
      user.id,
      {
        verificationStatus: PROFILE_VERIFICATION_STATUSES.VERIFIED,
      },
      {
        actorId: "507f1f77bcf86cd799439012",
        actorRole: "admin",
      },
    );

    expect(result.status).toBe(USER_STATUSES.VERIFIED);
    expect(result.profile.verificationStatus).toBe(
      PROFILE_VERIFICATION_STATUSES.VERIFIED,
    );
  });

  it("blocks subscription eligibility for non-verified profile state", async () => {
    const user = buildUser({
      emailVerifiedAt: null,
      status: USER_STATUSES.PENDING_VERIFICATION,
    });
    const profile = buildProfile({
      completionStatus: PROFILE_COMPLETION_STATUSES.COMPLETED,
      verificationStatus: PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
    });

    vi.spyOn(usersRepository, "findById").mockResolvedValue(user);
    vi.spyOn(usersRepository, "findProfileByUserId").mockResolvedValue(profile);

    await expect(
      usersService.assertSubscriptionEligibility(user.id),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("returns eligibility payload for verified users", async () => {
    const user = buildUser({
      status: USER_STATUSES.VERIFIED,
      emailVerifiedAt: new Date(),
    });

    const profile = buildProfile({
      completionStatus: PROFILE_COMPLETION_STATUSES.COMPLETED,
      verificationStatus: PROFILE_VERIFICATION_STATUSES.VERIFIED,
    });

    vi.spyOn(usersRepository, "findById").mockResolvedValue(user);
    vi.spyOn(usersRepository, "findProfileByUserId").mockResolvedValue(profile);

    const result = await usersService.assertSubscriptionEligibility(user.id);

    expect(result.eligibleForSubscription).toBe(true);
    expect(result.profileVerificationStatus).toBe(
      PROFILE_VERIFICATION_STATUSES.VERIFIED,
    );
  });
});
