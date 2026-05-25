import { describe, expect, it } from "vitest";

import {
  enrichCharityCatalog,
  filterCharities,
  getCharityCategoryOptions,
  getImpactSummary,
  sortDonationsByRecent
} from "@/features/charities";
import type { CharityDonationRecord, CharityRecord } from "@/types";

const charities: CharityRecord[] = [
  {
    id: "charity-education",
    code: "education-first",
    name: "Education First Collective",
    mission: "Learning access"
  },
  {
    id: "charity-health",
    code: "care-bridge",
    name: "Care Bridge Network",
    mission: "Preventive care",
    metadata: {
      category: "Health"
    }
  }
];

const donations: CharityDonationRecord[] = [
  {
    id: "d-1",
    userId: "user-1",
    charityId: "charity-education",
    paymentId: "payment-1",
    paymentIntentId: "pi_1",
    source: "subscription_addon",
    currency: "INR",
    amountMinor: 1200,
    amountMajor: "₹12.00",
    status: "succeeded",
    createdAt: "2026-05-03T00:00:00.000Z"
  },
  {
    id: "d-2",
    userId: "user-1",
    charityId: "charity-health",
    paymentId: "payment-2",
    paymentIntentId: "pi_2",
    source: "independent",
    currency: "INR",
    amountMinor: 800,
    amountMajor: "₹8.00",
    status: "processing",
    createdAt: "2026-05-05T00:00:00.000Z"
  }
];

describe("charities helpers", () => {
  it("enriches the catalog with profile content and category options", () => {
    const catalog = enrichCharityCatalog(charities);

    expect(catalog[0]?.category).toBe("Education");
    expect(catalog[0]?.impactTags.length).toBeGreaterThan(0);
    expect(getCharityCategoryOptions(catalog)).toContain("Health");
  });

  it("filters charities across category and search index", () => {
    const catalog = enrichCharityCatalog(charities);

    const filtered = filterCharities({
      charities: catalog,
      searchTerm: "preventive",
      activeCategory: "Health"
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.name).toBe("Care Bridge Network");
  });

  it("builds impact summaries from succeeded donations and current selection", () => {
    const catalog = enrichCharityCatalog(charities);

    const summary = getImpactSummary({
      charities: catalog,
      selection: {
        charityId: "charity-health"
      },
      donations
    });

    expect(summary.totalDonatedMinor).toBe(1200);
    expect(summary.selectedCharityCount).toBe(2);
  });

  it("sorts contribution history by most recent date", () => {
    const sorted = sortDonationsByRecent(donations);

    expect(sorted.map((donation) => donation.id)).toEqual(["d-2", "d-1"]);
  });
});
