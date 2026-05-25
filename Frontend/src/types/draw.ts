export interface DrawPrizeDistribution {
  match3Percentage?: number;
  match4Percentage?: number;
  match5Percentage?: number;
}

export interface DrawConfigRecord {
  id: string;
  configKey?: string;
  mode: string;
  numberRangeMin: number;
  numberRangeMax: number;
  numbersPerDraw: number;
  eligibilityCutoffDaysBeforeMonthEnd: number;
  proofDeadlineDays: number;
  maxProofFiles: number;
  prizeDistribution?: DrawPrizeDistribution;
  algorithmOptions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DrawRecord {
  id: string;
  drawMonthKey: string;
  month: number;
  year: number;
  mode: string;
  drawAt?: string | null;
  eligibilityCutoffAt?: string | null;
  prizePoolSnapshotAt?: string | null;
  numberRangeMin: number;
  numberRangeMax: number;
  numbersPerDraw: number;
  status: string;
  entriesGeneratedAt?: string | null;
  publishedAt?: string | null;
  publishedResultId?: string | null;
  prizePoolId?: string | null;
  totalEligibleUsers?: number;
  totalEntries?: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DrawEntryRecord {
  id: string;
  drawId: string;
  userId: string;
  subscriptionId?: string | null;
  source: string;
  contestNumbers: number[];
  qualifyingScoreIds?: string[];
  generatedAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface DrawPublishedResultRecord {
  id: string;
  drawId: string;
  mode: string;
  winningNumbers: number[];
  status: string;
  publishedBy?: string | null;
  publishedAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface DrawPrizePoolRecord {
  id: string;
  drawId: string;
  currency: string;
  snapshotAt?: string | null;
  subscriptionPrizePoolMinor: number;
  manualJackpotAddedMinor: number;
  jackpotCarryInMinor: number;
  bucket3Minor: number;
  bucket4Minor: number;
  bucket5Minor: number;
  winners3Count: number;
  winners4Count: number;
  winners5Count: number;
  match3PaidMinor: number;
  match4PaidMinor: number;
  match5PaidMinor: number;
  unused3ToRevenueMinor: number;
  unused4ToRevenueMinor: number;
  companyRevenueMinor: number;
  jackpotCarryOutMinor: number;
  finalizedAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface JackpotLedgerRecord {
  id: string;
  idempotencyKey: string;
  drawId?: string | null;
  appliedDrawId?: string | null;
  entryType: string;
  direction: string;
  amountMinor: number;
  currency: string;
  occurredAt?: string | null;
  notes?: string;
  createdBy?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}
