import { describe, expect, it } from "vitest";

import {
  getPublicCatalogNotice,
  isPublicCatalogPreview,
  resolvePublicCatalogData
} from "@/features/marketing";
import { ApiRequestError } from "@/types";

describe("public catalog preview helpers", () => {
  it("keeps live catalog data when the backend responds with items", () => {
    const result = resolvePublicCatalogData({
      items: [{ id: "plan-yearly" }],
      fallbackItems: [{ id: "plan-fallback" }]
    });

    expect(result.source).toBe("live");
    expect(result.items).toEqual([{ id: "plan-yearly" }]);
    expect(isPublicCatalogPreview(result)).toBe(false);
    expect(getPublicCatalogNotice(result)).toBeNull();
  });

  it("falls back cleanly and exposes a preview notice when live data fails", () => {
    const result = resolvePublicCatalogData({
      fallbackItems: [{ id: "charity-preview" }],
      error: new ApiRequestError({
        message: "Catalog unavailable",
        statusCode: 500
      })
    });

    expect(result.source).toBe("fallback");
    expect(result.items).toEqual([{ id: "charity-preview" }]);
    expect(isPublicCatalogPreview(result)).toBe(true);
    expect(getPublicCatalogNotice(result)).toContain("Showing preview content");
    expect(getPublicCatalogNotice(result)).toContain("Catalog unavailable");
  });
});
