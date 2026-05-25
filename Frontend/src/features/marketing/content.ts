import type { CharityRecord, SubscriptionPlan } from "@/types";

export const fallbackPublicPlans: SubscriptionPlan[] = [
  {
    id: "monthly",
    code: "monthly",
    name: "Monthly",
    description: "A gentle monthly rhythm for staying active, verified, and draw-ready.",
    priceInr: 179,
    billingCycleDays: 30,
    hierarchyLevel: 1,
    currency: "INR"
  },
  {
    id: "quarterly",
    code: "quarterly",
    name: "Quarterly",
    description: "The smoothest balance of value, continuity, and prize anticipation.",
    priceInr: 499,
    billingCycleDays: 90,
    hierarchyLevel: 2,
    currency: "INR",
    isDefault: true
  },
  {
    id: "yearly",
    code: "yearly",
    name: "Yearly",
    description: "The deepest commitment tier for long-run members who want fewer billing moments.",
    priceInr: 1999,
    billingCycleDays: 365,
    hierarchyLevel: 3,
    currency: "INR"
  }
];

export const fallbackPublicCharities: CharityRecord[] = [
  {
    id: "charity-education",
    code: "education-first",
    name: "Education First Collective",
    mission:
      "Funding after-school learning studios, digital access, and mentorship for students who need stronger support systems.",
    isFeatured: true,
    totalRaisedMajor: "Impact updates available after launch",
    currency: "INR"
  },
  {
    id: "charity-health",
    code: "care-bridge",
    name: "Care Bridge Network",
    mission:
      "Helping community clinics cover preventive screenings, care navigation, and patient follow-up for underserved families.",
    currency: "INR"
  },
  {
    id: "charity-water",
    code: "water-roots",
    name: "Water Roots Trust",
    mission:
      "Supporting resilient water access projects, repair funds, and household-level water safety initiatives.",
    currency: "INR"
  }
];

export const publicTrustStats = [
  {
    value: "1",
    label: "automatic monthly entry",
    description:
      "Each eligible active subscriber gets one entry per month, no matter which paid plan they choose."
  },
  {
    value: "35%",
    label: "prize pool contribution",
    description:
      "The current business rule sends 35% of the post-fee subscription base into the prize pool."
  },
  {
    value: "10%",
    label: "default charity share",
    description:
      "The current default mandatory charity percentage is 10% of the post-fee subscription base."
  },
  {
    value: "7 days",
    label: "renewal grace window",
    description:
      "If renewal fails, the platform tracks a seven-day grace period before the subscription fully lapses."
  }
] as const;

export const howItWorksSteps = [
  {
    title: "Create your account",
    description:
      "Start with secure sign-up, confirm your email, and complete the profile details that the backend requires before paid activation."
  },
  {
    title: "Choose a plan and charity",
    description:
      "Pick the membership rhythm that fits you, then choose the charity that should receive your mandatory impact share."
  },
  {
    title: "Keep five qualifying scores current",
    description:
      "Your latest five qualifying submissions become your contest numbers, as long as they are valid, distinct, and not backdated."
  },
  {
    title: "Enter the monthly draw automatically",
    description:
      "When your subscription stays active and your score set stays eligible, you’re in the draw without extra forms or extra steps."
  }
] as const;

export const prizeExcitementPoints = [
  "Monthly, quarterly, and yearly members are treated equally for monthly draw entry.",
  "The five-match jackpot rolls over without a cap whenever it is unclaimed.",
  "Draw publication is immutable once results go live.",
  "Winner proof must be submitted within 23 days of publication."
] as const;

export const testimonials = [
  {
    quote:
      "It feels more intentional than a typical gaming or sports app. I understand where my money goes, what qualifies me, and what happens next.",
    name: "Nikita R.",
    role: "Early member preview"
  },
  {
    quote:
      "The charity layer is what made me stay. The reward side is exciting, but the platform still feels grounded and transparent.",
    name: "Arjun P.",
    role: "Quarterly subscriber"
  },
  {
    quote:
      "I like that verification and payment rules are explicit. Nothing feels hidden behind glossy marketing language.",
    name: "Meera S.",
    role: "Profile-complete member"
  }
] as const;

export const winnerJourneyPreview = [
  {
    title: "Proof submitted smoothly",
    description:
      "Members who match a published result upload proof inside the winner flow, where review and payout states stay visible."
  },
  {
    title: "Payout review stays traceable",
    description:
      "Winner status moves from pending verification to approved, payout pending, and finally paid when the backend confirms each step."
  },
  {
    title: "Jackpot tension builds over time",
    description:
      "If no one lands the five-match result, the jackpot rolls over and the next draw carries that energy forward."
  }
] as const;

