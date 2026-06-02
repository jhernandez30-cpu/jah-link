/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type LinkStatus = 'Active' | 'Expired' | 'Draft';

export interface ShortLink {
  id: string;
  shortUrl: string;
  destination: string;
  clicks: number;
  status: LinkStatus;
  passwordProtected: boolean;
  expirationEnabled: boolean;
  createdAt: string;
  title?: string;
  domain?: string;
  slug?: string;
  active?: boolean;
  tags?: string[];
  qrCodeGenerated?: boolean;
  addedToBioPage?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  expirationDateValue?: string;
}

export interface BioLink {
  id: string;
  label: string;
  url: string;
  platform: string;
  active?: boolean;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface BioPageConfig {
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  whatsapp?: string;
  email?: string;
  socialLinks: SocialLink[];
  links: BioLink[];
  theme: 'Modern' | 'Classic';
  backgroundColor: string;
  primaryColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill' | 'bordered';
  font: string;
}

export interface QRCodeConfig {
  destinationLink: string;
  title: string;
  customSlug: string;
  foregroundColor: string;
  backgroundColor: string;
  pattern: 'Square' | 'Round' | 'Dot';
  logoOverlayUrl?: string;
}

export type DashboardTab =
  | 'dashboard'
  | 'links'
  | 'bio'
  | 'analytics'
  | 'qr'
  | 'settings';

export interface ClickActivityPoint {
  date: string;
  clicks: number;
}
