export type UserRole = 'patient' | 'coordinator' | 'clinician';

export interface ExtractedDataField {
  label: string;
  value: string;
  sourceDoc: string;
  sourcePage: number;
  highlightCoordinates?: { top: string; left: string; width: string; height: string };
  confidence: 'verified' | 'review_needed';
  clinicalNote?: string;
}

export interface JourneyStep {
  id: number;
  stepNumber: string;
  title: string;
  tagline: string;
  description: string;
  badgeText: string;
  roleContext: string;
  details: {
    heading: string;
    items: string[];
    governanceNote: string;
  };
}

export interface PermissionLevel {
  role: 'coordinator' | 'payer' | 'viewer';
  title: string;
  subtitle: string;
  description: string;
  canViewClinicalHistory: boolean;
  canViewBillingOnly: boolean;
  canManageAppointments: boolean;
  canReceiveDailyCheckins: boolean;
  patientConsentRequired: boolean;
}

export interface CapabilityItem {
  id: string;
  category: string;
  title: string;
  headline: string;
  description: string;
  currentAvailability: 'Currently Available (Dhaka & Diaspora)' | 'In Clinical Pilot' | 'Long-term Roadmap';
  availabilityBadgeColor: string;
  highlights: string[];
  governanceSafeguard: string;
}
