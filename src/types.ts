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
  clicksCount?: number;
}

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'whatsapp'
  | 'telegram'
  | 'tiktok'
  | 'snapchat'
  | 'spotify'
  | 'email'
  | 'custom';

export interface SocialLink {
  id: string;
  platform: string;
  label?: string;
  url: string;
  icon?: string;
  active?: boolean;
  position?: number;
  clicksCount?: number;
}

export type BioBannerAspectRatio = 'original' | '1:1' | '3:2' | '16:9';

export interface BioBanner {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  imagePath?: string;
  destinationUrl?: string;
  aspectRatio: BioBannerAspectRatio;
  active?: boolean;
  position?: number;
  clicksCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BioPageConfig {
  bioPageId?: string;
  displayName: string;
  username: string;
  bio: string;
  avatarUrl: string;
  avatarPath?: string;
  whatsapp?: string;
  email?: string;
  country?: string;
  category?: string;
  socialLinks: SocialLink[];
  links: BioLink[];
  banners: BioBanner[];
  theme: 'Modern' | 'Classic';
  backgroundColor: string;
  primaryColor: string;
  buttonStyle: 'rounded' | 'square' | 'pill' | 'bordered';
  font: string;
  backgroundImageUrl?: string;
  backgroundImagePath?: string;
  backgroundOverlay?: string;
  isPublic?: boolean;
  viewsCount?: number;
  interactionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  qrColor?: string;
  qrLogoEnabled?: boolean;
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
