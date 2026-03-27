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

export type FeaturedMode = "manual" | "latest" | "category" | "featuredFlag";

export type HomeSectionId =
  | "hero"
  | "trustBar"
  | "categories"
  | "featured"
  | "premium"
  | "recent"
  | "about"
  | "newsletter"
  | "gratin";

export interface HomeSettings {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaHref: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaHref: string;
  featuredSectionTitle: string;
  featuredSectionSubtitle: string;
  featuredMode: FeaturedMode;
  featuredRecipeIds: string[];
  featuredCategorySlug: string;
  featuredLimit: number;
  showCategoriesGrid: boolean;
  showFeaturedRecipes: boolean;
  showPremiumSection: boolean;
  showRecentRecipes: boolean;
  showNewsletter: boolean;
  showTrustBar: boolean;
  showAboutSection: boolean;
  showGratinSection: boolean;
  trustBarItems: string[];
  aboutHeadline: string;
  aboutText: string;
  aboutImageUrl: string;
  heroImageCaption: string;
  heroImageSubtitle: string;
  homeSectionsOrder: HomeSectionId[];
}


export interface PaymentSettings {
  payment_mode: "sandbox" | "production";
  webhooks_enabled: boolean;
  payment_topic_enabled: boolean;
}

export type SettingsMap = SiteSettings & HomeSettings & PaymentSettings;
