import { Helmet } from "react-helmet-async";
import { useAppContext } from "@/contexts/app-context";
import { resolveSiteMeta } from "@/lib/seo/site-meta";

export type SeoMeta = {
  title: string;
  description?: string;
  imageUrl?: string;
  canonicalPath?: string;
  noindex?: boolean;
  ogType?: "website" | "article";
};

export function PageHead({
  title,
  description,
  imageUrl,
  canonicalPath,
  noindex,
  ogType = "website",
}: SeoMeta) {
  const { settings } = useAppContext();
  const { siteName, canonicalUrl } = resolveSiteMeta({
    settings,
    canonicalPath,
  });

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={title} />
      <meta property="og:type" content={ogType} />
      {description && <meta property="og:description" content={description} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta name="twitter:card" content={imageUrl ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}
    </Helmet>
  );
}
