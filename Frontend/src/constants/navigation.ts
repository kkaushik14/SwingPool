import type { LucideIcon } from "lucide-react";
import {
  BadgeIndianRupee,
  Bell,
  BookOpenText,
  CircleGauge,
  ClipboardList,
  Crosshair,
  FileClock,
  Gift,
  House,
  HeartHandshake,
  HelpCircle,
  Landmark,
  Mail,
  ReceiptText,
  Settings2,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  UsersRound,
  WalletCards
} from "lucide-react";

import { routePaths } from "@/routes/paths";

export interface NavigationItem {
  label: string;
  to: string;
  icon: LucideIcon;
  description: string;
  section?: string;
}

export interface NavigationGroup {
  title: string;
  items: NavigationItem[];
}

export const publicNavigation: NavigationItem[] = [
  {
    label: "How It Works",
    to: routePaths.howItWorks,
    icon: BookOpenText,
    description: "The simple member flow from signup to monthly draw entry.",
    section: "Discover"
  },
  {
    label: "Pricing",
    to: routePaths.pricing,
    icon: BadgeIndianRupee,
    description: "Current plans, value rhythm, and activation rules.",
    section: "Discover"
  },
  {
    label: "Charities",
    to: routePaths.publicCharities,
    icon: HeartHandshake,
    description: "How causes are featured and how impact is created.",
    section: "Discover"
  },
  {
    label: "Winners",
    to: routePaths.publicWinners,
    icon: Trophy,
    description: "How matching, proof, and payout flow through the platform.",
    section: "Discover"
  },
  {
    label: "FAQ",
    to: routePaths.faq,
    icon: HelpCircle,
    description: "Answers to the rules, flows, and member questions that matter most.",
    section: "Discover"
  }
];

export const publicAccessNavigation: NavigationItem[] = [
  {
    label: "Login",
    to: routePaths.login,
    icon: Shield,
    description: "Secure access for returning members and admins.",
    section: "Access"
  },
  {
    label: "Signup",
    to: routePaths.signup,
    icon: Sparkles,
    description: "Start the verified membership journey and join the draw.",
    section: "Access"
  },
  {
    label: "Contact",
    to: routePaths.contact,
    icon: Mail,
    description: "Support, billing, impact, and partnership contact channels.",
    section: "Support"
  }
];

export const publicFooterNavigation: NavigationGroup[] = [
  {
    title: "Explore",
    items: [
      {
        label: "How It Works",
        to: routePaths.howItWorks,
        icon: BookOpenText,
        description: "Learn the member journey."
      },
      {
        label: "Pricing",
        to: routePaths.pricing,
        icon: BadgeIndianRupee,
        description: "See current plans."
      },
      {
        label: "Charities",
        to: routePaths.publicCharities,
        icon: HeartHandshake,
        description: "See featured causes."
      },
      {
        label: "Winners",
        to: routePaths.publicWinners,
        icon: Trophy,
        description: "See the winner lifecycle."
      }
    ]
  },
  {
    title: "Support",
    items: [
      {
        label: "FAQ",
        to: routePaths.faq,
        icon: HelpCircle,
        description: "Find common answers."
      },
      {
        label: "Contact",
        to: routePaths.contact,
        icon: Mail,
        description: "Reach the team."
      },
      {
        label: "Login",
        to: routePaths.login,
        icon: Shield,
        description: "Sign into your account."
      },
      {
        label: "Signup",
        to: routePaths.signup,
        icon: Sparkles,
        description: "Create an account."
      }
    ]
  },
  {
    title: "Legal",
    items: [
      {
        label: "Terms",
        to: routePaths.terms,
        icon: ShieldCheck,
        description: "Review platform terms."
      },
      {
        label: "Privacy",
        to: routePaths.privacy,
        icon: Shield,
        description: "Review privacy commitments."
      }
    ]
  }
];

export const appNavigation: NavigationItem[] = [
  {
    label: "Overview",
    to: routePaths.app,
    icon: House,
    description: "Dashboard-first readiness, status, and recent account activity",
    section: "Account"
  },
  {
    label: "Profile",
    to: routePaths.profile,
    icon: UserRound,
    description: "Identity, contact details, and verification readiness",
    section: "Account"
  },
  {
    label: "Billing & Subscription",
    to: routePaths.subscriptions,
    icon: WalletCards,
    description: "Current plan, renewal state, upgrade options, and payment history",
    section: "Membership"
  },
  {
    label: "Scores",
    to: routePaths.scores,
    icon: CircleGauge,
    description: "Submission history, qualifying numbers, and competition readiness",
    section: "Play"
  },
  {
    label: "Charities",
    to: routePaths.charities,
    icon: HeartHandshake,
    description: "Selection history and donation flows",
    section: "Impact"
  },
  {
    label: "Draws & Winnings",
    to: routePaths.draws,
    icon: Trophy,
    description: "Participation readiness, draw results, winnings, and proof status",
    section: "Play"
  },
  {
    label: "Notifications",
    to: routePaths.notifications,
    icon: Bell,
    description: "Operational messages, reminders, and payment-state updates",
    section: "Account"
  },
  {
    label: "Settings",
    to: routePaths.settings,
    icon: Settings2,
    description: "Theme, session, support, and account safety preferences",
    section: "Account"
  },
  {
    label: "Experience Kit",
    to: routePaths.experienceKit,
    icon: Gift,
    description: "Design system reference surfaces",
    section: "Reference"
  }
];

export const adminNavigation: NavigationItem[] = [
  {
    label: "Admin Overview",
    to: routePaths.admin,
    icon: Shield,
    description: "Cross-domain reporting and controls",
    section: "Control"
  },
  {
    label: "Users & Verification",
    to: routePaths.adminUsers,
    icon: UsersRound,
    description: "Member lifecycle, verification queues, and role-safe operations",
    section: "Members"
  },
  {
    label: "Revenue & Billing",
    to: routePaths.adminRevenue,
    icon: BadgeIndianRupee,
    description: "Plans, subscriptions, Stripe-linked outcomes, and financial review",
    section: "Finance"
  },
  {
    label: "Charities & Payouts",
    to: routePaths.adminCharities,
    icon: Landmark,
    description: "Impact allocation, payout tracking, and historical accounting",
    section: "Impact"
  },
  {
    label: "Draw Operations",
    to: routePaths.adminDraws,
    icon: Crosshair,
    description: "Monthly entries, prize pools, winner proof flow, and publication safety",
    section: "Operations"
  },
  {
    label: "Audit & Reports",
    to: routePaths.adminAudit,
    icon: ClipboardList,
    description: "Request-aware audit trails, summaries, and manual adjustment safeguards",
    section: "Operations"
  },
  {
    label: "Experience Kit",
    to: routePaths.adminExperienceKit,
    icon: Gift,
    description: "Reference UI patterns for future admin surfaces",
    section: "Reference"
  }
];

export const adminQuickActions: NavigationItem[] = [
  {
    label: "Recent reports",
    to: routePaths.adminAudit,
    icon: ReceiptText,
    description: "Jump into the reporting and audit surface.",
    section: "Quick actions"
  },
  {
    label: "Pending reviews",
    to: routePaths.adminUsers,
    icon: FileClock,
    description: "Focus on verification queues and proof workflows.",
    section: "Quick actions"
  }
];
