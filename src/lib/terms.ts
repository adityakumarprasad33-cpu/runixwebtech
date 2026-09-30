/**
 * Runix Legal & Terms Configuration
 * Central source of truth for terms and privacy versions and validation.
 */

export const CURRENT_TERMS_VERSION = "2026-03";
export const TERMS_LAST_UPDATED = "March 2026";
export const TERMS_ROUTE = "/terms";
export const PRIVACY_ROUTE = "/privacy";

export type SignupConsentMethod = "password_signup" | "google_signup";

export interface TermsConsentRecord {
  termsAccepted: boolean;
  termsVersion: string;
  termsAcceptedAt: any;
  signupMethod: SignupConsentMethod;
  ip?: string;
  userAgent?: string;
}

export function validateTermsConsent(consent: {
  termsAccepted?: boolean;
  termsVersion?: string;
}): { valid: boolean; error?: string } {
  if (!consent || consent.termsAccepted !== true) {
    return {
      valid: false,
      error: "You must agree to the Terms & Conditions and acknowledge the Privacy Policy to proceed.",
    };
  }

  if (consent.termsVersion !== CURRENT_TERMS_VERSION) {
    return {
      valid: false,
      error: "The terms version you accepted is outdated. Please refresh and review the updated terms.",
    };
  }

  return { valid: true };
}
