export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
}

export interface PaymentSettings {
  payment_mode: "sandbox" | "production";
  webhooks_enabled: boolean;
  payment_topic_enabled: boolean;
}

export type SettingsMap = SiteSettings & PaymentSettings;