export const publicFaqItems = [
  {
    question: "What does a member actually do here?",
    answer:
      "Members create an account, complete verification, choose a subscription plan and charity, keep five qualifying scores current, and automatically participate in the monthly draw whenever they remain eligible."
  },
  {
    question: "Do I enter the draw manually every month?",
    answer:
      "No. Eligible active subscribers are entered automatically once the backend confirms they have an active subscription and a valid set of five qualifying scores."
  },
  {
    question: "Can I pay and become active before my profile is verified?",
    answer:
      "No. The backend rules require email verification and full profile verification before the subscription can truly activate."
  },
  {
    question: "How is charity impact created?",
    answer:
      "Gateway fees are deducted first, then the configured mandatory charity percentage is applied to the post-fee subscription base. Optional add-on donations pass through fully to charity."
  },
  {
    question: "How many scores count toward the draw?",
    answer:
      "Only the latest five qualifying scores count. Backdated scores are stored historically, but they do not count toward competition eligibility."
  },
  {
    question: "Can I change my charity later?",
    answer:
      "Yes, but only for future payments. Historical allocations remain unchanged for accounting integrity."
  },
  {
    question: "What happens if my renewal fails?",
    answer:
      "The backend tracks a grace-period state for failed renewal and can warn the user before expiry. If the subscription lapses by draw day, that member is not eligible."
  },
  {
    question: "What happens if I win?",
    answer:
      "Published results are immutable. If you match a winning result, you move through a proof submission and payout workflow with clear statuses and deadlines."
  }
] as const;

export const pricingHighlights = [
  "All paid plans are equal for monthly draw entry.",
  "Plan values are admin-configurable and future coupon-ready.",
  "Cancellation is immediate under the current backend rules.",
  "Upgrades are supported upward only, with proration handled by the backend."
] as const;

export const charitySplitHighlights = [
  "Gateway fee is deducted first from the subscription base.",
  "35% of the post-fee subscription base feeds the prize pool.",
  "10% is the current default mandatory charity share of the post-fee subscription base.",
  "Optional charity add-ons are passed through fully to charity.",
  "The remainder becomes platform revenue."
] as const;

export const contactChannels = [
  {
    title: "General support",
    value: "support@swingpool.app",
    description: "Use this inbox for onboarding help, eligibility questions, and membership guidance."
  },
  {
    title: "Finance and payouts",
    value: "payments@swingpool.app",
    description: "Use this inbox for payment issues, billing review, and winner payout questions."
  },
  {
    title: "Charity and partnerships",
    value: "impact@swingpool.app",
    description: "Use this inbox for charity partnerships, reporting questions, or impact conversations."
  }
] as const;

export const termsSections = [
  {
    title: "Eligibility and account integrity",
    content:
      "Members are responsible for maintaining accurate account, verification, and profile information. The platform may pause or restrict access when fraud, misrepresentation, or security issues are detected."
  },
  {
    title: "Subscription and billing",
    content:
      "Paid access, renewal state, grace periods, and cancellation outcomes are governed by backend-confirmed billing records. Client-side redirects or success screens do not override payment confirmation rules."
  },
  {
    title: "Draw participation and results",
    content:
      "Draw participation depends on active eligibility at the relevant cutoff and on draw day. Published results are immutable. Winner proof and payout handling follow the defined submission and review workflow."
  },
  {
    title: "Charity and historical accounting",
    content:
      "Charity selections apply to future payments only. Historical allocations, ledgers, and payout records remain immutable after they are booked."
  }
] as const;

export const privacySections = [
  {
    title: "What we collect",
    content:
      "We collect account details, profile verification information, payment-linked records, score submissions, notification events, and operational audit metadata required to run the platform safely."
  },
  {
    title: "Why we collect it",
    content:
      "Data supports account security, subscription lifecycle management, score eligibility, charity accounting, draw operations, winner processing, and legally necessary record-keeping."
  },
  {
    title: "How operational logs are used",
    content:
      "The backend stores request-linked audit information for sensitive actions so that admin operations, payment handling, and manual overrides can be traced and reviewed."
  },
  {
    title: "Retention and historical integrity",
    content:
      "Certain records such as payment ledgers, charity allocations, score history, and winner workflows may be retained to preserve financial, accounting, and operational integrity."
  }
] as const;
