import { describe, expect, test } from "vitest";
import { mapTypedSettings } from "../src/server/settings/repo";

describe("settings repo mapping", () => {
  test("parseia arrays, modo destacado e limites persistidos como JSON", () => {
    const settings = mapTypedSettings({
      siteName: "Receitas Bell",
      siteDescription: "Desc",
      logoUrl: "",
      primaryColor: "#111111",
      secondaryColor: "#ffffff",
      accentColor: "#ff9900",
      headingFont: "DM Serif Display",
      bodyFont: "DM Sans",
      payment_mode: "production",
      webhooks_enabled: "true",
      payment_topic_enabled: "false",
      heroBadge: "Teste",
      heroTitle: "Titulo",
      heroSubtitle: "Subtitulo",
      heroImageUrl: "https://example.com/hero.jpg",
      heroPrimaryCtaLabel: "Explorar",
      heroPrimaryCtaHref: "/buscar",
      heroSecondaryCtaLabel: "Premium",
      heroSecondaryCtaHref: "/premium",
      featuredSectionTitle: "Destaques",
      featuredSectionSubtitle: "Editoriais",
      featuredMode: "category",
      featuredRecipeIds: JSON.stringify(["r1", "r2"]),
      featuredCategorySlug: "doces",
      featuredLimit: "9",
      showCategoriesGrid: "false",
      showFeaturedRecipes: "true",
      showPremiumSection: "false",
      showGratinSection: "false",
      showRecentRecipes: "true",
      showNewsletter: "false",
      showTrustBar: "true",
      showAboutSection: "false",
      trustBarItems: JSON.stringify(["Item 1", "Item 2"]),
      aboutHeadline: "Sobre",
      aboutText: "Texto",
      aboutImageUrl: "https://example.com/about.jpg",
      heroImageCaption: "Legenda",
      heroImageSubtitle: "Sub",
      homeSectionsOrder: JSON.stringify(["hero", "featured", "newsletter"]),
    });

    expect(settings.payment_mode).toBe("production");
    expect(settings.payment_topic_enabled).toBe(false);
    expect(settings.featuredMode).toBe("category");
    expect(settings.featuredRecipeIds).toEqual(["r1", "r2"]);
    expect(settings.featuredLimit).toBe(9);
    expect(settings.showCategoriesGrid).toBe(false);
    expect(settings.trustBarItems).toEqual(["Item 1", "Item 2"]);
    expect(settings.homeSectionsOrder).toEqual(["hero", "featured", "newsletter"]);
  });

  test("aceita fallback legado em CSV e valores invalidos sem quebrar", () => {
    const settings = mapTypedSettings({
      featuredMode: "invalido",
      featuredRecipeIds: "r1, r2",
      featuredLimit: "abc",
      trustBarItems: "Primeiro, Segundo",
      homeSectionsOrder: "hero, featured, invalido",
    });

    expect(settings.featuredMode).toBe("featuredFlag");
    expect(settings.featuredRecipeIds).toEqual(["r1", "r2"]);
    expect(settings.featuredLimit).toBe(7);
    expect(settings.trustBarItems).toEqual(["Primeiro", "Segundo"]);
    expect(settings.homeSectionsOrder).toEqual(["hero", "featured"]);
  });
});
