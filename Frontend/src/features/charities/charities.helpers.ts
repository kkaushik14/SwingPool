import { fallbackPublicCharities } from "@/features/marketing";
import type {
  CharityDonationRecord,
  CharityRecord,
  CharitySelectionRecord
} from "@/types";

import {
  type CharityProfileContent,
  getCharityProfileContent
} from "./charity-content";

export interface EnrichedCharityRecord extends CharityRecord {
  profile: CharityProfileContent;
  category: string;
  searchIndex: string;
  impactTags: string[];
  eventTags: string[];
}

const normalize = (value?: string | null) => String(value || "").trim().toLowerCase();

const categoryFromMetadata = (metadata?: Record<string, unknown>) =>
  typeof metadata?.category === "string" ? metadata.category : undefined;

const tagsFromMetadata = (metadata?: Record<string, unknown>, key = "tags") => {
  const value = metadata?.[key];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
};

export const mergePublicCharities = (charities: CharityRecord[] = []) => {
  if (!charities.length) {
    return fallbackPublicCharities;
  }

  return charities;
};

export const enrichCharityCatalog = (charities: CharityRecord[] = []) =>
  mergePublicCharities(charities).map((charity) => {
    const profile = getCharityProfileContent(charity);
    const category = categoryFromMetadata(charity.metadata) || profile.category;
    const impactTags = [
      ...profile.impactTags,
      ...tagsFromMetadata(charity.metadata, "impactTags")
    ];
    const eventTags = [
      ...(profile.eventTags || []),
      ...tagsFromMetadata(charity.metadata, "eventTags")
    ];
    const searchIndex = [
      charity.name,
      charity.code,
      charity.mission,
      category,
      ...impactTags,
      ...eventTags
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return {
      ...charity,
      profile,
      category,
      impactTags,
      eventTags,
      searchIndex
    } satisfies EnrichedCharityRecord;
  });

export const getCharityCategoryOptions = (charities: EnrichedCharityRecord[] = []) => [
  "All",
  ...new Set(charities.map((charity) => charity.category))
];

export const filterCharities = ({
  charities,
  searchTerm,
  activeCategory
}: {
  charities: EnrichedCharityRecord[];
  searchTerm: string;
  activeCategory: string;
}) => {
  const normalizedSearch = normalize(searchTerm);
  const normalizedCategory = normalize(activeCategory);

  return charities.filter((charity) => {
    const matchesCategory =
      normalizedCategory === "all" || normalize(charity.category) === normalizedCategory;
    const matchesSearch =
      !normalizedSearch || charity.searchIndex.includes(normalizedSearch);

    return matchesCategory && matchesSearch;
  });
};

export const findCharityById = (
  charities: EnrichedCharityRecord[] = [],
  charityId?: string
) => charities.find((charity) => charity.id === charityId) || null;

export const getImpactSummary = ({
  charities,
  selection,
  donations
}: {
  charities: EnrichedCharityRecord[];
  selection?: CharitySelectionRecord | null;
  donations?: CharityDonationRecord[];
}) => {
  const donationRecords = donations || [];
  const succeededDonations = donationRecords.filter(
    (donation) => donation.status === "succeeded"
  );
  const totalDonatedMinor = succeededDonations.reduce(
    (total, donation) => total + donation.amountMinor,
    0
  );

  const supportedCharityIds = new Set<string>();

  if (selection?.charityId) {
    supportedCharityIds.add(selection.charityId);
  }

  for (const donation of succeededDonations) {
    if (donation.charityId) {
      supportedCharityIds.add(donation.charityId);
    }
  }

  const selectedCharities = charities.filter((charity) =>
    supportedCharityIds.has(charity.id)
  );

  return {
    totalDonatedMinor,
    selectedCharities,
    selectedCharityCount: selectedCharities.length,
    contributionCount: donationRecords.length,
    succeededContributionCount: succeededDonations.length
  };
};

export const sortDonationsByRecent = (donations: CharityDonationRecord[] = []) =>
  [...donations].sort(
    (left, right) =>
      new Date(right.finalizedAt || right.createdAt || 0).getTime() -
      new Date(left.finalizedAt || left.createdAt || 0).getTime()
  );
