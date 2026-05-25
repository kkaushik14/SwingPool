import type { CharityRecord } from "@/types";

export interface CharityProfileContent {
  category: string;
  shortDescription: string;
  longDescription: string;
  impactTags: string[];
  eventTags?: string[];
  visualLabel: string;
  visualClassName: string;
  highlightStats: Array<{
    label: string;
    value: string;
    description: string;
  }>;
  storySections: Array<{
    title: string;
    body: string;
  }>;
  supportPillars: string[];
}

const genericProfileContent: CharityProfileContent = {
  category: "Community Impact",
  shortDescription:
    "A mission-led charity partner featured on Swing Pool for future member allocations.",
  longDescription:
    "This charity is part of the platform’s impact network. Future payments can be routed here without changing any historical accounting already recorded by the backend.",
  impactTags: ["Community", "Future allocations"],
  eventTags: ["Featured partner"],
  visualLabel: "Impact partner",
  visualClassName:
    "bg-[radial-gradient(circle_at_top_left,rgba(198,160,84,0.45),transparent_35%),linear-gradient(135deg,rgba(20,92,74,0.95),rgba(35,36,38,0.95))]",
  highlightStats: [
    {
      label: "Allocation rule",
      value: "Future-only",
      description: "Changing your preference affects future payments, never historical ledgers."
    },
    {
      label: "Visibility",
      value: "Public catalog",
      description: "Charity detail remains accessible before signup so impact is visible up front."
    }
  ],
  storySections: [
    {
      title: "Why this cause is here",
      body:
        "Swing Pool is designed to foreground charitable impact, so each public charity profile explains where member contributions can flow before anyone even creates an account."
    },
    {
      title: "How support is recorded",
      body:
        "The backend keeps allocations, optional add-ons, and contribution records immutable after they are booked, preserving accounting clarity over time."
    }
  ],
  supportPillars: [
    "Mission-led allocation choice",
    "Future-payment routing only",
    "Immutable historical accounting"
  ]
};

export const charityProfileContentByCode: Record<string, CharityProfileContent> = {
  "education-first": {
    category: "Education",
    shortDescription:
      "Expanding learning access through after-school studios, mentorship, and digital inclusion.",
    longDescription:
      "Education First Collective supports students who need steadier learning environments beyond the classroom. The focus is not only on materials, but on continuity: mentorship, digital access, and safe places to keep momentum when formal systems are stretched thin.",
    impactTags: ["Learning access", "Mentorship", "Digital inclusion"],
    eventTags: ["Student scholarships", "After-school labs"],
    visualLabel: "Education access",
    visualClassName:
      "bg-[radial-gradient(circle_at_top_left,rgba(245,230,194,0.85),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(214,234,228,0.5),transparent_38%),linear-gradient(140deg,rgba(20,92,74,0.98),rgba(33,39,41,0.94))]",
    highlightStats: [
      {
        label: "Core theme",
        value: "Learning momentum",
        description: "Helping students stay connected to steady academic support."
      },
      {
        label: "Support style",
        value: "Human + digital",
        description: "Combining mentorship, devices, and practical local learning spaces."
      }
    ],
    storySections: [
      {
        title: "Why it matters",
        body:
          "Educational setbacks compound quickly when students lose access to devices, mentorship, or calm learning spaces. This partner focuses on restoring continuity rather than one-off relief."
      },
      {
        title: "What support can look like",
        body:
          "Support may help fund learning studios, connectivity, local mentors, or targeted academic reinforcement that gives students a stronger runway over time."
      }
    ],
    supportPillars: [
      "Student mentorship",
      "After-school learning support",
      "Digital access and continuity"
    ]
  },
  "care-bridge": {
    category: "Health",
    shortDescription:
      "Strengthening preventive care access, patient navigation, and follow-up for underserved families.",
    longDescription:
      "Care Bridge Network focuses on the parts of healthcare that often break down quietly: preventive screenings, patient follow-up, and navigation help that ensures a diagnosis or referral actually turns into care.",
    impactTags: ["Preventive care", "Patient navigation", "Clinic support"],
    eventTags: ["Community screening drives", "Follow-up care"],
    visualLabel: "Care access",
    visualClassName:
      "bg-[radial-gradient(circle_at_top_left,rgba(214,234,228,0.85),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(247,222,216,0.45),transparent_34%),linear-gradient(145deg,rgba(33,39,41,0.98),rgba(20,92,74,0.9))]",
    highlightStats: [
      {
        label: "Core theme",
        value: "Preventive access",
        description: "Improving the chances that families reach care before crises escalate."
      },
      {
        label: "Support style",
        value: "Navigation-first",
        description: "Helping people move from screening to follow-through."
      }
    ],
    storySections: [
      {
        title: "Why it matters",
        body:
          "Many health outcomes depend less on a single appointment and more on whether someone can navigate the system that follows. This partner supports that connective tissue."
      },
      {
        title: "What support can look like",
        body:
          "Funding may support clinic coordination, reminder systems, screening access, and the human follow-up needed to turn medical advice into practical care."
      }
    ],
    supportPillars: [
      "Preventive screenings",
      "Patient follow-up",
      "Access and navigation support"
    ]
  },
  "water-roots": {
    category: "Water & Resilience",
    shortDescription:
      "Supporting resilient water access, repair funds, and household-level water safety.",
    longDescription:
      "Water Roots Trust focuses on durability rather than ceremony. The aim is steady access, repair readiness, and practical household water safety so communities are less vulnerable when systems fail.",
    impactTags: ["Water safety", "Repair funds", "Household resilience"],
    eventTags: ["Water point restoration", "Local resilience kits"],
    visualLabel: "Water resilience",
    visualClassName:
      "bg-[radial-gradient(circle_at_top_left,rgba(131,174,224,0.48),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(219,186,114,0.38),transparent_32%),linear-gradient(140deg,rgba(20,92,74,0.95),rgba(18,21,22,0.96))]",
    highlightStats: [
      {
        label: "Core theme",
        value: "Reliable access",
        description: "Keeping water access practical, repairable, and community-centered."
      },
      {
        label: "Support style",
        value: "Resilience-focused",
        description: "Funding both access and the ability to sustain it."
      }
    ],
    storySections: [
      {
        title: "Why it matters",
        body:
          "Water systems matter most when they are unremarkably dependable. This charity focuses on the resilience, maintenance, and safety work that helps make that possible."
      },
      {
        title: "What support can look like",
        body:
          "Support may go toward repair funds, household safety interventions, and projects that make essential access more stable over time."
      }
    ],
    supportPillars: [
      "Water-point repair support",
      "Household water safety",
      "Local resilience funding"
    ]
  }
};

export const getCharityProfileContent = (charity: CharityRecord) =>
  charityProfileContentByCode[charity.code] || genericProfileContent;
