import type { Locale } from "@/lib/i18n";

export type FooterSection =
  | "platform"
  | "talent"
  | "publisher"
  | "legal"
  | "social";

export type FooterSettings = {
  id: number;
  description_ar: string | null;
  description_en: string | null;
  email: string | null;
  phone: string | null;
  address_ar: string | null;
  address_en: string | null;
  copyright_ar: string | null;
  copyright_en: string | null;
  show_contact_info: boolean;
  show_social_links: boolean;
  created_at?: string;
  updated_at?: string;
};

export type FooterLink = {
  id: number;
  section: FooterSection;
  label_ar: string;
  label_en: string;
  href: string;
  sort_order: number;
  is_active: boolean;
  open_in_new_tab: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PublicFooterLink = {
  id: number;
  section: FooterSection;
  label: string;
  href: string;
  sortOrder: number;
  openInNewTab: boolean;
};

export type PublicFooterData = {
  description: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  copyright: string;
  showContactInfo: boolean;
  showSocialLinks: boolean;
  links: PublicFooterLink[];
};

export type FooterCMSLocale = Locale;