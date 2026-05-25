import { describe, expect, it, vi } from "vitest";

import {
  appendProofDraftFiles,
  clearProofDraftFiles,
  removeProofDraftFile
} from "@/features/draws";

const createFile = (name: string, type = "image/png") =>
  new File(["proof"], name, { type });

describe("proof draft helpers", () => {
  it("adds files up to the configured limit", () => {
    const result = appendProofDraftFiles({
      current: [],
      files: [createFile("one.png"), createFile("two.png"), createFile("three.png")],
      maxProofFiles: 2,
      createPreviewUrl: (file) => `preview:${file.name}`
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.previewUrl).toBe("preview:one.png");
    expect(result[1]?.previewUrl).toBe("preview:two.png");
  });

  it("replaces an existing proof draft and revokes the previous preview", () => {
    const revokePreviewUrl = vi.fn();
    const result = appendProofDraftFiles({
      current: [
        {
          id: "draft-1",
          file: createFile("old.png"),
          previewUrl: "preview:old.png"
        }
      ],
      files: [createFile("new.png")],
      maxProofFiles: 2,
      replaceIndex: 0,
      createPreviewUrl: (file) => `preview:${file.name}`,
      revokePreviewUrl
    });

    expect(revokePreviewUrl).toHaveBeenCalledWith("preview:old.png");
    expect(result[0]?.file.name).toBe("new.png");
  });

  it("removes and clears proof drafts while revoking previews", () => {
    const revokePreviewUrl = vi.fn();
    const drafts = [
      {
        id: "draft-1",
        file: createFile("one.png"),
        previewUrl: "preview:one.png"
      },
      {
        id: "draft-2",
        file: createFile("two.png"),
        previewUrl: "preview:two.png"
      }
    ];

    const afterRemove = removeProofDraftFile({
      current: drafts,
      draftId: "draft-1",
      revokePreviewUrl
    });

    expect(afterRemove).toHaveLength(1);
    expect(revokePreviewUrl).toHaveBeenCalledWith("preview:one.png");

    const afterClear = clearProofDraftFiles({
      current: afterRemove,
      revokePreviewUrl
    });

    expect(afterClear).toEqual([]);
    expect(revokePreviewUrl).toHaveBeenCalledWith("preview:two.png");
  });
});
