/**
 * SIGEDIVO - White-Label Branding Configuration
 * Resolves organization identity, naming, and theme parameters from environment variables
 * with robust, community-focused defaults.
 */

export interface BrandingConfig {
  appName: string;
  orgName: string;
  orgShortName: string;
  orgType: 'CLUB' | 'ASSOCIATION' | 'ACADEMY' | 'LEAGUE';
  primaryColor: string;
  logoUrl: string;
  contactEmail: string;
  location: string;
}

export const branding: BrandingConfig = {
  appName: import.meta.env.VITE_APP_TITLE || 'SIGEDIVO',
  orgName: import.meta.env.VITE_ORG_NAME || 'Club Deportivo de Ultimate Frisbee',
  orgShortName: import.meta.env.VITE_ORG_SHORT_NAME || 'Club',
  orgType: (import.meta.env.VITE_ORG_TYPE as BrandingConfig['orgType']) || 'CLUB',
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '#059669',
  logoUrl: import.meta.env.VITE_LOGO_URL || '/logo.png',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || '',
  location: import.meta.env.VITE_ORG_LOCATION || 'Venezuela',
};

export default branding;
