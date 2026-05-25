export interface ProofDraftFile {
  id: string;
  file: File;
  previewUrl: string;
}

const defaultCreatePreviewUrl = (file: File) => URL.createObjectURL(file);
const defaultRevokePreviewUrl = (previewUrl: string) => URL.revokeObjectURL(previewUrl);

export const appendProofDraftFiles = ({
  current,
  files,
  maxProofFiles,
  replaceIndex,
  createPreviewUrl = defaultCreatePreviewUrl,
  revokePreviewUrl = defaultRevokePreviewUrl
}: {
  current: ProofDraftFile[];
  files: File[];
  maxProofFiles: number;
  replaceIndex?: number | null;
  createPreviewUrl?: (file: File) => string;
  revokePreviewUrl?: (previewUrl: string) => void;
}) => {
  if (!files.length) {
    return current;
  }

  const next = [...current];
  const replaceTarget =
    typeof replaceIndex === "number" && replaceIndex >= 0 ? replaceIndex : null;

  if (replaceTarget !== null) {
    const replacement = files[0];

    if (!replacement) {
      return next;
    }

    if (next[replaceTarget]?.previewUrl) {
      revokePreviewUrl(next[replaceTarget].previewUrl);
    }

    next[replaceTarget] = {
      id: crypto.randomUUID(),
      file: replacement,
      previewUrl: createPreviewUrl(replacement)
    };

    return next.slice(0, maxProofFiles);
  }

  const remainingSlots = Math.max(maxProofFiles - next.length, 0);
  const additions = files.slice(0, remainingSlots).map((file) => ({
    id: crypto.randomUUID(),
    file,
    previewUrl: createPreviewUrl(file)
  }));

  return [...next, ...additions].slice(0, maxProofFiles);
};

export const removeProofDraftFile = ({
  current,
  draftId,
  revokePreviewUrl = defaultRevokePreviewUrl
}: {
  current: ProofDraftFile[];
  draftId: string;
  revokePreviewUrl?: (previewUrl: string) => void;
}) => {
  const removed = current.find((item) => item.id === draftId);

  if (removed?.previewUrl) {
    revokePreviewUrl(removed.previewUrl);
  }

  return current.filter((item) => item.id !== draftId);
};

export const clearProofDraftFiles = ({
  current,
  revokePreviewUrl = defaultRevokePreviewUrl
}: {
  current: ProofDraftFile[];
  revokePreviewUrl?: (previewUrl: string) => void;
}) => {
  current.forEach((item) => revokePreviewUrl(item.previewUrl));
  return [];
};
