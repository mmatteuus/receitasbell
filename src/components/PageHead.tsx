import { Helmet } from "react-helmet-async";

export type SeoMeta = {
  title: string;
  description?: string;
  imageUrl?: string;
  canonicalPath?: string;
  noindex?: boolean;
  ogType?: "website" | "article";
};

const SITE_NAME = "Receitas Bell";

export function PageHead({
  title,
  description,
  imageUrl,
  canonicalPath,
  noindex,
  ogType = "website",
}: SeoMeta) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const canonicalUrl = canonicalPath ? `${origin}${canonicalPath}` : undefined;

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:site_name" content={SITE_NAME} />
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
