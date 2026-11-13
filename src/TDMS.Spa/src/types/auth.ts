export interface UserProfile {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  claims: Record<string, string>;
  accountSubType?: string;
  tutorVerificationStatus?: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  claims: Record<string, string>;
  accountSubType?: string;
  tutorVerificationStatus?: string;
}
