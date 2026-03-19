import { Helmet } from "react-helmet-async";

interface PageHeadProps {
  title: string;
  description?: string;
  imageUrl?: string;
  canonicalPath?: string;
}

export function PageHead({ title, description, imageUrl, canonicalPath }: PageHeadProps) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta property="og:type" content="website" />
      {canonicalPath && <link rel="canonical" href={`${siteUrl}${canonicalPath}`} />}
    </Helmet>
  );
}
