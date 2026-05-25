export interface UserProfile {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  handicapIndex?: number;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  completionStatus?: string;
  verificationStatus?: string;
  verificationReason?: string;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  role: "user" | "admin";
  status: string;
  emailVerifiedAt?: string | null;
  mustRotatePassword?: boolean;
  subscriptionStatus?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  profile?: UserProfile | null;
}

export interface ProfileVerificationState {
  userId: string;
  userStatus: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  profileVerificationStatus: string;
  eligibleForSubscription: boolean;
}
