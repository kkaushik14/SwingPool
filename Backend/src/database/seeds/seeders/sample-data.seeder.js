import {
  PROFILE_COMPLETION_STATUSES,
  PROFILE_VERIFICATION_STATUSES,
  SUBSCRIPTION_STATUSES as USER_SUBSCRIPTION_STATUSES,
  USER_ROLES,
  USER_STATUSES,
} from "../../../enums/index.js";
import { DAY_IN_MS, DEFAULT_CURRENCY_CODE } from "../../../constants/index.js";
import { hashPassword } from "../../../utils/index.js";
import { CharityModel } from "../../../components/charities/charities.model.js";
import { CharitySelectionModel } from "../../../components/charities/charity-selection.model.js";
import { CHARITY_SELECTION_STATUSES } from "../../../components/charities/charities.enums.js";
import { ScoreModel } from "../../../components/scores/scores.model.js";
import {
  SCORES_STATUSES,
  SCORE_SOURCES,
} from "../../../components/scores/scores.enums.js";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUSES,
} from "../../../components/subscriptions/subscriptions.enums.js";
import { SubscriptionPlanModel } from "../../../components/subscriptions/subscription-plan.model.js";
import { SubscriptionModel } from "../../../components/subscriptions/subscriptions.model.js";
import { UserProfileModel } from "../../../components/users/users-profile.model.js";
import { UserModel } from "../../../components/users/users.model.js";

import { BaseSeeder } from "../base-seeder.js";
import { loadSampleSeedSource } from "../sample-seed-source.js";

const toDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const ensurePlanSeeded = async (planPayload) => {
  return SubscriptionPlanModel.findOneAndUpdate(
    { code: planPayload.code },
    {
      $setOnInsert: planPayload,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
};

const upsertUserWithProfile = async ({
  email,
  password,
  displayName,
  status,
  role = USER_ROLES.USER,
  emailVerifiedAt = null,
  subscriptionStatus = USER_SUBSCRIPTION_STATUSES.FREE,
  profile,
}) => {
  let user = await UserModel.findOne({ email });
  const passwordHash = await hashPassword(password);

  if (!user) {
    user = await UserModel.create({
      email,
      passwordHash,
      displayName,
      role,
      status,
      emailVerifiedAt,
      mustRotatePassword: false,
      subscriptionStatus,
    });
  } else {
    user = await UserModel.findOneAndUpdate(
      { _id: user.id },
      {
        displayName,
        status,
        role,
        passwordHash,
        emailVerifiedAt,
        subscriptionStatus,
      },
      {
        new: true,
      },
    );
  }

  await UserProfileModel.findOneAndUpdate(
    { userId: user.id },
    {
      userId: user.id,
      ...profile,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return user;
};

export class SampleDataSeeder extends BaseSeeder {
  constructor() {
    super("sample-data-seeder");
  }

  async run({ logger }) {
    const enabled = String(process.env.SAMPLE_SEED_ENABLED || "")
      .trim()
      .toLowerCase();

    if (!["1", "true", "yes"].includes(enabled)) {
      logger.warn(
        "Skipping sample data seed because SAMPLE_SEED_ENABLED is not enabled.",
      );
      return;
    }

    const sampleSource = await loadSampleSeedSource({ logger });

    if (!sampleSource) {
      return;
    }

    const { pendingUser: pendingSeed, verifiedUser: verifiedSeed } =
      sampleSource.data;

    const monthlyPlan = DEFAULT_SUBSCRIPTION_PLANS.find(
      (plan) => plan.code === "monthly",
    );
    const seededPlan = await ensurePlanSeeded(monthlyPlan);

    const charity = await CharityModel.findOne({}).sort({ createdAt: 1 });

    if (!charity) {
      logger.warn(
        "Sample data seeder requires at least one charity. Run default charities seed first.",
      );
      return;
    }

    const pendingUser = await upsertUserWithProfile({
      email: pendingSeed.email,
      password: pendingSeed.password,
      displayName: pendingSeed.displayName,
      status: USER_STATUSES.PENDING_VERIFICATION,
      emailVerifiedAt: null,
      subscriptionStatus: USER_SUBSCRIPTION_STATUSES.FREE,
      profile: {
        ...pendingSeed.profile,
        completionStatus: PROFILE_COMPLETION_STATUSES.INCOMPLETE,
        verificationStatus: PROFILE_VERIFICATION_STATUSES.PENDING_VERIFICATION,
      },
    });

    const verifiedUser = await upsertUserWithProfile({
      email: verifiedSeed.email,
      password: verifiedSeed.password,
      displayName: verifiedSeed.displayName,
      status: USER_STATUSES.VERIFIED,
      emailVerifiedAt: new Date(),
      subscriptionStatus: USER_SUBSCRIPTION_STATUSES.ACTIVE,
      profile: {
        ...verifiedSeed.profile,
        completionStatus: PROFILE_COMPLETION_STATUSES.COMPLETED,
        verificationStatus: PROFILE_VERIFICATION_STATUSES.VERIFIED,
        verifiedAt: new Date(),
      },
    });

    await CharitySelectionModel.findOneAndUpdate(
      {
        userId: verifiedUser.id,
        status: CHARITY_SELECTION_STATUSES.ACTIVE,
      },
      {
        userId: verifiedUser.id,
        charityId: charity.id,
        status: CHARITY_SELECTION_STATUSES.ACTIVE,
        effectiveFrom: new Date(),
        effectiveTo: null,
        reason: "Sample seed active selection",
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    const existingActiveSubscription = await SubscriptionModel.findOne({
      userId: verifiedUser.id,
      status: SUBSCRIPTION_STATUSES.ACTIVE,
    });

    if (!existingActiveSubscription) {
      const now = new Date();
      const endAt = new Date(
        now.getTime() + seededPlan.billingCycleDays * DAY_IN_MS,
      );

      await SubscriptionModel.create({
        userId: verifiedUser.id,
        planId: seededPlan.id,
        planCode: seededPlan.code,
        planNameSnapshot: seededPlan.name,
        planPriceInrSnapshot: seededPlan.priceInr,
        currency: DEFAULT_CURRENCY_CODE,
        status: SUBSCRIPTION_STATUSES.ACTIVE,
        startAt: now,
        endAt,
        nextBillingAt: endAt,
        gracePeriodEndsAt: null,
        canceledAt: null,
        charityId: charity.id,
        mandatoryCharityPercentageSnapshot: 10,
        charityContributionInr:
          verifiedSeed.subscription?.charityContributionInr ?? 17.9,
        latestCouponCode: "",
        lastPaymentIntentId:
          verifiedSeed.subscription?.paymentIntentId ||
          "sample_pi_verified_user_monthly",
        lastPaymentStatus:
          verifiedSeed.subscription?.paymentStatus || "succeeded",
        autoRenew: true,
        metadata: {
          seeded: true,
        },
      });
    }

    const qualifyingNumbers =
      verifiedSeed.subscription?.qualifyingNumbers || [3, 7, 12, 18, 25];

    for (let index = 0; index < qualifyingNumbers.length; index += 1) {
      const value = qualifyingNumbers[index];
      const playedDate = new Date();
      playedDate.setDate(playedDate.getDate() - (index + 1));
      const playedDateKey = toDateKey(playedDate);
      const submittedAt = new Date(Date.now() - index * 2 * 60 * 60 * 1000);
      const submissionLocalDateKey = toDateKey(submittedAt);

      const existing = await ScoreModel.findOne({
        userId: verifiedUser.id,
        contestNumber: value,
      });

      if (existing) {
        continue;
      }

      await ScoreModel.create({
        userId: verifiedUser.id,
        playedDate,
        playedDateKey,
        value,
        contestNumber: value,
        status: SCORES_STATUSES.ACTIVE,
        source: SCORE_SOURCES.USER,
        submittedAt,
        submissionLocalDateKey,
        isBackdated: false,
        confirmedAt: submittedAt,
        confirmedBy: null,
        metadata: {
          seeded: true,
        },
      });
    }

    logger.info(
      {
        seededUsers: [pendingUser.email, verifiedUser.email],
        sourcePath: sampleSource.sourcePath,
      },
      "Sample demo data seeded successfully.",
    );
  }
}
