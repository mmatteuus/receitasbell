export type SocialProviderId = "google";

export interface SocialProviderConfig {
  provider: SocialProviderId;
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
  extraParams?: Record<string, string>;
}

export const SOCIAL_PROVIDERS: Record<SocialProviderId, SocialProviderConfig> = {
  google: {
    provider: "google",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scopes: ["openid", "email", "profile"],
    extraParams: {
      prompt: "select_account",
    },
  },
};
export const SOCIAL_PROVIDER_IDS = Object.keys(SOCIAL_PROVIDERS) as SocialProviderId[];
