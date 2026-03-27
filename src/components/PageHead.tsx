import { Helmet } from "react-helmet-async";

interface PageHeadProps {
  title: string;
  description?: string;
  imageUrl?: string;
  canonicalPath?: string;
  noindex?: boolean;
}

export function PageHead({ title, description, imageUrl, canonicalPath, noindex }: PageHeadProps) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Helmet>
      <title>{title}</title>
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta property="og:type" content="website" />
      {canonicalPath && <link rel="canonical" href={`${siteUrl}${canonicalPath}`} />}
    </Helmet>
  );
}
